use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount, Transfer},
};
use mpl_core::{
    accounts::{BaseAssetV1, BaseCollectionV1},
    types::UpdateAuthority,
    ID as CORE_PROGRAM_ID,
};

use crate::{
    constants::{AUTHORITY_SEED, DATA_SEED, PROTOCOL_FEE, PROTOCOL_FEE_WALLET},
    errors::FusionError,
    utils::*,
    FusionDataV1,
};

/// Accounts for CPI calls
pub(crate) struct FusionFromAccountsV1<'info> {
    // payer
    pub payer: AccountInfo<'info>,
    // program pda
    pub authority_pda: AccountInfo<'info>,
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

pub fn handler_fusion_from_v1<'info>(
    ctx: Context<'_, '_, '_, 'info, FusionFromV1Ctx<'info>>,
) -> Result<()> {
    let fusion = &mut ctx.accounts.fusion_data;
    let accounts = FusionFromAccountsV1 {
        // payer
        payer: ctx.accounts.user.to_account_info(),
        // program pda
        authority_pda: ctx.accounts.authority_pda.to_account_info(),
        // token related accounts
        token_mint: ctx.accounts.token_mint.to_account_info(),
        from: ctx.accounts.escrow_ata_pda.to_account_info(),
        to: ctx.accounts.user_ata.to_account_info(),
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

    process_burn(fusion, &accounts)?;

    process_transfer(fusion, &accounts, ctx.bumps.authority_pda)?;

    sol_transfer(
        accounts.payer.to_account_info(),
        ctx.accounts.fee_account.to_account_info(),
        PROTOCOL_FEE,
    )?;

    Ok(())
}

/// Transfers tokens from the escrow to the user token account.
pub(crate) fn process_transfer(
    fusion: &mut Account<'_, FusionDataV1>,
    accounts: &FusionFromAccountsV1,
    bump: u8,
) -> Result<()> {
    let authority_seeds = &[AUTHORITY_SEED.as_bytes(), &[bump]];
    let signer_seeds = &[&authority_seeds[..]];

    // (1) sanity checks

    // is not paused
    fusion.validate()?;

    // double check that we got the correct token mint
    if !cmp_pubkeys(&accounts.token_mint.key(), &fusion.token_mint) {
        return err!(FusionError::TokenKeyMismatch);
    }

    // get transfer amount
    let transfer_amount = fusion.fee_data.escrow_amount;

    // (2) transfer
    if transfer_amount > 0 {
        let cpi_ctx = CpiContext::new_with_signer(
            accounts.token_program.to_account_info(),
            Transfer {
                from: accounts.from.to_account_info(),
                to: accounts.to.to_account_info(),
                authority: accounts.authority_pda.to_account_info(),
            },
            signer_seeds,
        );

        anchor_spl::token::transfer(cpi_ctx, transfer_amount)?;
        msg!("Escrow: {} SPL", transfer_amount);
    }
    Ok(())
}

/// Burn Asset
pub(crate) fn process_burn(
    fusion: &mut Account<'_, FusionDataV1>,
    accounts: &FusionFromAccountsV1,
) -> Result<()> {
    // (1) sanity checks

    // is not paused
    fusion.validate()?;

    if accounts.asset.data_is_empty() {
        return err!(FusionError::MetadataAccountIsEmpty);
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

    // check that the collection of the asset is correct
    let asset_metadata = BaseAssetV1::try_from(&accounts.asset.to_account_info())?;
    match asset_metadata.update_authority {
        UpdateAuthority::Collection(collection) => {
            if !cmp_pubkeys(&collection, &accounts.collection.key()) {
                return err!(FusionError::CollectionKeyMismatch);
            }
        }
        _ => return err!(FusionError::MissingCollectionMint),
    }

    // (2) prepare an asset to burn

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

    msg!("Asset: {} burned", asset_metadata.name);

    // (3) burning
    burn_asset_v1(accounts)
}

/// Fusion tokens from an asset.
#[derive(Accounts)]
pub struct FusionFromV1Ctx<'info> {
    /// Fusion data account.
    #[account(seeds = [DATA_SEED.as_bytes()], bump)]
    fusion_data: Account<'info, FusionDataV1>,

    /// Authority pda.
    /// CHECK: account checked in seeds constraint
    #[account(seeds = [AUTHORITY_SEED.as_bytes()], bump)]
    authority_pda: UncheckedAccount<'info>,

    /// Asset owner, transaction and rent payer.
    #[account(mut)]
    user: Signer<'info>,

    /// Account of the asset.
    #[account(
        mut,
        constraint = asset.owner == user.key(),
        constraint = asset.update_authority == UpdateAuthority::Collection(collection.key()),
    )]
    asset: Account<'info, BaseAssetV1>,

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

    /// User ata account, will be initialized if needed.
    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = token_mint,
        associated_token::authority = user
    )]
    user_ata: Account<'info, TokenAccount>,

    /// Protocol fee account.
    /// CHECK: checked by account constraint
    #[account(
        mut,
        address = PROTOCOL_FEE_WALLET @ FusionError::InvalidProtocolFeeWallet
    )]
    fee_account: UncheckedAccount<'info>,

    /// Token program.
    token_program: Program<'info, Token>,

    /// Associated Token program.
    associated_token_program: Program<'info, AssociatedToken>,

    /// MPL Core program.
    /// CHECK: checked by account constraint
    #[account(address = CORE_PROGRAM_ID)]
    core_program: UncheckedAccount<'info>,

    /// System program.
    system_program: Program<'info, System>,

    /// The SPL Noop program.
    /// CHECK: Checked in mpl-core.
    log_wrapper: Option<AccountInfo<'info>>,
}
