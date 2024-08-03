use anchor_lang::prelude::*;

use crate::{constants::DATA_SEED, FusionDataV1};

pub fn handler_set_pause_v1(ctx: Context<SetPauseV1Ctx>, paused: bool) -> Result<()> {
    ctx.accounts.fusion_data.paused = paused;

    Ok(())
}

/// Set the pause status.
#[derive(Accounts)]
pub struct SetPauseV1Ctx<'info> {
    /// Fusion data account.
    #[account(mut, has_one = authority, seeds = [DATA_SEED.as_bytes()], bump)]
    fusion_data: Account<'info, FusionDataV1>,

    /// Current authority
    #[account(mut)]
    authority: Signer<'info>,
}
