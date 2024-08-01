
use anchor_lang::prelude::*;
use anchor_spl::metadata::mpl_token_metadata::{MAX_CREATOR_LEN, MAX_CREATOR_LIMIT};

use crate::{
    constants::{
        ASSET_NAME_PREFIX_MAX, ASSET_SYMBOL_MAX, ASSET_URI_PREFIX_MAX, ASSET_URI_SUFFIX_MAX,
    },
    errors::FactoryError,
};

/// Asset Data Struct
#[derive(Default, AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct AssetData {
    /// Symbol for the asset
    pub asset_symbol: String,
    /// Asset next index to mint
    pub asset_next_index: u64,
    /// Asset name prefix, i.e. `Sinner #`, max 10 symbols
    pub asset_name_prefix: String,
    /// Asset URI prefix, i.e. `https://meta.sindao.org/metadata/`
    pub asset_uri_prefix: String,
    /// Asset URI suffix, i.e. `.json`, max 5 symbols
    pub asset_uri_suffix: String,
    /// Secondary sales royalty basis points (0-10000)
    pub asset_seller_fee_basis_points: u16,
    /// List of creators
    pub asset_creators: Vec<Creator>,
}

impl AssetData {
    pub const SIZE: usize = 
        4 + ASSET_SYMBOL_MAX                        // asset_symbol
        + 8                                         // asset_next_index
        + 4 + ASSET_NAME_PREFIX_MAX                 // asset_name_prefix
        + 4 + ASSET_URI_PREFIX_MAX                  // asset_uri_prefix
        + 4 + ASSET_URI_SUFFIX_MAX                  // asset_uri_suffix
        + 2                                         // asset_seller_fee_basis_points
        + 4 + MAX_CREATOR_LIMIT * MAX_CREATOR_LEN   // asset_creators
        ;

    pub fn get_filled_data(&self) -> AssetDataFilled {
      AssetDataFilled {
            name: format!("{}{}", self.asset_name_prefix, self.asset_next_index),
            uri: format!(
                "{}{}{}",
                self.asset_uri_prefix, self.asset_next_index, self.asset_uri_suffix
            ),
        }
    }

    pub fn validate(&self) -> Result<()> {
        require!(
            self.asset_symbol.len() <= ASSET_SYMBOL_MAX,
            FactoryError::ExceededLengthError
        );

        require!(
            self.asset_next_index > 0,
            FactoryError::InvalidNextAssetIndex
        );

        require!(
            self.asset_name_prefix.len() <= ASSET_NAME_PREFIX_MAX,
            FactoryError::ExceededLengthError
        );

        require!(
            self.asset_uri_prefix.len() <= ASSET_URI_PREFIX_MAX,
            FactoryError::ExceededLengthError
        );

        require!(
            self.asset_uri_suffix.len() <= ASSET_URI_SUFFIX_MAX,
            FactoryError::ExceededLengthError
        );

        Ok(())
    }
}

#[derive(Default, AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct Creator {
    /// Pubkey address
    pub address: Pubkey,
    /// Whether the creator is verified or not
    pub verified: bool,
    // Share of secondary sales royalty (0-100)
    pub percentage_share: u8,
}

#[derive(Default, AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct AssetDataFilled {
    /// Name of the asset.
    pub name: String,
    /// URI to JSON metadata.
    pub uri: String,
}
