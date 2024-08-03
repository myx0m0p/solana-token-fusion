use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{CloseAccount, Mint, Token, TokenAccount, Transfer},
};
use mpl_core::types::PluginType;
use mpl_core::ID as CORE_PROGRAM_ID;

use crate::{
    constants::{AUTHORITY_SEED, DATA_SEED},
    utils::{
        revoke_collection_authority_v1, CollectionPluginAuthorityV1Accounts,
        RevokeCollectionPluginAuthorityV1Args,
    },
    FusionDataV1,
};

pub(crate) struct SplTokenAccounts<'info> {
    pub authority: AccountInfo<'info>,
    pub authority_pda: AccountInfo<'info>,
    pub from: Account<'info, TokenAccount>,
    pub to: Account<'info, TokenAccount>,
    pub spl_token_program: AccountInfo<'info>,
}

pub fn handler_destroy_v1(ctx: Context<DestroyV1Ctx>) -> Result<()> {
    let token_accounts = SplTokenAccounts {
        authority: ctx.accounts.authority.to_account_info(),
        authority_pda: ctx.accounts.authority_pda.to_account_info(),
        from: ctx.accounts.escrow_ata_pda.clone(),
        to: ctx.accounts.authority_ata.clone(),
        spl_token_program: ctx.accounts.token_program.to_account_info(),
    };

    process_transfer(token_accounts, ctx.bumps.authority_pda)?;

    // revoke program delegate
    let revoke_accounts = CollectionPluginAuthorityV1Accounts {
        collection: ctx.accounts.collection.to_account_info(),
        payer: ctx.accounts.authority.to_account_info(),
        authority: Some(ctx.accounts.authority.to_account_info()),
        core_program: ctx.accounts.core_program.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
        log_wrapper: ctx
            .accounts
            .log_wrapper
            .as_ref()
            .map(|log_wrapper| log_wrapper.to_account_info()),
    };

    let revoke_args = RevokeCollectionPluginAuthorityV1Args {
        plugin_type: PluginType::UpdateDelegate,
    };

    revoke_collection_authority_v1(revoke_accounts, revoke_args)
}

pub(crate) fn process_transfer(accounts: SplTokenAccounts, bump: u8) -> Result<()> {
    let authority_seeds = &[AUTHORITY_SEED.as_bytes(), &[bump]];
    let signer_seeds = &[&authority_seeds[..]];

    // get current balance
    let transfer_amount: u64 = accounts.from.amount;

    // transfer tokens from the escrow ata to the authority_token_ata account
    let cpi_ctx = CpiContext::new_with_signer(
        accounts.spl_token_program.to_account_info(),
        Transfer {
            from: accounts.from.to_account_info(),
            to: accounts.to.to_account_info(),
            authority: accounts.authority_pda.to_account_info(),
        },
        signer_seeds,
    );
    anchor_spl::token::transfer(cpi_ctx, transfer_amount)?;

    msg!("Transferred {} tokens", transfer_amount);

    // close token account and withdraw lamport to the authority
    let cpi_ctx = CpiContext::new_with_signer(
        accounts.spl_token_program.to_account_info(),
        CloseAccount {
            account: accounts.from.to_account_info(),
            destination: accounts.authority.to_account_info(),
            authority: accounts.authority_pda.to_account_info(),
        },
        signer_seeds,
    );

    anchor_spl::token::close_account(cpi_ctx)
}

/// Close data account and withdraw the rent SOL to the authority.
/// Also transfers all tokens from escrow to the authority and closes the escrow ata.
#[derive(Accounts)]
pub struct DestroyV1Ctx<'info> {
    /// Fusion data account.
    #[account(mut, close = authority, has_one = authority, seeds = [DATA_SEED.as_bytes()], bump)]
    fusion_data: Account<'info, FusionDataV1>,

    /// Authority PDA account.
    ///
    /// CHECK: account checked in seeds constraint
    #[account(seeds = [AUTHORITY_SEED.as_bytes()], bump)]
    authority_pda: UncheckedAccount<'info>,

    /// Authority and payer of the transaction.
    #[account(mut)]
    authority: Signer<'info>,

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

    /// Authority ata.
    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = token_mint,
        associated_token::authority = authority
    )]
    authority_ata: Account<'info, TokenAccount>,

    /// Collection account
    ///
    /// CHECK: account checked in address constraint
    #[account(
        mut,
        address = fusion_data.collection,
    )]
    collection: UncheckedAccount<'info>,

    /// SPL Token program.
    token_program: Program<'info, Token>,

    /// SPL Associated Token program.
    associated_token_program: Program<'info, AssociatedToken>,

    /// CHECK: checked by account constraint
    #[account(address = CORE_PROGRAM_ID)]
    core_program: UncheckedAccount<'info>,

    /// System program.
    system_program: Program<'info, System>,

    /// The SPL Noop program.
    /// CHECK: Checked in mpl-core.
    log_wrapper: Option<AccountInfo<'info>>,
}
