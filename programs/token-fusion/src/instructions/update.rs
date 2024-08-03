use anchor_lang::prelude::*;

use crate::{constants::DATA_SEED, AssetDataV1, FusionDataV1, TokenDataV1};

pub fn handler_update_v1(
    ctx: Context<UpdateV1Ctx>,
    asset_data: AssetDataV1,
    token_data: TokenDataV1,
) -> Result<()> {
    // validation
    asset_data.validate()?;
    token_data.validate()?;

    ctx.accounts.fusion_data.asset_data = asset_data;
    ctx.accounts.fusion_data.token_data = token_data;

    Ok(())
}

/// Initializes a new exchange machine.
#[derive(Accounts)]
pub struct UpdateV1Ctx<'info> {
    /// Fusion data account.
    #[account(mut, has_one = authority, seeds = [DATA_SEED.as_bytes()], bump)]
    fusion_data: Account<'info, FusionDataV1>,

    /// Current authority
    #[account(mut)]
    authority: Signer<'info>,
}
