use anchor_lang::prelude::*;

use crate::{constants::DATA_SEED, FusionDataV1};

pub fn handler_set_authority_v1(
    ctx: Context<SetAuthorityV1Ctx>,
    new_authority: Pubkey,
) -> Result<()> {
    ctx.accounts.fusion_data.authority = new_authority;

    Ok(())
}

/// Sets a new authority.
#[derive(Accounts)]
pub struct SetAuthorityV1Ctx<'info> {
    /// Fusion data account.
    #[account(mut, has_one = authority, seeds = [DATA_SEED.as_bytes()], bump)]
    fusion_data: Account<'info, FusionDataV1>,

    /// Current authority
    #[account(mut)]
    authority: Signer<'info>,
}
