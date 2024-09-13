use anchor_lang::prelude::*;

use mpl_core::ID as CORE_PROGRAM_ID;

use crate::{
    constants::{AUTHORITY_SEED, DATA_SEED},
    utils::{
        approve_asset_collection_delegate, revoke_asset_collection_delegate,
        CollectionPluginAuthorityHelperAccounts,
    },
    FusionDataV1,
};

pub fn handler_redelegate_v1(ctx: Context<RedelegateV1Ctx>) -> Result<()> {
    let redelegate_accounts = CollectionPluginAuthorityHelperAccounts {
        payer: ctx.accounts.authority.to_account_info(),
        collection: ctx.accounts.collection.to_account_info(),
        authority_pda: ctx.accounts.authority_pda.to_account_info(),
        core_program: ctx.accounts.core_program.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
    };

    revoke_asset_collection_delegate(
        &redelegate_accounts,
        [AUTHORITY_SEED.as_bytes(), &[ctx.bumps.authority_pda]],
    )?;

    approve_asset_collection_delegate(&redelegate_accounts)
}

/// Revoke the authority_pda from the collection delegate and
/// re-approve the authority PDA as the new authority.
#[derive(Accounts)]
pub struct RedelegateV1Ctx<'info> {
    /// Fusion data account.
    #[account(mut, has_one = authority, seeds = [DATA_SEED.as_bytes()], bump)]
    fusion_data: Account<'info, FusionDataV1>,

    /// Authority PDA account.
    /// CHECK: account checked in seeds constraint
    #[account(seeds = [AUTHORITY_SEED.as_bytes()], bump)]
    authority_pda: UncheckedAccount<'info>,

    /// Authority and payer of the transaction.
    #[account(mut)]
    authority: Signer<'info>,

    /// Collection account
    /// CHECK: account checked in address constraint
    #[account(
        mut,
        address = fusion_data.collection,
    )]
    collection: UncheckedAccount<'info>,

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
