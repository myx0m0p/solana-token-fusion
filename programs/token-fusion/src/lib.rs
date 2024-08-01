#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

pub use errors::FactoryError;
use instructions::*;
use state::*;

pub mod constants;
pub mod errors;
pub mod utils;

mod instructions;
mod state;

declare_id!("5KH8Y5eFJDjhqdQki5BEiomaCBEmkmAMALS6iBS4P4EV");

#[program]
pub mod token_fusion {

    use super::*;

    /// Initialize the transmute factory account with the specified data.
    ///
    /// # Accounts
    ///
    ///   0.  `[writable]` factory data account (seeds `[b"transmute_factory"]`)
    ///   1.  `[writable]` Authority PDA (seeds `[b"authority"]`)
    ///   2.  `[]` transmute factory authority
    ///   3.  `[signer]` Payer
    ///   4.  `[]` Token mint
    ///   5.  `[]` Token treasure associated account with program pda as authority.
    ///   6.  `[]` Collection metadata
    ///   7.  `[]` Collection mint
    ///   8.  `[]` Collection master edition
    ///   9.  `[signer]` Collection update authority
    ///   10. `[writable]` Collection delegate record
    ///   11. `[optional]` Rule Set for minted assets
    ///   12. `[]` Token program
    ///   13. `[]` Associated Token program
    ///   14. `[]` Token Metadata program
    ///   15. `[]` System program
    ///   16. `[]` Sysvar program
    ///   17. `[optional]` Token Authorization Rules program
    ///   18. `[optional]` Token Authorization rules account for the collection metadata (if any).
    pub fn enchant(
        ctx: Context<Enchant>,
        asset_data: AssetData,
        token_data: TokenData,
    ) -> Result<()> {
        instructions::enchant(ctx, asset_data, token_data)
    }

    /// Transmute NFT into Tokens.
    ///
    /// User burns NFT in exchange fixed amount of Token minted to this user
    ///
    /// # Accounts
    ///
    ///   0. `[]` Transmute Factory account
    ///   1. `[signer]` Asset owner or Utility delegate
    ///   2. `[writable]` Mint of token asset
    ///   3. `[optional, writable]` Metadata of the Collection
    ///   4. `[writable]` Metadata account of the NFT
    ///   5. `[optional, writable]` Master edition account of the NFT
    ///   6. `[writable]` Token account to close
    ///   7. `[optional, writable]` Token record (required for pNFT)
    ///   8. `[]` Token Metadata program
    ///   9. `[]` SPL Token program
    ///   10. `[]` System program
    ///   11. `[]` Instructions sysvar account
    pub fn transmute_into<'info>(
        ctx: Context<'_, '_, '_, 'info, TransmuteInto<'info>>,
    ) -> Result<()> {
        instructions::transmute_into(ctx)
    }

    /// Transmute Tokens into Asset.
    ///
    /// User's tokens partially burned and partially transferred to the treasure
    /// new Asset is minted in exchange
    ///
    /// # Accounts
    ///
    ///   0.  `[writable]` factory data account (seeds `[b"transmute_factory"]`)
    ///   1.  `[writable]` Authority PDA (seeds `[b"authority"]`)
    ///   2.  `[signer]` Payer and authority of token associated account
    ///   3.  `[]` Owner of the minted asset
    ///   4.  `[writable]` Asset Mint account
    ///   5.  `[writable]` Asset Metadata account
    ///   6.  `[writable]` Asset Master edition account
    ///   7.  `[optional, writable]` Destination token account
    ///   8.  `[optional, writable]` Token record
    ///   9.  `[]` Collection delegate or authority record
    ///   10. `[]` Collection mint
    ///   11. `[writable]` Collection metadata
    ///   12. `[]` Collection master edition
    ///   13. `[]` Collection update authority
    ///   14. `[writable]` Token Mint account
    ///   15. `[writable]` Token treasure associated account with authority_pda as authority
    ///   16. `[writable]` Associated token account with payer as authority.
    ///   17. `[]` Token Metadata program
    ///   18. `[]` SPL Token program
    ///   19. `[]` SPL Associated Token program
    ///   20. `[]` System program
    ///   21. `[optional]` Instructions sysvar account
    ///   22. `[optional]` Token Authorization Rules program
    ///   23. `[optional]` Token Authorization rules account for the collection metadata (if any).
    pub fn transmute_from<'info>(
        ctx: Context<'_, '_, '_, 'info, TransmuteFrom<'info>>,
    ) -> Result<()> {
        instructions::transmute_from(ctx)
    }

    /// Set a new authority of the program.
    ///
    /// # Accounts
    ///
    ///   0. `[writable]` factory data account (seeds `[b"transmute_factory"]`)
    ///   1. `[signer]` factory current authority
    pub fn set_authority(ctx: Context<SetAuthority>, new_authority: Pubkey) -> Result<()> {
        instructions::set_authority(ctx, new_authority)
    }

    /// Update the transmute factory configuration.
    ///
    /// # Accounts
    ///
    ///   0. `[writable]` factory data account (seeds `[b"transmute_factory"]`)
    ///   1. `[signer]` factory authority
    pub fn update(
        ctx: Context<Update>,
        asset_data: AssetData,
        token_data: TokenData,
    ) -> Result<()> {
        instructions::update(ctx, asset_data, token_data)
    }

    /// Withdraw the rent lamports and send them to the authority address.
    /// Also transfers all tokens from treasure to the authority ata and closes the token account.
    ///
    /// # Accounts
    ///
    ///   0. `[writable]` factory data account (seeds `[b"transmute_factory"]`)
    ///   1. `[writable]` Authority PDA (seeds `[b"authority"]`)
    ///   2. `[signer]` Factory authority
    ///   3. `[writable]` Token Mint account
    ///   4. `[writable]` Token treasure associated account with authority_pda as authority
    ///   5. `[writable]` Factory authority associated token account
    ///   6. `[]` SPL Token program
    ///   7. `[]` SPL Associated Token program
    ///   8. `[]` System program
    pub fn disenchant(ctx: Context<Disenchant>) -> Result<()> {
        instructions::disenchant(ctx)
    }

    /// Pause or unpause all transumations.
    ///
    /// # Accounts
    ///
    ///   0. `[writable]` factory data account (seeds `[b"transmute_factory"]`)
    ///   1. `[signer]` factory authority
    pub fn set_pause(ctx: Context<SetPause>, paused: bool) -> Result<()> {
        instructions::set_pause(ctx, paused)
    }
}
