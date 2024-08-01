use anchor_lang::{
    prelude::*,
    solana_program::{program_memory::sol_memcmp, pubkey::PUBKEY_BYTES},
};
use anchor_spl::metadata::mpl_token_metadata::instructions::DelegateCollectionV1CpiBuilder;

pub struct ApproveMetadataDelegateHelperAccounts<'info> {
    /// CHECK: account checked in CPI
    pub delegate_record: AccountInfo<'info>,
    /// CHECK: account checked in CPI
    pub authority_pda: AccountInfo<'info>,
    /// CHECK: account checked in CPI
    pub collection_metadata: AccountInfo<'info>,
    /// CHECK: account checked in CPI
    pub collection_mint: AccountInfo<'info>,
    /// CHECK: account checked in CPI
    pub collection_update_authority: AccountInfo<'info>,
    /// CHECK: account checked in CPI
    pub payer: AccountInfo<'info>,
    /// CHECK: account checked in CPI
    pub system_program: AccountInfo<'info>,
    /// CHECK: account checked in CPI
    pub sysvar_instructions: AccountInfo<'info>,
    /// CHECK: account checked in CPI
    pub authorization_rules_program: Option<AccountInfo<'info>>,
    /// CHECK: account checked in CPI
    pub authorization_rules: Option<AccountInfo<'info>>,
    /// CHECK: account checked in CPI
    pub token_metadata_program: AccountInfo<'info>,
}

pub fn cmp_pubkeys(a: &Pubkey, b: &Pubkey) -> bool {
    sol_memcmp(a.as_ref(), b.as_ref(), PUBKEY_BYTES) == 0
}

pub fn approve_metadata_delegate(accounts: ApproveMetadataDelegateHelperAccounts) -> Result<()> {
    DelegateCollectionV1CpiBuilder::new(&accounts.token_metadata_program)
        .delegate_record(Some(&accounts.delegate_record))
        .delegate(&accounts.authority_pda)
        .mint(&accounts.collection_mint)
        .metadata(&accounts.collection_metadata)
        .payer(&accounts.payer)
        .authority(&accounts.collection_update_authority)
        .system_program(&accounts.system_program)
        .sysvar_instructions(&accounts.sysvar_instructions)
        .authorization_rules(accounts.authorization_rules.as_ref())
        .authorization_rules_program(accounts.authorization_rules_program.as_ref())
        .invoke()
        .map_err(|error| error.into())
}
