use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Burn, Mint, Token, TokenAccount, Transfer},
};

use mpl_core::{accounts::BaseCollectionV1, ID as CORE_PROGRAM_ID};

use crate::{
    constants::{AUTHORITY_SEED, DATA_SEED, PROTOCOL_FEE, PROTOCOL_FEE_WALLET},
    errors::FusionError,
    utils::{cmp_pubkeys, create_asset_v1, sol_transfer, AssetV1Accounts, CreateV1Args},
    AssetDataV1, FusionDataV1,
};

/// Accounts for CPI calls
pub(crate) struct FusionIntoAccountsV1<'info> {
    // payer
    pub payer: AccountInfo<'info>,
    //token related accounts
    pub token_mint: AccountInfo<'info>,
    pub from: AccountInfo<'info>,
    pub to: AccountInfo<'info>,
    // asset related accounts
    pub asset: AccountInfo<'info>,
    pub collection: AccountInfo<'info>,
    // programs
    pub token_program: AccountInfo<'info>,
    pub core_program: AccountInfo<'info>,
    pub system_program: AccountInfo<'info>,
    pub log_wrapper: Option<AccountInfo<'info>>,
}

impl From<&AssetDataV1> for CreateV1Args {
    fn from(asset_data: &AssetDataV1) -> Self {
        Self {
            name: format!("{}{}", asset_data.name_prefix, asset_data.next_index),
            uri: format!(
                "{}{}{}",
                asset_data.uri_prefix, asset_data.next_index, asset_data.uri_suffix
            ),
        }
    }
}

pub fn handler_fusion_into_v1<'info>(
    ctx: Context<'_, '_, '_, 'info, FusionIntoV1Ctx<'info>>,
) -> Result<()> {
    let fusion = &mut ctx.accounts.fusion_data;
    let accounts = FusionIntoAccountsV1 {
        // payer
        payer: ctx.accounts.user.to_account_info(),
        // token related accounts
        token_mint: ctx.accounts.token_mint.to_account_info(),
        from: ctx.accounts.user_ata.to_account_info(),
        to: ctx.accounts.escrow_ata_pda.to_account_info(),
        // asset related accounts
        asset: ctx.accounts.asset.to_account_info(),
        collection: ctx.accounts.collection.to_account_info(),
        // programs
        token_program: ctx.accounts.token_program.to_account_info(),
        core_program: ctx.accounts.core_program.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
        log_wrapper: ctx
            .accounts
            .log_wrapper
            .as_ref()
            .map(|log_wrapper| log_wrapper.to_account_info()),
    };

    sol_transfer(
        accounts.payer.to_account_info(),
        ctx.accounts.fee_sol_account.to_account_info(),
        PROTOCOL_FEE,
    )?;

    process_burn_and_transfer(fusion, &accounts)?;

    process_mint(fusion, &accounts, ctx.bumps.authority_pda)
}

/// Transfers tokens to the escrow and burn some of them.
pub(crate) fn process_burn_and_transfer(
    fusion: &mut Account<'_, FusionDataV1>,
    accounts: &FusionIntoAccountsV1,
) -> Result<()> {
    // (1) sanity checks

    // is not paused
    fusion.validate()?;

    // double check that we got the correct token mint
    if !cmp_pubkeys(&accounts.token_mint.key(), &fusion.token_mint) {
        return err!(FusionError::TokenKeyMismatch);
    }

    // calc amounts
    let burn_amount = fusion.token_data.burn_amount();
    let transfer_amount = fusion.token_data.into_amount;

    // (2) burn
    let cpi_ctx = CpiContext::new(
        accounts.token_program.to_account_info(),
        Burn {
            mint: accounts.token_mint.to_account_info(),
            from: accounts.from.to_account_info(),
            authority: accounts.payer.to_account_info(),
        },
    );

    anchor_spl::token::burn(cpi_ctx, burn_amount)?;
    msg!("Burned {} tokens", burn_amount);

    // (3) transfer
    let cpi_ctx = CpiContext::new(
        accounts.token_program.to_account_info(),
        Transfer {
            from: accounts.from.to_account_info(),
            to: accounts.to.to_account_info(),
            authority: accounts.payer.to_account_info(),
        },
    );

    anchor_spl::token::transfer(cpi_ctx, transfer_amount)?;
    msg!("Transferred {} tokens", transfer_amount);
    Ok(())
}

/// Mint a new NFT.
pub(crate) fn process_mint(
    fusion: &mut Account<'_, FusionDataV1>,
    accounts: &FusionIntoAccountsV1,
    bump: u8,
) -> Result<()> {
    // (1) sanity checks

    // is not paused
    fusion.validate()?;

    if !accounts.asset.data_is_empty() {
        return err!(FusionError::MetadataAccountMustBeEmpty);
    }
    // double check that we got the correct collection mint
    // also checked in account constraints
    if !cmp_pubkeys(&accounts.collection.key(), &fusion.collection) {
        return err!(FusionError::CollectionKeyMismatch);
    }

    // collection must be owned by mpl_core program
    if !cmp_pubkeys(accounts.collection.owner, &CORE_PROGRAM_ID) {
        return err!(FusionError::IncorrectOwner);
    }

    // current collection minted assets should be less then max supply
    let collection_metadata = BaseCollectionV1::try_from(&accounts.collection.to_account_info())?;
    if collection_metadata.current_size > fusion.asset_data.max_supply.unwrap_or(u32::MAX) {
        return err!(FusionError::MaxSupplyReached);
    }

    // (2) prepare an asset to mint

    // asset accounts
    let accounts = AssetV1Accounts {
        asset: accounts.asset.to_account_info(),
        collection: Some(accounts.collection.to_account_info()),
        payer: accounts.payer.to_account_info(),
        core_program: accounts.core_program.to_account_info(),
        system_program: accounts.system_program.to_account_info(),
        log_wrapper: accounts
            .log_wrapper
            .as_ref()
            .map(|log_wrapper| log_wrapper.to_account_info()),
    };

    // asset args
    let args = CreateV1Args::from(&fusion.asset_data);

    msg!("Minting asset: {:?}", args);

    // increase next index
    fusion.asset_data.next_index = fusion
        .asset_data
        .next_index
        .checked_add(1)
        .ok_or(FusionError::NumericalOverflowError)?;

    // (3) minting
    create_asset_v1(accounts, args, [AUTHORITY_SEED.as_bytes(), &[bump]])
}

/// Fusion tokens into a NFT.
#[derive(Accounts)]
pub struct FusionIntoV1Ctx<'info> {
    /// Fusion data account.
    #[account(mut, seeds = [DATA_SEED.as_bytes()], bump)]
    fusion_data: Account<'info, FusionDataV1>,

    /// Authority pda.
    ///
    /// CHECK: account checked in seeds constraint
    #[account(seeds = [AUTHORITY_SEED.as_bytes()], bump)]
    authority_pda: UncheckedAccount<'info>,

    /// Transaction and rent payer.
    /// Asset owner
    #[account(mut)]
    user: Signer<'info>,

    /// Account of the Asset. Will be initialized with the new asset.
    #[account(mut)]
    asset: Signer<'info>,

    /// Collection account.
    #[account(mut, address = fusion_data.collection, owner = CORE_PROGRAM_ID)]
    collection: Account<'info, BaseCollectionV1>,

    /// Mint account of the token.
    #[account(address = fusion_data.token_mint)]
    token_mint: Account<'info, Mint>,

    /// Token escrow pda ata account.
    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = authority_pda
    )]
    escrow_ata_pda: Account<'info, TokenAccount>,

    /// User ata account
    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = user
    )]
    user_ata: Account<'info, TokenAccount>,

    /// CHECK: We check against constant
    #[account(
        mut,
        address = PROTOCOL_FEE_WALLET @ FusionError::InvalidProtocolFeeWallet
    )]
    fee_sol_account: UncheckedAccount<'info>,

    /// Token program.
    token_program: Program<'info, Token>,

    /// Associated Token program.
    ata_program: Program<'info, AssociatedToken>,

    /// CHECK: checked by account constraint
    #[account(address = CORE_PROGRAM_ID)]
    core_program: UncheckedAccount<'info>,

    /// System program.
    system_program: Program<'info, System>,

    /// The SPL Noop program.
    /// CHECK: Checked in mpl-core.
    log_wrapper: Option<AccountInfo<'info>>,
}
