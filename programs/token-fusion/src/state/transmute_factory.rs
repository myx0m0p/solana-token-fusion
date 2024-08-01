use anchor_lang::prelude::*;

use crate::{AssetData, FactoryError, TokenData};

/// Transmute Factory Account
#[account]
#[derive(Default, Debug)]
pub struct TransmuteFactory {
    /// Authority address, is able to update settings
    pub authority: Pubkey,
    /// The collection mint
    pub collection_mint: Pubkey,
    /// Token mint
    pub token_mint: Pubkey,
    /// Optional Rule Set for an asset
    pub rule_set: Option<Pubkey>,
    /// Paused status
    pub paused: bool,
    /// Asset specific data
    pub asset_data: AssetData,
    /// Token specific data
    pub token_data: TokenData,
}

impl TransmuteFactory {
    pub const SIZE: usize = 32                      // authority
        + 32                                        // collection_mint
        + 32                                        // token_mint
        + 1 + 32                                    // rule_set
        + 1                                         // paused
        + AssetData::SIZE                           // AssetData size
        + TokenData::SIZE                           // TokenData size
        ;

    pub fn validate(&self) -> Result<()> {
        require!(self.paused == false, FactoryError::TransmutationsPaused);
        Ok(())
    }
}
