use anchor_lang::prelude::*;

use crate::{constants::DATA_SEED, AssetData, TokenData, TransmuteFactory};

pub fn update(ctx: Context<Update>, asset_data: AssetData, token_data: TokenData) -> Result<()> {
    // validation
    asset_data.validate()?;
    token_data.validate()?;

    ctx.accounts.factory.asset_data = asset_data;
    ctx.accounts.factory.token_data = token_data;

    Ok(())
}

/// Initializes a new exchange machine.
#[derive(Accounts)]
pub struct Update<'info> {
    /// Transmute Factory data account.
    #[account(mut, has_one = authority, seeds = [DATA_SEED.as_bytes()], bump)]
    factory: Account<'info, TransmuteFactory>,

    /// Authority of the transmute factory
    #[account(mut)]
    authority: Signer<'info>,
}
