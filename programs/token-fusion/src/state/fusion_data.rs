use anchor_lang::prelude::*;

use crate::{AssetDataV1, FusionError, TokenDataV1};

/// Fusion Data Account
#[account]
#[derive(Default, Debug, InitSpace)]
pub struct FusionDataV1 {
    /// Authority address, is able to update settings
    pub authority: Pubkey,
    /// The collection account
    pub collection: Pubkey,
    /// Token mint
    pub token_mint: Pubkey,
    /// Paused status
    pub paused: bool,
    /// Asset specific data
    pub asset_data: AssetDataV1,
    /// Token specific data
    pub token_data: TokenDataV1,
}

impl FusionDataV1 {
    pub fn validate(&self) -> Result<()> {
        require!(self.paused == false, FusionError::FusionPaused);
        Ok(())
    }
}
