use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};
use mpl_core::{accounts::BaseCollectionV1, ID as CORE_PROGRAM_ID};

use crate::{
    constants::{AUTHORITY_SEED, DATA_SEED},
    utils::{approve_asset_collection_delegate, CollectionPluginAuthorityHelperAccounts},
    AssetDataV1, FeeDataV1, FusionDataV1,
};

pub fn handler_init_v1(
    ctx: Context<InitV1Ctx>,
    asset_data: AssetDataV1,
    fee_data: FeeDataV1,
) -> Result<()> {
    // validation
    asset_data.validate()?;
    fee_data.validate()?;
    // accounts
    ctx.accounts.fusion_data.authority = ctx.accounts.authority.key();
    ctx.accounts.fusion_data.token_mint = ctx.accounts.token_mint.key();
    ctx.accounts.fusion_data.collection = ctx.accounts.collection.key();

    // data
    ctx.accounts.fusion_data.asset_data = asset_data;
    ctx.accounts.fusion_data.fee_data = fee_data;

    // approves the metadata delegate so the program can verify minted NFTs
    let approve_accounts = CollectionPluginAuthorityHelperAccounts {
        payer: ctx.accounts.payer.to_account_info(),
        collection: ctx.accounts.collection.to_account_info(),
        authority_pda: ctx.accounts.authority_pda.to_account_info(),
        core_program: ctx.accounts.core_program.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
    };

    approve_asset_collection_delegate(approve_accounts)
}

/// Initializes a new fusion data account.
#[derive(Accounts)]
pub struct InitV1Ctx<'info> {
    /// Fusion data account.
    #[account(
        init,
        payer = payer,
        space = 8 + FusionDataV1::INIT_SPACE,
        seeds = [DATA_SEED.as_bytes()],
        bump
    )]
    fusion_data: Account<'info, FusionDataV1>,

    /// Authority PDA used to verify minted NFTs to the collection
    /// and to authorize transfers from token escrow.
    ///
    /// CHECK: account checked in seeds constraint
    #[account(
        mut,
        seeds = [AUTHORITY_SEED.as_bytes()],
        bump
    )]
    authority_pda: UncheckedAccount<'info>,

    /// Authority. This is the address that controls the upate of the program.
    /// And is also the authority of the collection.
    /// Must be a signer.
    authority: Signer<'info>,

    /// Payer of the transaction.
    #[account(mut)]
    payer: Signer<'info>,

    /// Mint account of the token.
    token_mint: Account<'info, Mint>,

    /// Token escrow pda ata account.
    #[account(
        init,
        payer = payer,
        associated_token::mint = token_mint,
        associated_token::authority = authority_pda
    )]
    escrow_ata_pda: Account<'info, TokenAccount>,

    /// Collection account
    #[account(
        mut,
        constraint = collection.update_authority == authority.key(),
    )]
    collection: Account<'info, BaseCollectionV1>,

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
