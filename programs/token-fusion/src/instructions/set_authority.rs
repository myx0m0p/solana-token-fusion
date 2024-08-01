use anchor_lang::prelude::*;

use crate::{constants::DATA_SEED, TransmuteFactory};

pub fn set_authority(ctx: Context<SetAuthority>, new_authority: Pubkey) -> Result<()> {
    ctx.accounts.factory.authority = new_authority;

    Ok(())
}

/// Sets a new transmute factory authority.
#[derive(Accounts)]
pub struct SetAuthority<'info> {
    /// Transmute Factory data account.
    #[account(mut, has_one = authority, seeds = [DATA_SEED.as_bytes()], bump)]
    factory: Account<'info, TransmuteFactory>,

    /// Authority of the transmute factory
    #[account(mut)]
    authority: Signer<'info>,
}
