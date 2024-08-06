use anchor_lang::prelude::*;

use crate::FusionError;

/// Token Data Struct
#[derive(Default, AnchorSerialize, AnchorDeserialize, Clone, Debug, InitSpace)]
pub struct TokenDataV1 {
    /// Send SPL -> mint Asset
    pub into_amount: u64,
    /// Burn Asset -> receive SPL
    pub from_amount: u64,
}

impl TokenDataV1 {
    /// Burned SPL is the difference between `into_amount` and `from_amount`
    /// so asset price is effectively equal to `from_amount`
    pub fn burn_amount(&self) -> u64 {
        self.into_amount - self.from_amount
    }

    pub fn transfer_amount(&self) -> u64 {
        self.from_amount
    }

    pub fn validate(&self) -> Result<()> {
        require!(
            self.into_amount >= self.from_amount,
            FusionError::InvalidTokenAmounts
        );

        Ok(())
    }
}
