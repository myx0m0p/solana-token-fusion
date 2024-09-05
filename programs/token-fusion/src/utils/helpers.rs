use anchor_lang::{
    prelude::*,
    solana_program::{
        entrypoint::ProgramResult, program::invoke, program_memory::sol_memcmp,
        pubkey::PUBKEY_BYTES, system_instruction,
    },
};
use mpl_core::{
    instructions::{
        ApproveCollectionPluginAuthorityV1CpiBuilder, BurnV1CpiBuilder, CreateV1CpiBuilder,
        RevokeCollectionPluginAuthorityV1CpiBuilder,
    },
    types::{DataState, PluginAuthority, PluginType},
};

pub fn cmp_pubkeys(a: &Pubkey, b: &Pubkey) -> bool {
    sol_memcmp(a.as_ref(), b.as_ref(), PUBKEY_BYTES) == 0
}

pub fn cmp_pubkeys_opt(a: Option<&Pubkey>, b: Option<&Pubkey>) -> bool {
    if let (Some(a), Some(b)) = (a, b) {
        cmp_pubkeys(a, b)
    } else {
        false
    }
}

pub fn get_pubkey_opt_from_account_info<'a>(acc: &Option<AccountInfo<'a>>) -> Option<&'a Pubkey> {
    if let Some(acc) = acc {
        Some(acc.key)
    } else {
        None
    }
}

pub struct CollectionPluginAuthorityV1Accounts<'info> {
    pub collection: AccountInfo<'info>,
    pub payer: AccountInfo<'info>,
    pub authority: Option<AccountInfo<'info>>,
    pub core_program: AccountInfo<'info>,
    pub system_program: AccountInfo<'info>,
    pub log_wrapper: Option<AccountInfo<'info>>,
}

pub struct ApproveCollectionPluginAuthorityV1Args {
    pub plugin_type: PluginType,
    pub new_authority: PluginAuthority,
}

pub struct RevokeCollectionPluginAuthorityV1Args {
    pub plugin_type: PluginType,
}

pub fn approve_collection_authority_v1(
    acc: CollectionPluginAuthorityV1Accounts,
    args: ApproveCollectionPluginAuthorityV1Args,
) -> Result<()> {
    ApproveCollectionPluginAuthorityV1CpiBuilder::new(&acc.core_program)
        .collection(&acc.collection.to_account_info())
        .payer(&acc.payer.to_account_info())
        .authority(acc.authority.as_ref())
        .system_program(&acc.system_program.to_account_info())
        .log_wrapper(acc.log_wrapper.as_ref())
        .plugin_type(args.plugin_type)
        .new_authority(args.new_authority)
        .invoke()
        .map_err(|error| error.into())
}

pub fn revoke_collection_authority_v1(
    acc: CollectionPluginAuthorityV1Accounts,
    args: RevokeCollectionPluginAuthorityV1Args,
    signer_seeds: [&[u8]; 2],
) -> Result<()> {
    RevokeCollectionPluginAuthorityV1CpiBuilder::new(&acc.core_program)
        .collection(&acc.collection.to_account_info())
        .payer(&acc.payer.to_account_info())
        .authority(acc.authority.as_ref())
        .system_program(&acc.system_program.to_account_info())
        .log_wrapper(acc.log_wrapper.as_ref())
        .plugin_type(args.plugin_type)
        .invoke_signed(&[&signer_seeds])
        .map_err(|error| error.into())
}

#[derive(Debug)]
pub struct AssetV1Accounts<'info> {
    /// The address of the new asset.
    pub asset: AccountInfo<'info>,
    /// The collection to which the asset belongs.
    pub collection: Option<AccountInfo<'info>>,
    /// The account paying for the storage fees.
    pub payer: AccountInfo<'info>,
    /// The MPL Core program.
    pub core_program: AccountInfo<'info>,
    /// The system program.
    pub system_program: AccountInfo<'info>,
    /// The SPL Noop program.
    pub log_wrapper: Option<AccountInfo<'info>>,
}

#[derive(Debug)]
pub struct CreateV1Args {
    pub name: String,
    pub uri: String,
    // TODO: Add ability to add plugins
}

pub fn create_asset_v1(
    acc: AssetV1Accounts,
    args: CreateV1Args,
    signer_seeds: [&[u8]; 2],
) -> Result<()> {
    CreateV1CpiBuilder::new(&acc.core_program)
        .asset(&acc.asset.to_account_info())
        .collection(acc.collection.as_ref())
        .payer(&acc.payer.to_account_info())
        .system_program(&acc.system_program.to_account_info())
        .log_wrapper(acc.log_wrapper.as_ref())
        .data_state(DataState::AccountState)
        .name(args.name)
        .uri(args.uri)
        .invoke_signed(&[&signer_seeds])
        .map_err(|error| error.into())
}

pub fn burn_asset_v1(acc: AssetV1Accounts) -> Result<()> {
    BurnV1CpiBuilder::new(&acc.core_program)
        .asset(&acc.asset.to_account_info())
        .collection(acc.collection.as_ref())
        .payer(&acc.payer.to_account_info())
        .system_program(Some(&acc.system_program.to_account_info()))
        .log_wrapper(acc.log_wrapper.as_ref())
        .invoke()
        .map_err(|error| error.into())
}

pub fn sol_transfer<'a>(
    source: AccountInfo<'a>,
    destination: AccountInfo<'a>,
    amount: u64,
) -> ProgramResult {
    let ix = system_instruction::transfer(source.key, destination.key, amount);
    invoke(&ix, &[source, destination])
}
