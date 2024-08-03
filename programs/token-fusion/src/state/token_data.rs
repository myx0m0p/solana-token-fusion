use anchor_lang::prelude::*;

use crate::FusionError;

/// Token Data Struct
#[derive(Default, AnchorSerialize, AnchorDeserialize, Clone, Debug, InitSpace)]
pub struct TokenDataV1 {
    /// Amount of tokens needed to burn to mint a NFT, i.e. 100
    pub into_amount: u64,
    /// Amount of tokens received for burning a NFT, i.e. 90
    pub from_amount: u64,
}

impl TokenDataV1 {
    // pub const SIZE: usize =
    //     8                                           // from_amount
    //     + 8                                         // into_amount
    //     ;

    pub fn burn_amount(&self) -> u64 {
        self.into_amount - self.from_amount
    }

    pub fn validate(&self) -> Result<()> {
        require!(
            self.into_amount >= self.from_amount,
            FusionError::InvalidTokenAmounts
        );

        Ok(())
    }
}
