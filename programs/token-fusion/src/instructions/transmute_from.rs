use anchor_lang::{prelude::*, solana_program::sysvar};
use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::mpl_token_metadata::{
        self,
        accounts::Metadata,
        instructions::{
            CreateV1CpiBuilder, MintV1CpiBuilder, UpdateV1CpiBuilder, VerifyCollectionV1CpiBuilder,
        },
        types::{Collection, PrintSupply, RuleSetToggle, TokenStandard},
    },
    token::{burn, transfer, Burn, Mint, Token, TokenAccount, Transfer},
};

use crate::{
    constants::{AUTHORITY_SEED, DATA_SEED, MPL_TOKEN_AUTH_RULES_PROGRAM},
    errors::FactoryError,
    utils::*,
    AssetDataFilled, TransmuteFactory,
};

/// Accounts for CPI calls
pub(crate) struct Accounts<'info> {
    // payer
    pub payer: AccountInfo<'info>,
    // program pda
    pub authority_pda: AccountInfo<'info>,
    //token related accounts
    pub token_mint: AccountInfo<'info>,
    pub from: AccountInfo<'info>,
    pub to: AccountInfo<'info>,
    // asset related accounts
    pub nft_owner: AccountInfo<'info>,
    pub nft_mint: AccountInfo<'info>,
    pub nft_mint_authority: AccountInfo<'info>,
    pub nft_metadata: AccountInfo<'info>,
    pub nft_master_edition: AccountInfo<'info>,
    pub token: Option<AccountInfo<'info>>,
    pub token_record: Option<AccountInfo<'info>>,
    pub collection_delegate_record: AccountInfo<'info>,
    pub collection_mint: AccountInfo<'info>,
    pub collection_metadata: AccountInfo<'info>,
    pub collection_master_edition: AccountInfo<'info>,
    pub collection_update_authority: AccountInfo<'info>,
    // programs
    pub token_metadata_program: AccountInfo<'info>,
    pub spl_token_program: AccountInfo<'info>,
    pub spl_ata_program: Option<AccountInfo<'info>>,
    pub system_program: AccountInfo<'info>,
    pub sysvar_instructions: Option<AccountInfo<'info>>,
}

pub fn transmute_from<'info>(ctx: Context<'_, '_, '_, 'info, TransmuteFrom<'info>>) -> Result<()> {
    let factory = &mut ctx.accounts.factory;
    let accounts = Accounts {
        // payer
        payer: ctx.accounts.user.to_account_info(),
        // program pda
        authority_pda: ctx.accounts.authority_pda.to_account_info(),
        // token related accounts
        token_mint: ctx.accounts.token_mint.to_account_info(),
        from: ctx.accounts.user_token_ata.to_account_info(),
        to: ctx.accounts.token_treasure.to_account_info(),
        // asset related accounts
        nft_owner: ctx.accounts.asset_owner.to_account_info(),
        nft_mint: ctx.accounts.asset_mint.to_account_info(),
        // TODO Change to program account maybe?
        nft_mint_authority: ctx.accounts.asset_owner.to_account_info(),
        nft_metadata: ctx.accounts.asset_metadata.to_account_info(),
        nft_master_edition: ctx.accounts.asset_master_edition.to_account_info(),
        token: ctx
            .accounts
            .asset_token
            .as_ref()
            .map(|token| token.to_account_info()),
        token_record: ctx
            .accounts
            .asset_token_record
            .as_ref()
            .map(|token_record| token_record.to_account_info()),
        collection_delegate_record: ctx.accounts.collection_delegate_record.to_account_info(),
        collection_mint: ctx.accounts.collection_mint.to_account_info(),
        collection_metadata: ctx.accounts.collection_metadata.to_account_info(),
        collection_master_edition: ctx.accounts.collection_master_edition.to_account_info(),
        collection_update_authority: ctx.accounts.collection_update_authority.to_account_info(),
        // programs
        token_metadata_program: ctx.accounts.token_metadata_program.to_account_info(),
        spl_token_program: ctx.accounts.token_program.to_account_info(),
        spl_ata_program: Some(ctx.accounts.associated_token_program.to_account_info()),
        system_program: ctx.accounts.system_program.to_account_info(),
        sysvar_instructions: Some(ctx.accounts.sysvar_instructions.to_account_info()),
    };
    process_burn_and_transfer(factory, &accounts)?;
    process_mint(factory, &accounts, ctx.bumps.authority_pda)
}

/// Transfers tokens to the treasure and burn some of them.
pub(crate) fn process_burn_and_transfer(
    factory: &mut Account<'_, TransmuteFactory>,
    accounts: &Accounts,
) -> Result<()> {
    // (1) sanity checks

    // validate if factory is not paused
    factory.validate()?;

    // check that we got the correct token mint
    if !cmp_pubkeys(&accounts.token_mint.key(), &factory.token_mint) {
        return err!(FactoryError::TokenKeyMismatch);
    }

    // calc amounts
    let burn_amount = factory.token_data.burn_amount();
    let transfer_amount = factory.token_data.token_into_amount;

    // (2) burn
    let cpi_ctx = CpiContext::new(
        accounts.spl_token_program.to_account_info(),
        Burn {
            mint: accounts.token_mint.to_account_info(),
            from: accounts.from.to_account_info(),
            authority: accounts.payer.to_account_info(),
        },
    );

    burn(cpi_ctx, burn_amount)?;
    msg!("Burned {} tokens", burn_amount);

    // (3) transfer
    let cpi_ctx = CpiContext::new(
        accounts.spl_token_program.to_account_info(),
        Transfer {
            from: accounts.from.to_account_info(),
            to: accounts.to.to_account_info(),
            authority: accounts.payer.to_account_info(),
        },
    );

    transfer(cpi_ctx, transfer_amount)?;
    msg!("Transferred {} tokens", transfer_amount);
    Ok(())
}

/// Mint a new NFT.
pub(crate) fn process_mint(
    factory: &mut Account<'_, TransmuteFactory>,
    accounts: &Accounts,
    bump: u8,
) -> Result<()> {
    // (1) sanity checks

    // validate if factory is not paused
    factory.validate()?;

    if !accounts.nft_metadata.data_is_empty() {
        return err!(FactoryError::MetadataAccountMustBeEmpty);
    }
    // check that we got the correct collection mint
    // checked in account constraints
    if !cmp_pubkeys(&accounts.collection_mint.key(), &factory.collection_mint) {
        return err!(FactoryError::CollectionKeyMismatch);
    }

    // collection metadata must be owner by token metadata
    if !cmp_pubkeys(accounts.collection_metadata.owner, &mpl_token_metadata::ID) {
        return err!(FactoryError::IncorrectOwner);
    }

    let collection_metadata_info = &accounts.collection_metadata;
    let collection_metadata: Metadata =
        Metadata::try_from(&collection_metadata_info.to_account_info())?;
    // check that the update authority matches the collection update authority
    if !cmp_pubkeys(
        &collection_metadata.update_authority,
        &accounts.collection_update_authority.key(),
    ) {
        return err!(FactoryError::IncorrectCollectionAuthority);
    }

    // (2) selecting an item to mint

    let asset_data = factory.asset_data.get_filled_data();
    msg!("Minting asset: {:?}", asset_data);

    // increase next index
    factory.asset_data.asset_next_index = factory
        .asset_data
        .asset_next_index
        .checked_add(1)
        .ok_or(FactoryError::NumericalOverflowError)?;

    let mut creators: Vec<mpl_token_metadata::types::Creator> =
        vec![mpl_token_metadata::types::Creator {
            address: accounts.authority_pda.key(),
            verified: true,
            share: 0,
        }];

    for c in &factory.asset_data.asset_creators {
        creators.push(mpl_token_metadata::types::Creator {
            address: c.address,
            verified: false,
            share: c.percentage_share,
        });
    }

    // (3) minting

    create_and_mint(
        factory,
        accounts,
        bump,
        asset_data,
        creators,
        collection_metadata,
    )
}
/// Creates the metadata accounts and mint a new token.
fn create_and_mint(
    factory: &mut Account<'_, TransmuteFactory>,
    accounts: &Accounts,
    bump: u8,
    asset_data: AssetDataFilled,
    creators: Vec<mpl_token_metadata::types::Creator>,
    collection_metadata: Metadata,
) -> Result<()> {
    let authority_seeds = [AUTHORITY_SEED.as_bytes(), &[bump]];

    let sysvar_instructions_info = accounts
        .sysvar_instructions
        .as_ref()
        .ok_or(FactoryError::MissingInstructionsSysvar)?;

    // create metadata accounts

    CreateV1CpiBuilder::new(&accounts.token_metadata_program)
        .metadata(&accounts.nft_metadata)
        .mint(&accounts.nft_mint, accounts.nft_mint.is_signer)
        .authority(&accounts.nft_mint_authority)
        .payer(&accounts.payer)
        .update_authority(&accounts.authority_pda, true)
        .master_edition(Some(&accounts.nft_master_edition))
        .token_standard(TokenStandard::ProgrammableNonFungible)
        .name(asset_data.name)
        .uri(asset_data.uri)
        .symbol(factory.asset_data.asset_symbol.to_string())
        .seller_fee_basis_points(factory.asset_data.asset_seller_fee_basis_points)
        .is_mutable(true) // true by default
        .creators(creators)
        .collection(Collection {
            verified: false,
            key: factory.collection_mint,
        })
        .decimals(0)
        .print_supply(PrintSupply::Zero)
        .system_program(&accounts.system_program)
        .sysvar_instructions(sysvar_instructions_info)
        .spl_token_program(Some(&accounts.spl_token_program))
        .invoke_signed(&[&authority_seeds])?;

    // mints one token

    let token_info = accounts
        .token
        .as_ref()
        .ok_or(FactoryError::MissingTokenAccount)?;
    let token_record_info = accounts
        .token_record
        .as_ref()
        .ok_or(FactoryError::MissingTokenRecord)?;

    let spl_ata_program_info = accounts
        .spl_ata_program
        .as_ref()
        .ok_or(FactoryError::MissingSplAtaProgram)?;

    MintV1CpiBuilder::new(&accounts.token_metadata_program)
        .token(token_info)
        // if we are initializing a new token account, we need to pass the
        // token owner; otherwise, we pass `None`
        .token_owner(if token_info.data_is_empty() {
            Some(&accounts.nft_owner)
        } else {
            None
        })
        .metadata(&accounts.nft_metadata)
        .master_edition(Some(&accounts.nft_master_edition))
        .mint(&accounts.nft_mint)
        .payer(&accounts.payer)
        .authority(&accounts.authority_pda)
        .token_record(Some(token_record_info))
        .system_program(&accounts.system_program)
        .sysvar_instructions(sysvar_instructions_info)
        .spl_token_program(&accounts.spl_token_program)
        .spl_ata_program(spl_ata_program_info)
        .amount(1)
        .invoke_signed(&[&authority_seeds])?;

    // changes the update authority, primary sale happened, authorization rules

    let mut update_cpi = UpdateV1CpiBuilder::new(&accounts.token_metadata_program);
    update_cpi
        .authority(&accounts.authority_pda)
        .token(Some(token_info))
        .metadata(&accounts.nft_metadata)
        .edition(Some(&accounts.nft_master_edition))
        .mint(&accounts.nft_mint)
        .payer(&accounts.payer)
        .system_program(&accounts.system_program)
        .sysvar_instructions(sysvar_instructions_info)
        .primary_sale_happened(true)
        .new_update_authority(collection_metadata.update_authority);

    // the rule set for a newly minted pNFT is determined by:
    //   1. check if there is a rule set stored on the account; otherwise
    //   2. use the rule set from the collection metadata

    if let Some(rule_set) = factory.rule_set {
        update_cpi.rule_set(RuleSetToggle::Set(rule_set));
    }

    update_cpi.invoke_signed(&[&authority_seeds])?;

    // verify the minted nft into the collection

    VerifyCollectionV1CpiBuilder::new(&accounts.token_metadata_program)
        .authority(&accounts.authority_pda)
        .delegate_record(Some(&accounts.collection_delegate_record))
        .metadata(&accounts.nft_metadata)
        .collection_mint(&accounts.collection_mint)
        .collection_metadata(Some(&accounts.collection_metadata))
        .collection_master_edition(Some(&accounts.collection_master_edition))
        .system_program(&accounts.system_program)
        .sysvar_instructions(sysvar_instructions_info)
        .invoke_signed(&[&authority_seeds])
        .map_err(|error| error.into())
}

/// Transmute Tokens into NFT.
#[derive(Accounts)]
pub struct TransmuteFrom<'info> {
    /// Transmute Factory data account.
    #[account(mut, seeds = [DATA_SEED.as_bytes()], bump)]
    factory: Account<'info, TransmuteFactory>,

    /// Transmute Factory PDA account. This is the account that holds a delegate
    /// to verify an item into the collection and token treasure authority.
    ///
    /// CHECK: account checked in seeds constraint
    #[account(seeds = [AUTHORITY_SEED.as_bytes()], bump)]
    authority_pda: UncheckedAccount<'info>,

    /// Payer for the transaction and account allocation.
    /// Mint authority of the Asset.
    /// Authority of the token associated account.
    #[account(mut)]
    user: Signer<'info>,

    /// Asset account owner. Can be any account.
    /// Asset minted to this account as an owner.
    ///
    /// CHECK: account not written or read from
    asset_owner: UncheckedAccount<'info>,

    /// Mint account of the Asset. The account will be initialized if necessary.
    ///
    /// CHECK: account checked in CPI
    #[account(mut)]
    asset_mint: Signer<'info>,

    /// Metadata account of the Asset. This account must be uninitialized.
    ///
    /// CHECK: account checked in CPI
    #[account(mut)]
    asset_metadata: UncheckedAccount<'info>,

    /// Master edition account of the Asset. The account will be initialized if necessary.
    ///
    /// CHECK: account checked in CPI
    #[account(mut)]
    asset_master_edition: UncheckedAccount<'info>,

    /// Destination token account (required for pNFT).
    ///
    /// CHECK: account checked in CPI
    #[account(mut)]
    asset_token: Option<UncheckedAccount<'info>>,

    /// Token record (required for pNFT).
    ///
    /// CHECK: account checked in CPI
    #[account(mut)]
    asset_token_record: Option<UncheckedAccount<'info>>,

    /// Collection authority or metadata delegate record.
    ///
    /// CHECK: account checked in CPI
    collection_delegate_record: UncheckedAccount<'info>,

    /// Mint account of the collection Asset.
    ///
    /// CHECK: account constraints checked in account trait
    #[account(address = factory.collection_mint)]
    collection_mint: UncheckedAccount<'info>,

    /// Metadata account of the collection Asset.
    ///
    /// CHECK: account checked in CPI
    #[account(mut)]
    collection_metadata: UncheckedAccount<'info>,

    /// Master edition account of the collection Asset.
    ///
    /// CHECK: account checked in CPI
    collection_master_edition: UncheckedAccount<'info>,

    /// Update authority of the collection Asset.
    ///
    /// CHECK: account checked in CPI
    collection_update_authority: UncheckedAccount<'info>,

    /// Mint account of the token.
    #[account(mut, address = factory.token_mint)]
    token_mint: Account<'info, Mint>,

    /// Token treasure associated account with authority_pda as authority.
    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = authority_pda
    )]
    token_treasure: Account<'info, TokenAccount>,

    /// Associated token account with user as authority.
    /// Tokens transferred from this account to token treasure.
    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = user
    )]
    user_token_ata: Account<'info, TokenAccount>,

    /// Token Metadata program.
    ///
    /// CHECK: account checked in CPI
    #[account(address = mpl_token_metadata::ID)]
    token_metadata_program: UncheckedAccount<'info>,

    /// SPL Token program.
    token_program: Program<'info, Token>,

    /// SPL Associated Token program.
    associated_token_program: Program<'info, AssociatedToken>,

    /// System program.
    system_program: Program<'info, System>,

    /// Instructions sysvar account.
    ///
    /// CHECK: account constraints checked in account trait
    #[account(address = sysvar::instructions::id())]
    sysvar_instructions: UncheckedAccount<'info>,

    /// Token Authorization Rules program.
    ///
    /// CHECK: account checked in CPI
    #[account(address = MPL_TOKEN_AUTH_RULES_PROGRAM)]
    authorization_rules_program: Option<UncheckedAccount<'info>>,

    /// Token Authorization rules account for the collection metadata (if any).
    ///
    /// CHECK: account constraints checked in account trait
    #[account(owner = MPL_TOKEN_AUTH_RULES_PROGRAM)]
    authorization_rules: Option<UncheckedAccount<'info>>,
}
