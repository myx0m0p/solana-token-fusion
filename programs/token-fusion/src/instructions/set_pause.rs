use anchor_lang::prelude::*;

use crate::{constants::DATA_SEED, TransmuteFactory};

pub fn set_pause(ctx: Context<SetPause>, paused: bool) -> Result<()> {
    ctx.accounts.factory.paused = paused;

    Ok(())
}

/// Withdraw the rent SOL from the transmute factory account.
#[derive(Accounts)]
pub struct SetPause<'info> {
    /// Transmute Factory data account.
    #[account(mut, has_one = authority, seeds = [DATA_SEED.as_bytes()], bump)]
    factory: Account<'info, TransmuteFactory>,

    /// Authority of the transmute factory
    #[account(mut)]
    authority: Signer<'info>,
}
