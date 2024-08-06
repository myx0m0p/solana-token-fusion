use anchor_lang::prelude::*;

use crate::{
    constants::{ASSET_NAME_PREFIX_MAX, ASSET_URI_PREFIX_MAX, ASSET_URI_SUFFIX_MAX},
    errors::FusionError,
};

/// Asset Data Struct
#[derive(Default, AnchorSerialize, AnchorDeserialize, Clone, Debug, InitSpace)]
pub struct AssetDataV1 {
    /// Optional asset mint limit
    pub max_supply: Option<u32>,

    /// Asset next index to mint
    pub next_index: u64,

    #[max_len(ASSET_NAME_PREFIX_MAX)]
    /// Asset name prefix, i.e. `Token #`, max 10 symbols
    pub name_prefix: String,

    #[max_len(ASSET_URI_PREFIX_MAX)]
    /// Asset URI prefix, i.e. `https://stf.org/metadata/` with trailing `/`, max 200 symbols
    pub uri_prefix: String,

    #[max_len(ASSET_URI_SUFFIX_MAX)]
    /// Asset URI suffix, i.e. `.json`, max 5 symbols
    pub uri_suffix: String,
}

impl AssetDataV1 {
    pub fn validate(&self) -> Result<()> {
        require!(self.next_index > 0, FusionError::InvalidNextAssetIndex);

        require!(
            self.name_prefix.len() <= ASSET_NAME_PREFIX_MAX,
            FusionError::ExceededLengthError
        );

        require!(
            self.uri_prefix.len() <= ASSET_URI_PREFIX_MAX,
            FusionError::ExceededLengthError
        );

        require!(
            self.uri_suffix.len() <= ASSET_URI_SUFFIX_MAX,
            FusionError::ExceededLengthError
        );

        Ok(())
    }
}
