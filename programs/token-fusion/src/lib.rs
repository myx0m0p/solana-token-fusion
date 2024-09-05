#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

pub use errors::FusionError;
use instructions::*;
use state::*;

pub mod constants;
pub mod errors;
pub mod utils;

mod instructions;
mod state;

declare_id!("STFyNpLRuUnxko7TPNqNR1g1EapVj4AnXkAFy2TGbj3");

#[program]
pub mod token_fusion {

    use super::*;

    /// Initialize the fusion data account with the specified data.
    ///
    /// # Input accounts
    ///
    ///   0. `[writable]` fusion data account (seeds `[b"fusion_data"]`)
    ///   1. `[writable]` Authority PDA (seeds `[b"authority"]`)
    ///   2. `[signer]` Collection update authority
    ///   3. `[signer]` Payer of the transaction
    ///   4. `[]` Token mint
    ///   5. `[]` Token escrow associated account with program authority pda
    ///   6. `[writable]` Collection account
    ///   7. `[]` Token program
    ///   8. `[]` Associated Token program
    ///   9. `[]` Core program
    ///   10.`[]` System program
    ///   11.`[optional]` SPL Noop program
    pub fn init_v1(
        ctx: Context<InitV1Ctx>,
        asset_data: AssetDataV1,
        fee_data: FeeDataV1,
    ) -> Result<()> {
        instructions::handler_init_v1(ctx, asset_data, fee_data)
    }

    /// Fusion tokens into Asset.
    ///
    /// User's tokens transferred to the escrow and optionally partially burned
    /// and new Asset is minted in exchange.
    ///
    /// # Accounts
    ///
    ///   0. `[writable]` fusion data account (seeds `[b"fusion_data"]`)
    ///   1. `[writable]` Authority PDA (seeds `[b"authority"]`)
    ///   2. `[signer]` User
    ///   3. `[signer]` Asset account
    ///   4. `[writable]` Collection account
    ///   5. `[]` Token mint
    ///   6. `[]` Escrow ata with authority_pda as authority
    ///   7. `[]` User ata with user as authority
    ///   8. `[optional]` Fee recipient account
    ///   9. `[optional]` Fee recipient ata
    ///   10. `[]` Fee sol account
    ///   11. `[]` Token program
    ///   12.`[]` Associated Token program
    ///   13.`[]` Core program
    ///   14.`[]` System program
    ///   15.`[optional]` SPL Noop program
    pub fn fusion_into_v1<'info>(
        ctx: Context<'_, '_, '_, 'info, FusionIntoV1Ctx<'info>>,
    ) -> Result<()> {
        instructions::handler_fusion_into_v1(ctx)
    }

    /// Fusion tokens from Asset.
    ///
    /// User's asset is burned and corresponding amount of tokens are transferred
    /// to the user's account from the escrow.
    ///
    /// # Accounts
    ///
    ///   0. `[writable]` fusion data account (seeds `[b"fusion_data"]`)
    ///   1. `[writable]` Authority PDA (seeds `[b"authority"]`)
    ///   2. `[signer]` User
    ///   3. `[signer]` Asset account
    ///   4. `[writable]` Collection account
    ///   5. `[]` Token mint
    ///   6. `[]` Escrow ata with authority_pda as authority
    ///   7. `[]` User ata with user as authority
    ///   8. `[]` Fee sol account
    ///   9. `[]` Token program
    ///   10.`[]` Associated Token program
    ///   11.`[]` Core program
    ///   12.`[]` System program
    ///   13.`[optional]` SPL Noop program
    pub fn fusion_from_v1<'info>(
        ctx: Context<'_, '_, '_, 'info, FusionFromV1Ctx<'info>>,
    ) -> Result<()> {
        instructions::handler_fusion_from_v1(ctx)
    }

    /// Set the new authority of the program.
    ///
    /// # Accounts
    ///
    ///   0. `[writable]` fusion data account (seeds `[b"fusion_data"]`)
    ///   1. `[signer]` current authority
    pub fn set_authority_v1(ctx: Context<SetAuthorityV1Ctx>, new_authority: Pubkey) -> Result<()> {
        instructions::handler_set_authority_v1(ctx, new_authority)
    }

    /// Update the fusion data account with the specified data.
    ///
    /// # Accounts
    ///
    ///   0. `[writable]` fusion data account (seeds `[b"fusion_data"]`)
    ///   1. `[signer]` authority
    pub fn update_v1(
        ctx: Context<UpdateV1Ctx>,
        asset_data: AssetDataV1,
        fee_data: FeeDataV1,
    ) -> Result<()> {
        instructions::handler_update_v1(ctx, asset_data, fee_data)
    }

    /// Destroy the fusion data account and withdraw all the funds.
    ///
    /// # Accounts
    ///
    ///   0. `[writable]` fusion data account (seeds `[b"fusion_data"]`)
    ///   1. `[writable]` Authority PDA (seeds `[b"authority"]`)
    ///   2. `[signer]` authority
    ///   3. `[]` Token Mint account
    ///   4. `[writable]` Escrow ata with authority_pda as authority
    ///   5. `[writable]` Authority associated token account
    ///   6. `[writable]` Collection account
    ///   7. `[]` Token program
    ///   8. `[]` Associated Token program
    ///   9. `[]` Core program
    ///   10.`[]` System program
    ///   11.`[]` SPL Noop program
    pub fn destroy_v1(ctx: Context<DestroyV1Ctx>) -> Result<()> {
        instructions::handler_destroy_v1(ctx)
    }

    /// Pause or unpause all fusion operations.
    ///
    /// # Accounts
    ///
    ///   0. `[writable]` fusion data account (seeds `[b"fusion_data"]`)
    ///   1. `[signer]` authority
    pub fn set_pause_v1(ctx: Context<SetPauseV1Ctx>, paused: bool) -> Result<()> {
        instructions::handler_set_pause_v1(ctx, paused)
    }
}
