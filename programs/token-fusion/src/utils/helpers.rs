use anchor_lang::{
    prelude::*,
    solana_program::{
        entrypoint::ProgramResult, hash::hash, program::invoke, program_memory::sol_memcmp,
        pubkey::PUBKEY_BYTES, system_instruction,
    },
};
use mpl_core::{
    accounts::BaseCollectionV1,
    fetch_plugin,
    instructions::{
        AddCollectionPluginV1CpiBuilder, BurnV1CpiBuilder, CreateV1CpiBuilder,
        RevokeCollectionPluginAuthorityV1CpiBuilder, UpdateCollectionPluginV1CpiBuilder,
    },
    types::{DataState, Plugin, PluginAuthority, PluginType, UpdateDelegate},
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

// hash collection mint, token id and secret key and return string representation limited to 8 symbols
pub fn get_asset_hash(id: &u64, mint: &Pubkey, key: &Pubkey) -> String {
    let mint_bytes = mint.to_string().as_bytes().to_vec();
    let id_bytes = id.to_string().as_bytes().to_vec();
    let key_bytes = key.to_string().as_bytes().to_vec();

    let data = vec![mint_bytes, id_bytes, key_bytes]
        .iter()
        .flatten()
        .cloned()
        .collect::<Vec<u8>>();

    hash(&data).to_string()[0..8].to_string()
}

pub struct CollectionPluginAuthorityHelperAccounts<'info> {
    pub payer: AccountInfo<'info>,
    pub collection: AccountInfo<'info>,
    pub authority_pda: AccountInfo<'info>,
    pub core_program: AccountInfo<'info>,
    pub system_program: AccountInfo<'info>,
}

pub fn approve_asset_collection_delegate(
    accounts: &CollectionPluginAuthorityHelperAccounts,
) -> Result<()> {
    // add UpdateDelegate plugin if it does not exist on the Collection
    let maybe_update_plugin = fetch_plugin::<BaseCollectionV1, UpdateDelegate>(
        &accounts.collection,
        PluginType::UpdateDelegate,
    );
    if maybe_update_plugin.is_err() {
        AddCollectionPluginV1CpiBuilder::new(&accounts.core_program)
            .collection(&accounts.collection)
            .authority(Some(&accounts.payer))
            .plugin(Plugin::UpdateDelegate(UpdateDelegate {
                additional_delegates: vec![],
            }))
            .payer(&accounts.payer)
            .system_program(&accounts.system_program)
            .invoke()?;
    }

    // add CM authority to collection if it doesn't exist
    let (_, update_plugin, _) = fetch_plugin::<BaseCollectionV1, UpdateDelegate>(
        &accounts.collection,
        PluginType::UpdateDelegate,
    )?;

    if !update_plugin
        .additional_delegates
        .contains(accounts.authority_pda.key)
    {
        // add CM authority as an additional delegate
        let mut new_auths = update_plugin.additional_delegates.clone();
        new_auths.push(accounts.authority_pda.key());

        UpdateCollectionPluginV1CpiBuilder::new(&accounts.core_program)
            .collection(&accounts.collection)
            .authority(Some(&accounts.payer))
            .plugin(Plugin::UpdateDelegate(UpdateDelegate {
                additional_delegates: new_auths,
            }))
            .system_program(&accounts.system_program)
            .payer(&accounts.payer)
            .invoke()
            .map_err(|error| error.into())
    } else {
        Ok(())
    }
}

pub fn revoke_asset_collection_delegate(
    accounts: &CollectionPluginAuthorityHelperAccounts,
    signer_seeds: [&[u8]; 2],
) -> Result<()> {
    let maybe_update_delegate_plugin = fetch_plugin::<BaseCollectionV1, UpdateDelegate>(
        &accounts.collection,
        PluginType::UpdateDelegate,
    );

    let has_auth = match maybe_update_delegate_plugin {
        Ok((auth, _, _)) => {
            auth == PluginAuthority::Address {
                address: accounts.authority_pda.key(),
            }
        }
        _ => false,
    };

    if has_auth {
        RevokeCollectionPluginAuthorityV1CpiBuilder::new(&accounts.core_program)
            .collection(&accounts.collection)
            .authority(Some(&accounts.authority_pda))
            .plugin_type(PluginType::UpdateDelegate)
            .system_program(&accounts.system_program)
            .payer(&accounts.payer)
            .invoke_signed(&[&signer_seeds])
            .map_err(|error| error.into())
    } else {
        Ok(())
    }
}

/// Accounts to mint an Asset.
pub struct AssetHelperAccounts<'info> {
    pub authority_pda: AccountInfo<'info>,
    pub payer: AccountInfo<'info>,
    pub asset_owner: AccountInfo<'info>,
    pub asset: AccountInfo<'info>,
    pub collection: AccountInfo<'info>,
    pub core_program: AccountInfo<'info>,
    pub system_program: AccountInfo<'info>,
    pub log_wrapper: Option<AccountInfo<'info>>,
}

#[derive(Debug)]
pub struct CreateV1Args {
    pub name: String,
    pub uri: String,
    // TODO: Add ability to add plugins
}

pub fn create_asset_v1(
    acc: &AssetHelperAccounts,
    args: CreateV1Args,
    signer_seeds: [&[u8]; 2],
) -> Result<()> {
    CreateV1CpiBuilder::new(&acc.core_program)
        .payer(&acc.payer)
        .owner(Some(&acc.asset_owner))
        .asset(&acc.asset)
        .name(args.name)
        .uri(args.uri)
        .collection(Some(&acc.collection))
        .data_state(DataState::AccountState)
        .authority(Some(&acc.authority_pda))
        .system_program(&acc.system_program)
        .log_wrapper(acc.log_wrapper.as_ref())
        .invoke_signed(&[&signer_seeds])
        .map_err(|error| error.into())
}

pub fn burn_asset_v1(acc: &AssetHelperAccounts) -> Result<()> {
    BurnV1CpiBuilder::new(&acc.core_program)
        .payer(&acc.payer)
        .asset(&acc.asset)
        .collection(Some(&acc.collection))
        .system_program(Some(&acc.system_program))
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
