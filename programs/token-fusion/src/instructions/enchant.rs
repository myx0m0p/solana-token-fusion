use anchor_lang::{prelude::*, solana_program::sysvar};
use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::mpl_token_metadata,
    token::{Mint, Token, TokenAccount},
};

use crate::{
    constants::{AUTHORITY_SEED, DATA_SEED, MPL_TOKEN_AUTH_RULES_PROGRAM},
    utils::{approve_metadata_delegate, ApproveMetadataDelegateHelperAccounts},
    AssetData, TokenData, TransmuteFactory,
};

pub fn enchant(ctx: Context<Enchant>, asset_data: AssetData, token_data: TokenData) -> Result<()> {
    // validation
    asset_data.validate()?;
    token_data.validate()?;
    // accounts
    ctx.accounts.factory.authority = ctx.accounts.authority.key();
    ctx.accounts.factory.collection_mint = ctx.accounts.collection_mint.key();
    ctx.accounts.factory.token_mint = ctx.accounts.token_mint.key();
    // rule set
    ctx.accounts.factory.rule_set = ctx
        .accounts
        .rule_set
        .as_ref()
        .map(|rule_set| rule_set.key());

    // data
    ctx.accounts.factory.asset_data = asset_data;
    ctx.accounts.factory.token_data = token_data;

    // approves the metadata delegate so the program can verify minted NFTs
    let delegate_accounts = ApproveMetadataDelegateHelperAccounts {
        token_metadata_program: ctx.accounts.token_metadata_program.to_account_info(),
        authority_pda: ctx.accounts.authority_pda.to_account_info(),
        collection_metadata: ctx.accounts.collection_metadata.to_account_info(),
        collection_mint: ctx.accounts.collection_mint.to_account_info(),
        collection_update_authority: ctx.accounts.collection_update_authority.to_account_info(),
        delegate_record: ctx.accounts.collection_delegate_record.to_account_info(),
        payer: ctx.accounts.payer.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
        sysvar_instructions: ctx.accounts.sysvar_instructions.to_account_info(),
        authorization_rules_program: ctx
            .accounts
            .authorization_rules_program
            .as_ref()
            .map(|authorization_rules_program| authorization_rules_program.to_account_info()),
        authorization_rules: ctx
            .accounts
            .authorization_rules
            .as_ref()
            .map(|authorization_rules| authorization_rules.to_account_info()),
    };

    approve_metadata_delegate(delegate_accounts)
}

/// Initializes a new transmute factory.
#[derive(Accounts)]
pub struct Enchant<'info> {
    /// Transmute Factory data account.
    #[account(
        init,
        payer = payer,
        space = 8 + TransmuteFactory::SIZE,
        seeds = [DATA_SEED.as_bytes()],
        bump
    )]
    factory: Account<'info, TransmuteFactory>,

    /// Authority PDA used to verify minted NFTs to the collection
    /// and to authorize transfers from token treasure.
    ///
    /// CHECK: account checked in seeds constraint
    #[account(
        mut,
        seeds = [AUTHORITY_SEED.as_bytes()],
        bump
    )]
    authority_pda: UncheckedAccount<'info>,

    /// Transmute Factory authority. This is the address that controls the upate of the program.
    ///
    /// CHECK: authority can be any account and is not written to or read
    authority: UncheckedAccount<'info>,

    /// Payer of the transaction.
    #[account(mut)]
    payer: Signer<'info>,

    /// Mint account of the token.
    token_mint: Account<'info, Mint>,

    /// Token treasure associated account with authority_pda as authority.
    #[account(
        init,
        payer = payer,
        associated_token::mint = token_mint,
        associated_token::authority = authority_pda
    )]
    token_treasure: Account<'info, TokenAccount>,

    /// Metadata account of the collection.
    ///
    /// CHECK: account checked in CPI
    #[account(mut)]
    collection_metadata: UncheckedAccount<'info>,

    /// Mint account of the collection.
    ///
    /// CHECK: account checked in CPI
    collection_mint: UncheckedAccount<'info>,

    /// Master Edition account of the collection.
    ///
    /// CHECK: account checked in CPI
    collection_master_edition: UncheckedAccount<'info>,

    /// Update authority of the collection. This needs to be a signer so the transmute
    /// factory can approve a delegate to verify minted NFTs to the collection.
    #[account(mut)]
    collection_update_authority: Signer<'info>,

    /// Metadata delegate record. The delegate is used to verify NFTs.
    ///
    /// CHECK: account checked in CPI
    #[account(mut)]
    collection_delegate_record: UncheckedAccount<'info>,

    /// Authorization rule set to be used by minted NFTs.
    ///
    /// CHECK: must be ownwed by mpl_token_auth_rules
    #[account(owner = MPL_TOKEN_AUTH_RULES_PROGRAM)]
    rule_set: Option<UncheckedAccount<'info>>,

    /// Token program.
    token_program: Program<'info, Token>,

    /// Associated Token program.
    associated_token_program: Program<'info, AssociatedToken>,

    /// Token Metadata program.
    ///
    /// CHECK: account constraint checked in account trait
    #[account(address = mpl_token_metadata::ID)]
    token_metadata_program: UncheckedAccount<'info>,

    /// System program.
    system_program: Program<'info, System>,

    /// Instructions sysvar account.
    ///
    /// CHECK: account constraint checked in account trait
    #[account(address = sysvar::instructions::id())]
    sysvar_instructions: UncheckedAccount<'info>,

    /// Token Authorization Rules program.
    ///
    /// CHECK: account constraint checked in account trait
    #[account(address = MPL_TOKEN_AUTH_RULES_PROGRAM)]
    authorization_rules_program: Option<UncheckedAccount<'info>>,

    /// Token Authorization rules account for the collection metadata (if any).
    ///
    /// CHECK: account checked in CPI
    #[account(owner = MPL_TOKEN_AUTH_RULES_PROGRAM)]
    authorization_rules: Option<UncheckedAccount<'info>>,
}
