use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};
use mpl_core::{
    accounts::BaseCollectionV1,
    types::{PluginAuthority, PluginType},
    ID as CORE_PROGRAM_ID,
};

use crate::{
    constants::{AUTHORITY_SEED, DATA_SEED},
    utils::{
        approve_collection_authority_v1, ApproveCollectionPluginAuthorityV1Args,
        CollectionPluginAuthorityV1Accounts,
    },
    AssetDataV1, FusionDataV1, TokenDataV1,
};

pub fn handler_init_v1(
    ctx: Context<InitV1Ctx>,
    asset_data: AssetDataV1,
    token_data: TokenDataV1,
) -> Result<()> {
    // validation
    asset_data.validate()?;
    token_data.validate()?;
    // accounts
    ctx.accounts.fusion_data.authority = ctx.accounts.authority.key();
    ctx.accounts.fusion_data.token_mint = ctx.accounts.token_mint.key();
    ctx.accounts.fusion_data.collection = ctx.accounts.collection.key();

    // data
    ctx.accounts.fusion_data.asset_data = asset_data;
    ctx.accounts.fusion_data.token_data = token_data;

    // approves the metadata delegate so the program can verify minted NFTs
    let approve_accounts = CollectionPluginAuthorityV1Accounts {
        collection: ctx.accounts.collection.to_account_info(),
        payer: ctx.accounts.payer.to_account_info(),
        authority: Some(ctx.accounts.authority.to_account_info()),
        core_program: ctx.accounts.core_program.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
        log_wrapper: ctx
            .accounts
            .log_wrapper
            .as_ref()
            .map(|log_wrapper| log_wrapper.to_account_info()),
    };

    let approve_args = ApproveCollectionPluginAuthorityV1Args {
        plugin_type: PluginType::UpdateDelegate,
        new_authority: PluginAuthority::Address {
            address: ctx.accounts.authority_pda.key(),
        },
    };

    approve_collection_authority_v1(approve_accounts, approve_args)
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
