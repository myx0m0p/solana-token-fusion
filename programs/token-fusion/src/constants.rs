use anchor_lang::prelude::*;
use anchor_spl::metadata::mpl_token_metadata::{MAX_SYMBOL_LENGTH, MAX_URI_LENGTH};

pub const MPL_TOKEN_AUTH_RULES_PROGRAM: Pubkey =
    pubkey!("auth9SigNpDKz4sJJ1DfCTuZrZNSAgh9sFD3rboVmgg");

// Empty string constant.
pub const EMPTY_STR: &str = "";

// Seed used to derive the authority PDA address.
pub const DATA_SEED: &str = "transmute_factory";
pub const AUTHORITY_SEED: &str = "authority";

// max strings length for assets
pub const ASSET_SYMBOL_MAX: usize = MAX_SYMBOL_LENGTH;
pub const ASSET_NAME_PREFIX_MAX: usize = 10;
pub const ASSET_URI_PREFIX_MAX: usize = MAX_URI_LENGTH;
pub const ASSET_URI_SUFFIX_MAX: usize = 5;

pub const SET: u8 = 1;
pub const UNSET: u8 = 0;
