use anchor_lang::prelude::*;

// Empty string constant.
pub const EMPTY_STR: &str = "";

// Seed used to derive the data account PDA address.
pub const DATA_SEED: &str = "fusion_data";
// Seed used to derive the authority PDA address.
pub const AUTHORITY_SEED: &str = "authority";

// max strings length for assets
pub const ASSET_NAME_PREFIX_MAX: usize = 10;
pub const ASSET_URI_PREFIX_MAX: usize = 200;
pub const ASSET_URI_SUFFIX_MAX: usize = 5;

pub const SET: u8 = 1;
pub const UNSET: u8 = 0;

//FIXME: change to correct values
pub const PROTOCOL_FEE: u64 = 10000000;
pub const PROTOCOL_FEE_WALLET: Pubkey = pubkey!("GjF4LqmEhV33riVyAwHwiEeAHx4XXFn2yMY3fmMigoP3");
