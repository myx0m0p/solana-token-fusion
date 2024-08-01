use anchor_lang::{prelude::*, solana_program::sysvar};
use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::mpl_token_metadata::{self, accounts::Metadata, instructions::BurnV1CpiBuilder},
    token::{transfer, Mint, Token, TokenAccount, Transfer},
};

use crate::{
    constants::{AUTHORITY_SEED, DATA_SEED},
    errors::FactoryError,
    utils::*,
    TransmuteFactory,
};

/// Accounts for CPI calls
pub(crate) struct Accounts<'info> {
    // program pda
    pub authority_pda: AccountInfo<'info>,
    //token related accounts
    pub token_mint: AccountInfo<'info>,
    pub from: AccountInfo<'info>,
    pub to: AccountInfo<'info>,
    // asset related accounts
    pub asset_authority: AccountInfo<'info>,
    pub asset_mint: AccountInfo<'info>,
    pub asset_collection_metadata: Option<AccountInfo<'info>>,
    pub asset_metadata: AccountInfo<'info>,
    pub asset_edition: Option<AccountInfo<'info>>,
    pub asset_token: AccountInfo<'info>,
    pub asset_token_record: Option<AccountInfo<'info>>,
    // programs
    pub token_metadata_program: AccountInfo<'info>,
    pub spl_token_program: AccountInfo<'info>,
    pub system_program: AccountInfo<'info>,
    pub sysvar_instructions: AccountInfo<'info>,
}

pub fn transmute_into<'info>(ctx: Context<'_, '_, '_, 'info, TransmuteInto<'info>>) -> Result<()> {
    let factory = &mut ctx.accounts.factory;
    let accounts = Accounts {
        // program pda
        authority_pda: ctx.accounts.authority_pda.to_account_info(),
        // token related accounts
        token_mint: ctx.accounts.token_mint.to_account_info(),
        from: ctx.accounts.token_treasure.to_account_info(),
        to: ctx.accounts.user_token_ata.to_account_info(),
        // asset related accounts
        asset_authority: ctx.accounts.user.to_account_info(),
        asset_mint: ctx.accounts.asset_mint.to_account_info(),
        asset_collection_metadata: ctx
            .accounts
            .asset_collection_metadata
            .as_ref()
            .map(|collection_metadata| collection_metadata.to_account_info()),
        asset_metadata: ctx.accounts.asset_metadata.to_account_info(),
        asset_edition: ctx
            .accounts
            .asset_master_edition
            .as_ref()
            .map(|edition| edition.to_account_info()),
        asset_token: ctx.accounts.asset_token.to_account_info(),
        asset_token_record: ctx
            .accounts
            .asset_token_record
            .as_ref()
            .map(|token_record| token_record.to_account_info()),
        // programs
        token_metadata_program: ctx.accounts.token_metadata_program.to_account_info(),
        spl_token_program: ctx.accounts.token_program.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
        sysvar_instructions: ctx.accounts.sysvar_instructions.to_account_info(),
    };
    process_transfer(factory, &accounts, ctx.bumps.authority_pda)?;
    process_burn(factory, &accounts)
}

/// Transfers tokens from the treasure to the user token account.
pub(crate) fn process_transfer(
    factory: &mut Account<'_, TransmuteFactory>,
    accounts: &Accounts,
    bump: u8,
) -> Result<()> {
    let authority_seeds = &[AUTHORITY_SEED.as_bytes(), &[bump]];
    let signer_seeds = &[&authority_seeds[..]];

    // (1) sanity checks

    // validate if factory is not paused
    factory.validate()?;

    // check that we got the correct token mint
    if !cmp_pubkeys(&accounts.token_mint.key(), &factory.token_mint) {
        return err!(FactoryError::TokenKeyMismatch);
    }

    // calc amounts
    let transfer_amount = factory.token_data.token_into_amount;

    // (3) transfer
    let cpi_ctx = CpiContext::new_with_signer(
        accounts.spl_token_program.to_account_info(),
        Transfer {
            from: accounts.from.to_account_info(),
            to: accounts.to.to_account_info(),
            authority: accounts.authority_pda.to_account_info(),
        },
        signer_seeds,
    );

    transfer(cpi_ctx, transfer_amount)
}

/// Burn Asset
pub(crate) fn process_burn(
    factory: &mut Account<'_, TransmuteFactory>,
    accounts: &Accounts,
) -> Result<()> {
    // (1) sanity checks

    // validate if factory is not paused
    factory.validate()?;

    if accounts.asset_metadata.data_is_empty() {
        return err!(FactoryError::MetadataAccountIsEmpty);
    }

    // collection metadata must be owner by token metadata
    if !cmp_pubkeys(accounts.asset_metadata.owner, &mpl_token_metadata::ID) {
        return err!(FactoryError::IncorrectOwner);
    }

    // check that the colletion of the metadata is our collection
    let metadata_info = &accounts.asset_metadata;
    let asset_metadata: Metadata = Metadata::try_from(&metadata_info.to_account_info())?;
    let asset_collection = asset_metadata
        .collection
        .ok_or(FactoryError::MissingCollectionMint)?;

    if !cmp_pubkeys(&asset_collection.key, &factory.collection_mint.key()) {
        return err!(FactoryError::IncorrectCollectionMint);
    }

    // (2) burning

    BurnV1CpiBuilder::new(&accounts.token_metadata_program)
        .authority(&accounts.asset_authority)
        .mint(&accounts.asset_mint)
        .collection_metadata(accounts.asset_collection_metadata.as_ref())
        .metadata(&accounts.asset_metadata)
        .edition(accounts.asset_edition.as_ref())
        .token(&accounts.asset_token)
        .token_record(accounts.asset_token_record.as_ref())
        .system_program(&accounts.system_program)
        .sysvar_instructions(&accounts.sysvar_instructions)
        .spl_token_program(&accounts.spl_token_program)
        .invoke()
        .map_err(|error| error.into())
}

/// Transmute NFT into Tokens.
#[derive(Accounts)]
pub struct TransmuteInto<'info> {
    /// Transmute Factory data account.
    #[account(seeds = [DATA_SEED.as_bytes()], bump)]
    factory: Account<'info, TransmuteFactory>,

    /// Transmute Factory PDA account. This is the account that holds a delegate
    /// to verify an item into the collection and token treasure authority.
    ///
    /// CHECK: account checked in seeds constraint
    #[account(seeds = [AUTHORITY_SEED.as_bytes()], bump)]
    authority_pda: UncheckedAccount<'info>,

    /// Asset owner or Utility delegate
    #[account(mut)]
    user: Signer<'info>,

    /// Mint of token asset
    ///
    /// CHECK: account checked in CPI
    #[account(mut)]
    asset_mint: UncheckedAccount<'info>,

    /// Metadata of the Collection
    ///
    /// CHECK: account checked in CPI
    #[account(mut)]
    asset_collection_metadata: Option<UncheckedAccount<'info>>,

    /// Metadata (pda of ['metadata', program id, mint id])
    ///
    /// CHECK: account checked in CPI
    #[account(mut)]
    asset_metadata: UncheckedAccount<'info>,

    /// Master edition account of the Asset.
    ///
    /// CHECK: account checked in CPI
    #[account(mut)]
    asset_master_edition: Option<UncheckedAccount<'info>>,

    /// Token account to close
    ///
    /// CHECK: account checked in CPI
    #[account(mut)]
    asset_token: UncheckedAccount<'info>,

    /// Token record (required for pNFT).
    ///
    /// CHECK: account checked in CPI
    #[account(mut)]
    asset_token_record: Option<UncheckedAccount<'info>>,

    /// Mint account of the token.
    #[account(address = factory.token_mint)]
    token_mint: Account<'info, Mint>,

    /// Token treasure associated account with authority_pda as authority.
    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = authority_pda
    )]
    token_treasure: Account<'info, TokenAccount>,

    /// Associated token account with user as authority.
    /// Tokens transferred from the token treasure to the user token account.
    /// will be initialized if needed
    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = token_mint,
        associated_token::authority = user
    )]
    user_token_ata: Account<'info, TokenAccount>,

    /// Token Metadata program.
    ///
    /// CHECK: account constraint checked in account trait
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
}
