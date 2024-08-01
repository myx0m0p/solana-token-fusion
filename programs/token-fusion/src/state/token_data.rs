
use anchor_lang::prelude::*;

use crate::FactoryError;

/// Token Data Struct
#[derive(Default, AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct TokenData {
    /// Amount of tokens to burn to mint a NFT, i.e. 666
    pub token_from_amount: u64,
    /// Amount of tokens received from burnt NFT, i.e. 600
    pub token_into_amount: u64,
}

impl TokenData {
    pub const SIZE: usize = 
        8                                           // token_from_amount
        + 8                                         // token_into_amount
        ;

    pub fn burn_amount(&self) -> u64 {
        self.token_from_amount - self.token_into_amount
    }
    
    pub fn validate(&self) -> Result<()> {
        require!(
            self.token_from_amount >= self.token_into_amount,
            FactoryError::InvalidTokenAmounts
        );

        Ok(())
    }
}
