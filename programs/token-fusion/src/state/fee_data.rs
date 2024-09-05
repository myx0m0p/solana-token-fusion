use anchor_lang::prelude::*;

use crate::FusionError;

/// Fee Data Struct
#[derive(Default, AnchorSerialize, AnchorDeserialize, Clone, Debug, InitSpace)]
pub struct FeeDataV1 {
    /// How many spl tokens can be recovered from the asset
    pub escrow_amount: u64,
    /// SPL fee, when fusing SPL into asset, take this SPL amount from user
    pub fee_amount: u64,
    /// SPL fee burned, when fusing SPL into asset, burn this SPL amount
    pub burn_amount: u64,
    /// SOL fee, when fusing SPL into asset, take this SOL amount from user
    pub sol_fee_amount: u64,
    /// SPL/SOL fee recipient address
    pub fee_recipient: Option<Pubkey>,
}

impl FeeDataV1 {
    pub fn is_fee_charged(&self) -> bool {
        (self.fee_amount > 0 || self.sol_fee_amount > 0) && self.fee_recipient.is_some()
    }

    pub fn validate(&self) -> Result<()> {
        // If fees are being charged, a fee recipient must be provided
        if self.fee_amount > 0 || self.sol_fee_amount > 0 {
            require!(
                self.fee_recipient.is_some(),
                FusionError::InvalidFeeRecipient
            );
        }

        Ok(())
    }
}
