use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::{get_associated_token_address_with_program_id, AssociatedToken},
    token::{Burn, Mint, Token, TokenAccount, Transfer},
};

use mpl_core::{accounts::BaseCollectionV1, ID as CORE_PROGRAM_ID};

use crate::{
    constants::{AUTHORITY_SEED, DATA_SEED, PROTOCOL_FEE, PROTOCOL_FEE_WALLET},
    errors::FusionError,
    utils::{
        cmp_pubkeys, cmp_pubkeys_opt, create_asset_v1, get_asset_hash,
        get_pubkey_opt_from_account_info, sol_transfer, AssetV1Accounts, CreateV1Args,
    },
    FusionDataV1,
};

/// Accounts for CPI calls
pub(crate) struct FusionIntoAccountsV1<'info> {
    // payer
    pub payer: AccountInfo<'info>,
    //token related accounts
    pub token_mint: AccountInfo<'info>,
    pub from: AccountInfo<'info>,
    pub to: AccountInfo<'info>,
    // fee related accounts
    pub fee_from: AccountInfo<'info>,
    pub fee_recipient: Option<AccountInfo<'info>>,
    pub fee_recipient_ata: Option<AccountInfo<'info>>,
    // asset related accounts
    pub asset: AccountInfo<'info>,
    pub collection: AccountInfo<'info>,
    // programs
    pub token_program: AccountInfo<'info>,
    pub core_program: AccountInfo<'info>,
    pub system_program: AccountInfo<'info>,
    pub log_wrapper: Option<AccountInfo<'info>>,
}

impl From<&FusionDataV1> for CreateV1Args {
    fn from(data: &FusionDataV1) -> Self {
        Self {
            name: format!(
                "{}{}",
                data.asset_data.name_prefix, data.asset_data.next_index
            ),
            uri: format!(
                "{}{}{}/{}",
                data.asset_data.uri_prefix,
                data.asset_data.next_index,
                data.asset_data.uri_suffix,
                get_asset_hash(
                    &data.asset_data.next_index,
                    &data.collection,
                    &PROTOCOL_FEE_WALLET
                )
            ),
        }
    }
}

pub fn handler_fusion_into_v1<'info>(
    ctx: Context<'_, '_, '_, 'info, FusionIntoV1Ctx<'info>>,
) -> Result<()> {
    let fusion = &mut ctx.accounts.fusion_data;
    let accounts = FusionIntoAccountsV1 {
        // payer
        payer: ctx.accounts.user.to_account_info(),
        // token related accounts
        token_mint: ctx.accounts.token_mint.to_account_info(),
        from: ctx.accounts.user_ata.to_account_info(),
        to: ctx.accounts.escrow_ata_pda.to_account_info(),
        // fee related accounts
        fee_from: ctx.accounts.user_ata.to_account_info(),
        fee_recipient: ctx
            .accounts
            .fee_recipient
            .as_ref()
            .map(|spl_fee_dest| spl_fee_dest.to_account_info()),
        fee_recipient_ata: ctx
            .accounts
            .fee_recipient_ata
            .as_ref()
            .map(|sol_fee_dest| sol_fee_dest.to_account_info()),
        // asset related accounts
        asset: ctx.accounts.asset.to_account_info(),
        collection: ctx.accounts.collection.to_account_info(),
        // programs
        token_program: ctx.accounts.token_program.to_account_info(),
        core_program: ctx.accounts.core_program.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
        log_wrapper: ctx
            .accounts
            .log_wrapper
            .as_ref()
            .map(|log_wrapper| log_wrapper.to_account_info()),
    };

    process_fee_and_transfer(fusion, &accounts)?;

    process_mint(fusion, &accounts, ctx.bumps.authority_pda)?;

    sol_transfer(
        accounts.payer.to_account_info(),
        ctx.accounts.fee_account.to_account_info(),
        PROTOCOL_FEE,
    )?;

    Ok(())
}

/// Transfers tokens to the escrow and take fees according to the fee data.
pub(crate) fn process_fee_and_transfer(
    fusion: &mut Account<'_, FusionDataV1>,
    accounts: &FusionIntoAccountsV1,
) -> Result<()> {
    // (0) sanity checks

    // is not paused
    fusion.validate()?;

    // double check that we got the correct token mint
    if !cmp_pubkeys(&accounts.token_mint.key(), &fusion.token_mint) {
        return err!(FusionError::TokenKeyMismatch);
    }

    // short references
    let fee_amount = fusion.fee_data.fee_amount;
    let sol_fee_amount = fusion.fee_data.sol_fee_amount;
    let burn_amount = fusion.fee_data.burn_amount;
    let escrow_amount = fusion.fee_data.escrow_amount;

    let is_fee_charged = fusion.fee_data.is_fee_charged();
    let fee_recipient_opt = fusion.fee_data.fee_recipient.as_ref();

    // Check that we have correct fee recipient accounts
    if is_fee_charged {
        require!(
            cmp_pubkeys_opt(
                get_pubkey_opt_from_account_info(&accounts.fee_recipient),
                fee_recipient_opt
            ),
            FusionError::InvalidFeeRecipient
        );
        // if there is spl fee, check that fee recipient ata is correct
        if fee_amount > 0 {
            if let Some(fee_recipient) = fee_recipient_opt {
                let fee_recipient_ata = get_associated_token_address_with_program_id(
                    fee_recipient,
                    &accounts.token_mint.key(),
                    &accounts.token_program.key(),
                );
                require!(
                    cmp_pubkeys_opt(
                        get_pubkey_opt_from_account_info(&accounts.fee_recipient_ata),
                        Some(&fee_recipient_ata)
                    ),
                    FusionError::InvalidFeeRecipient
                );
            } else {
                return Err(FusionError::InvalidFeeRecipient.into());
            }
        }
    }

    // (1) if there is sol fee and account is set, transfer sol to the recipient
    if sol_fee_amount > 0 {
        if let Some(fee_recipient) = &accounts.fee_recipient {
            sol_transfer(
                accounts.payer.to_account_info(),
                fee_recipient.to_account_info(),
                sol_fee_amount,
            )?;
        }
    }

    // (2) If fee amount is set, transfer spl to fee recipient ata
    if fee_amount > 0 {
        if let Some(fee_recipient_ata) = &accounts.fee_recipient_ata {
            let cpi_ctx = CpiContext::new(
                accounts.token_program.to_account_info(),
                Transfer {
                    from: accounts.fee_from.to_account_info(),
                    to: fee_recipient_ata.to_account_info(),
                    authority: accounts.payer.to_account_info(),
                },
            );

            anchor_spl::token::transfer(cpi_ctx, fee_amount)?;
            msg!("Fee: {} SPL", fee_amount);
        }
    }

    // (3) If burn amount is set, burn the amount
    if burn_amount > 0 {
        let cpi_ctx = CpiContext::new(
            accounts.token_program.to_account_info(),
            Burn {
                mint: accounts.token_mint.to_account_info(),
                from: accounts.from.to_account_info(),
                authority: accounts.payer.to_account_info(),
            },
        );

        anchor_spl::token::burn(cpi_ctx, burn_amount)?;
        msg!("Burn: {} SPL", burn_amount);
    }

    // (4) Transfer the rest to the escrow if there is any

    if escrow_amount > 0 {
        let cpi_ctx = CpiContext::new(
            accounts.token_program.to_account_info(),
            Transfer {
                from: accounts.from.to_account_info(),
                to: accounts.to.to_account_info(),
                authority: accounts.payer.to_account_info(),
            },
        );

        anchor_spl::token::transfer(cpi_ctx, escrow_amount)?;
        msg!("Escrow: {} SPL", escrow_amount);
    }

    Ok(())
}

/// Mint a new NFT.
pub(crate) fn process_mint(
    fusion: &mut Account<'_, FusionDataV1>,
    accounts: &FusionIntoAccountsV1,
    bump: u8,
) -> Result<()> {
    // (1) sanity checks

    // is not paused
    fusion.validate()?;

    if !accounts.asset.data_is_empty() {
        return err!(FusionError::MetadataAccountMustBeEmpty);
    }
    // double check that we got the correct collection mint
    // also checked in account constraints
    if !cmp_pubkeys(&accounts.collection.key(), &fusion.collection) {
        return err!(FusionError::CollectionKeyMismatch);
    }

    // collection must be owned by mpl_core program
    if !cmp_pubkeys(accounts.collection.owner, &CORE_PROGRAM_ID) {
        return err!(FusionError::IncorrectOwner);
    }

    // current collection minted assets should be less then max supply
    let collection_metadata = BaseCollectionV1::try_from(&accounts.collection.to_account_info())?;
    if collection_metadata.current_size >= fusion.asset_data.max_supply.unwrap_or(u32::MAX) {
        return err!(FusionError::MaxSupplyReached);
    }

    // (2) prepare an asset to mint

    // asset accounts
    let accounts = AssetV1Accounts {
        asset: accounts.asset.to_account_info(),
        collection: Some(accounts.collection.to_account_info()),
        payer: accounts.payer.to_account_info(),
        core_program: accounts.core_program.to_account_info(),
        system_program: accounts.system_program.to_account_info(),
        log_wrapper: accounts
            .log_wrapper
            .as_ref()
            .map(|log_wrapper| log_wrapper.to_account_info()),
    };

    // asset args
    let args = CreateV1Args::from(fusion.as_ref());

    msg!("Asset: {:?} minted", args);

    // increase next index
    fusion.asset_data.next_index = fusion
        .asset_data
        .next_index
        .checked_add(1)
        .ok_or(FusionError::NumericalOverflowError)?;

    // (3) minting
    create_asset_v1(accounts, args, [AUTHORITY_SEED.as_bytes(), &[bump]])
}

/// Fusion tokens into an asset.
#[derive(Accounts)]
pub struct FusionIntoV1Ctx<'info> {
    /// Fusion data account.
    #[account(mut, seeds = [DATA_SEED.as_bytes()], bump)]
    fusion_data: Account<'info, FusionDataV1>,

    /// Authority pda.
    /// CHECK: account checked in seeds constraint
    #[account(seeds = [AUTHORITY_SEED.as_bytes()], bump)]
    authority_pda: UncheckedAccount<'info>,

    /// Asset owner, transaction and rent payer.
    #[account(mut)]
    user: Signer<'info>,

    /// Account of the Asset. Will be initialized with the new asset.
    #[account(mut)]
    asset: Signer<'info>,

    /// Collection account.
    #[account(mut, address = fusion_data.collection, owner = CORE_PROGRAM_ID)]
    collection: Account<'info, BaseCollectionV1>,

    /// Mint account of the token.
    #[account(mut, address = fusion_data.token_mint)]
    token_mint: Account<'info, Mint>,

    /// Token escrow pda ata account.
    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = authority_pda
    )]
    escrow_ata_pda: Account<'info, TokenAccount>,

    /// User ata account.
    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = user
    )]
    user_ata: Account<'info, TokenAccount>,

    /// Fee recipient account, optional.
    /// CHECK: checked in the fee cpis
    #[account(mut)]
    fee_recipient: Option<UncheckedAccount<'info>>,

    /// Fee recipient ata account, optional.
    /// CHECK: checked in the fee cpis
    #[account(mut)]
    fee_recipient_ata: Option<UncheckedAccount<'info>>,

    /// Protocol fee account.
    /// CHECK: checked by account constraint
    #[account(
        mut,
        address = PROTOCOL_FEE_WALLET @ FusionError::InvalidProtocolFeeWallet
    )]
    fee_account: UncheckedAccount<'info>,

    /// Token program.
    token_program: Program<'info, Token>,

    /// Associated Token program.
    associated_token_program: Program<'info, AssociatedToken>,

    /// MPL Core program.
    /// CHECK: checked by account constraint
    #[account(address = CORE_PROGRAM_ID)]
    core_program: UncheckedAccount<'info>,

    /// System program.
    system_program: Program<'info, System>,

    /// The SPL Noop program.
    /// CHECK: Checked in mpl-core.
    log_wrapper: Option<AccountInfo<'info>>,
}
