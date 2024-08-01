use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{close_account, transfer, CloseAccount, Mint, Token, TokenAccount, Transfer},
};

use crate::{
    constants::{AUTHORITY_SEED, DATA_SEED},
    TransmuteFactory,
};

pub(crate) struct Accounts<'info> {
    pub authority: AccountInfo<'info>,
    pub authority_pda: AccountInfo<'info>,
    pub from: Account<'info, TokenAccount>,
    pub to: Account<'info, TokenAccount>,
    pub spl_token_program: AccountInfo<'info>,
}

pub fn disenchant(ctx: Context<Disenchant>) -> Result<()> {
    let token_accounts = Accounts {
        authority: ctx.accounts.authority.to_account_info(),
        authority_pda: ctx.accounts.authority_pda.to_account_info(),
        from: ctx.accounts.token_treasure.clone(),
        to: ctx.accounts.authority_token_ata.clone(),
        spl_token_program: ctx.accounts.token_program.to_account_info(),
    };
    process_transfer_out(token_accounts, ctx.bumps.authority_pda)
}
pub(crate) fn process_transfer_out(accounts: Accounts, bump: u8) -> Result<()> {
    let authority_seeds = &[AUTHORITY_SEED.as_bytes(), &[bump]];
    let signer_seeds = &[&authority_seeds[..]];

    // get current balance
    let transfer_amount: u64 = accounts.from.amount;

    // transfer tokens from the token treasure account to the authority_token_ata account
    let cpi_ctx = CpiContext::new_with_signer(
        accounts.spl_token_program.to_account_info(),
        Transfer {
            from: accounts.from.to_account_info(),
            to: accounts.to.to_account_info(),
            authority: accounts.authority_pda.to_account_info(),
        },
        signer_seeds,
    );
    transfer(cpi_ctx, transfer_amount)?;

    msg!("Transferred {} tokens", transfer_amount);

    // close token account and withdraw lamport to factory authority
    let cpi_ctx = CpiContext::new_with_signer(
        accounts.spl_token_program.to_account_info(),
        CloseAccount {
            account: accounts.from.to_account_info(),
            destination: accounts.authority.to_account_info(),
            authority: accounts.authority_pda.to_account_info(),
        },
        signer_seeds,
    );

    close_account(cpi_ctx)
}

/// Withdraw the rent SOL from the transmute factory account.
#[derive(Accounts)]
pub struct Disenchant<'info> {
    /// Transmute Factory data account.
    #[account(mut, close = authority, has_one = authority, seeds = [DATA_SEED.as_bytes()], bump)]
    factory: Account<'info, TransmuteFactory>,

    /// Authority PDA account.
    ///
    /// CHECK: account checked in seeds constraint
    #[account(seeds = [AUTHORITY_SEED.as_bytes()], bump)]
    authority_pda: UncheckedAccount<'info>,

    /// Authority of the transmute factory
    #[account(mut)]
    authority: Signer<'info>,

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

    /// Associated token account for authority.
    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = token_mint,
        associated_token::authority = authority
    )]
    authority_token_ata: Account<'info, TokenAccount>,

    /// SPL Token program.
    token_program: Program<'info, Token>,

    /// SPL Associated Token program.
    associated_token_program: Program<'info, AssociatedToken>,

    /// System program.
    system_program: Program<'info, System>,
}
