import { expect } from 'chai';
import { PublicKey, Signer, Umi, publicKey, transactionBuilder } from '@metaplex-foundation/umi';

import {
  SPL_ASSOCIATED_TOKEN_PROGRAM_ID,
  fetchToken,
  findAssociatedTokenPda,
  safeFetchToken,
  setComputeUnitLimit,
} from '@metaplex-foundation/mpl-toolbox';

import {
  fetchTransmuteFactory,
  findFactoryAuthorityPda,
  enchant,
  transmuteFrom,
  transmuteInto,
  setAuthority,
  update,
  AssetData,
  safeFetchTransmuteFactory,
  TokenData,
  findFactoryDataPda,
  disenchant,
  setPause,
} from '../packages/client/src';

import { explorerTxLink } from '../src/utils/explorer';
import { logInfo } from '../src/utils/logger';

import {
  AssetAccounts,
  CollectionAccounts,
  TOKEN_DATA,
  TokenAccounts,
  generateAsset,
  generateCollection,
  generateToken,
} from './_setup';
import { createUmi } from '../src/utils/umi';
import { MPL_TOKEN_AUTH_RULES_PROGRAM_ID } from '@metaplex-foundation/mpl-candy-machine';

export const MPL_DEFAULT_RULESET = publicKey('eBJLFYPxJmMGKuFwpDWkzxZeUrad92kZRC5BJLpzyT9');

const AUTH_ERROR_MESSAGE = 'Error Number: 2001. Error Message: A has one constraint was violated.';

const DEBUG = process.env.DEBUG === 'true' || false;

interface SetupInterface {
  umi: Umi;
  deployer: Signer;
  minter: Signer;
  delegate: Signer;
  authorityPda: PublicKey;
  dataPda: PublicKey;
  collection: CollectionAccounts;
  asset: AssetAccounts;
  token: TokenAccounts;
  treasurePda: PublicKey;
}

const setupTestcase = async (): Promise<SetupInterface> => {
  const { umi, deployer, minter, delegate } = await createUmi();

  const [authorityPda] = findFactoryAuthorityPda(umi);
  const [dataPda] = findFactoryDataPda(umi);

  const collection = await generateCollection(umi, authorityPda);

  const asset = await generateAsset(umi, minter);
  const token = await generateToken(umi, minter);

  const [treasurePda] = findAssociatedTokenPda(umi, {
    mint: token.mint.publicKey,
    owner: authorityPda,
  });

  return {
    umi,
    deployer,
    minter,
    delegate,
    authorityPda,
    dataPda,
    collection,
    asset,
    token,
    treasurePda,
  };
};

describe('Sin Transmute Factory', () => {
  let setup: SetupInterface;

  before(async () => {
    setup = await setupTestcase();
  });

  it('[Success] Enchant', async () => {
    const { umi, authorityPda, dataPda, collection, token, treasurePda } = setup;

    umi.payer = collection.authority;

    const expectedAssetData: AssetData = {
      assetSymbol: 'SINNER',
      assetNextIndex: 667n,
      assetNamePrefix: 'Sinner #',
      assetUriPrefix: 'https://meta.sindao.org/metadata/',
      assetUriSuffix: '',
      assetSellerFeeBasisPoints: 99,
      assetCreators: [
        {
          address: collection.authority.publicKey,
          verified: true,
          percentageShare: 100,
        },
      ],
    };
    const expectedTokenData: TokenData = {
      tokenFromAmount: 666n * 10n ** TOKEN_DATA.decimals,
      tokenIntoAmount: 600n * 10n ** TOKEN_DATA.decimals,
    };

    const initResult = await enchant(umi, {
      factory: dataPda,
      authorityPda: authorityPda,
      collectionMint: collection.mint.publicKey,
      collectionMetadata: collection.metadata,
      collectionMasterEdition: collection.masterEdition,
      collectionDelegateRecord: collection.delegateRecord,
      collectionUpdateAuthority: collection.authority,
      ruleSet: MPL_DEFAULT_RULESET,
      tokenMint: token.mint.publicKey,
      tokenTreasure: treasurePda,
      associatedTokenProgram: SPL_ASSOCIATED_TOKEN_PROGRAM_ID,
      authorizationRulesProgram: MPL_TOKEN_AUTH_RULES_PROGRAM_ID,
      // TODO Find out which account to use for this param
      authorizationRules: MPL_DEFAULT_RULESET,
      assetData: expectedAssetData,
      tokenData: expectedTokenData,
    }).sendAndConfirm(umi, { send: { skipPreflight: true } });

    DEBUG && logInfo('Enchant', explorerTxLink(initResult.signature));

    const dataAccount = await fetchTransmuteFactory(umi, dataPda);
    expect(dataAccount.assetData).to.deep.equal(expectedAssetData);
    expect(dataAccount.tokenData).to.deep.equal(expectedTokenData);
  });

  it('[Error] Second Enchant', async () => {
    const { umi, authorityPda, dataPda, collection, token, treasurePda } = setup;

    umi.payer = collection.authority;

    const expectedAssetData: AssetData = {
      assetSymbol: 'SINNER',
      assetNextIndex: 667n,
      assetNamePrefix: 'Sinner #',
      assetUriPrefix: 'https://meta.sindao.org/metadata/',
      assetUriSuffix: '',
      assetSellerFeeBasisPoints: 99,
      assetCreators: [
        {
          address: collection.authority.publicKey,
          verified: true,
          percentageShare: 100,
        },
      ],
    };
    const expectedTokenData: TokenData = {
      tokenFromAmount: 666n * 10n ** TOKEN_DATA.decimals,
      tokenIntoAmount: 600n * 10n ** TOKEN_DATA.decimals,
    };

    const tx = await enchant(umi, {
      factory: dataPda,
      authorityPda: authorityPda,
      collectionMint: collection.mint.publicKey,
      collectionMetadata: collection.metadata,
      collectionMasterEdition: collection.masterEdition,
      collectionDelegateRecord: collection.delegateRecord,
      collectionUpdateAuthority: collection.authority,
      ruleSet: MPL_DEFAULT_RULESET,
      tokenMint: token.mint.publicKey,
      tokenTreasure: treasurePda,
      associatedTokenProgram: SPL_ASSOCIATED_TOKEN_PROGRAM_ID,
      authorizationRulesProgram: MPL_TOKEN_AUTH_RULES_PROGRAM_ID,
      // TODO Find out which account to use for this param
      authorizationRules: MPL_DEFAULT_RULESET,
      assetData: expectedAssetData,
      tokenData: expectedTokenData,
    }).sendAndConfirm(umi, { send: { skipPreflight: true } });

    DEBUG && logInfo('Second Enchant', explorerTxLink(tx.signature));

    const receipt = await umi.rpc.getTransaction(tx.signature);
    expect(receipt?.meta.logs.some((l) => l.includes('already in use'))).eq(true);
  });

  it('[Success] Transmute From', async () => {
    const { umi, dataPda, authorityPda, collection, asset, token, treasurePda } = setup;

    // logInfo('Asset', explorerAddressLink(token.owner_ata));

    // !!! IMPORTANT change payer to minter account in this test and below
    umi.payer = asset.authority;

    const transmuteResult = await transactionBuilder()
      .add(setComputeUnitLimit(umi, { units: 600_000 }))
      .add(
        transmuteFrom(umi, {
          factory: dataPda,
          authorityPda: authorityPda,
          user: token.authority,
          assetOwner: asset.authority.publicKey,
          assetMint: asset.mint,
          assetMetadata: asset.metadata,
          assetMasterEdition: asset.masterEdition,
          assetToken: asset.token,
          assetTokenRecord: asset.tokenRecord,
          collectionMint: collection.mint.publicKey,
          collectionMetadata: collection.metadata,
          collectionMasterEdition: collection.masterEdition,
          collectionDelegateRecord: collection.delegateRecord,
          collectionUpdateAuthority: collection.authority.publicKey,
          tokenMint: token.mint.publicKey,
          tokenTreasure: treasurePda,
          userTokenAta: token.owner_ata,
          associatedTokenProgram: SPL_ASSOCIATED_TOKEN_PROGRAM_ID,
          authorizationRulesProgram: MPL_TOKEN_AUTH_RULES_PROGRAM_ID,
          // TODO Find out which account to use for this param
          authorizationRules: MPL_DEFAULT_RULESET,
        })
      )
      .sendAndConfirm(umi, { send: { skipPreflight: true } });

    DEBUG && logInfo('Transmute From', explorerTxLink(transmuteResult.signature));

    const dataAccount = await fetchTransmuteFactory(umi, dataPda);
    expect(dataAccount.assetData.assetNextIndex).to.equal(668n);
    // check factory token ata balance
    const treasureAccount = await fetchToken(umi, treasurePda);
    expect(treasureAccount.amount).to.equal(600000000n);
  });

  it('[Success] Set Pause', async () => {
    const { umi, deployer, dataPda } = setup;

    umi.payer = deployer;

    const updateResult = await setPause(umi, {
      factory: dataPda,
      authority: deployer,
      paused: true,
    }).sendAndConfirm(umi, { send: { skipPreflight: true } });

    DEBUG && logInfo('Set Pause', explorerTxLink(updateResult.signature));

    const dataAccount = await fetchTransmuteFactory(umi, dataPda);
    expect(dataAccount.paused).to.eq(true);
  });

  it('[Error] Transmute Paused', async () => {
    const { umi, dataPda, authorityPda, collection, asset, token, treasurePda } = setup;

    umi.payer = asset.authority;

    const transmuteResult = await transmuteInto(umi, {
      factory: dataPda,
      authorityPda: authorityPda,
      user: asset.authority,
      assetMint: asset.mint.publicKey,
      assetCollectionMetadata: collection.metadata,
      assetMetadata: asset.metadata,
      assetMasterEdition: asset.masterEdition,
      assetToken: asset.token,
      assetTokenRecord: asset.tokenRecord,
      tokenMint: token.mint.publicKey,
      tokenTreasure: treasurePda,
      userTokenAta: token.owner_ata,
      associatedTokenProgram: SPL_ASSOCIATED_TOKEN_PROGRAM_ID,
    }).sendAndConfirm(umi, { send: { skipPreflight: true } });

    DEBUG && logInfo('Transmute Paused', explorerTxLink(transmuteResult.signature));

    const receipt = await umi.rpc.getTransaction(transmuteResult.signature);
    expect(
      receipt?.meta.logs.some((l) =>
        l.includes('Error Number: 6023. Error Message: Transmutations paused.')
      )
    ).eq(true);
  });

  it('[Success] Set Unpause', async () => {
    const { umi, deployer, dataPda } = setup;

    umi.payer = deployer;

    const updateResult = await setPause(umi, {
      factory: dataPda,
      authority: deployer,
      paused: false,
    }).sendAndConfirm(umi, { send: { skipPreflight: true } });

    DEBUG && logInfo('Set Unpause', explorerTxLink(updateResult.signature));

    const dataAccount = await fetchTransmuteFactory(umi, dataPda);
    expect(dataAccount.paused).to.eq(false);
  });

  it('[Success] Transmute Into', async () => {
    const { umi, dataPda, authorityPda, collection, asset, token, treasurePda } = setup;

    umi.payer = asset.authority;

    const transmuteResult = await transmuteInto(umi, {
      factory: dataPda,
      authorityPda: authorityPda,
      user: asset.authority,
      assetMint: asset.mint.publicKey,
      assetCollectionMetadata: collection.metadata,
      assetMetadata: asset.metadata,
      assetMasterEdition: asset.masterEdition,
      assetToken: asset.token,
      assetTokenRecord: asset.tokenRecord,
      tokenMint: token.mint.publicKey,
      tokenTreasure: treasurePda,
      userTokenAta: token.owner_ata,
      associatedTokenProgram: SPL_ASSOCIATED_TOKEN_PROGRAM_ID,
    }).sendAndConfirm(umi, { send: { skipPreflight: true } });

    DEBUG && logInfo('Transmute Into', explorerTxLink(transmuteResult.signature));
    // check factory token ata balance
    const treasureAccount = await fetchToken(umi, treasurePda);
    expect(treasureAccount.amount).to.equal(0n);
  });

  it('[Success] Set Authority', async () => {
    const { umi, deployer, delegate, dataPda } = setup;

    umi.payer = deployer;

    const updateResult = await setAuthority(umi, {
      factory: dataPda,
      authority: deployer,
      newAuthority: delegate.publicKey,
    }).sendAndConfirm(umi, { send: { skipPreflight: true } });

    DEBUG && logInfo('Set Authority', explorerTxLink(updateResult.signature));

    const dataAccount = await fetchTransmuteFactory(umi, dataPda);
    expect(dataAccount.authority).to.deep.equal(delegate.publicKey);
  });

  it('[Error] Authority Constrains - `set_authority`', async () => {
    const { umi, deployer, delegate, dataPda } = setup;

    umi.payer = deployer;

    // check set authority
    const tx = await setAuthority(umi, {
      factory: dataPda,
      authority: deployer,
      newAuthority: delegate.publicKey,
    }).sendAndConfirm(umi, { send: { skipPreflight: true } });

    const receipt = await umi.rpc.getTransaction(tx.signature);
    expect(receipt?.meta.logs.some((l) => l.includes(AUTH_ERROR_MESSAGE))).eq(true);
  });

  it('[Error] Authority Constrains - `set_pause`', async () => {
    const { umi, deployer, dataPda } = setup;

    umi.payer = deployer;

    // check set pause
    const tx = await setPause(umi, {
      factory: dataPda,
      authority: deployer,
      paused: false,
    }).sendAndConfirm(umi, { send: { skipPreflight: true } });

    const receipt = await umi.rpc.getTransaction(tx.signature);
    expect(receipt?.meta.logs.some((l) => l.includes(AUTH_ERROR_MESSAGE))).eq(true);
  });

  it('[Error] Authority Constrains - `update`', async () => {
    const { umi, deployer, dataPda, collection } = setup;

    umi.payer = deployer;

    const expectedAssetData: AssetData = {
      assetSymbol: 'SINNER',
      assetNextIndex: 1024n,
      assetNamePrefix: 'Sinnew #',
      assetUriPrefix: 'https://meta.sindao.org/metadata/',
      assetUriSuffix: '',
      assetSellerFeeBasisPoints: 99,
      assetCreators: [
        {
          address: collection.authority.publicKey,
          verified: true,
          percentageShare: 100,
        },
      ],
    };
    const expectedTokenData: TokenData = {
      tokenFromAmount: 20n * 10n ** TOKEN_DATA.decimals,
      tokenIntoAmount: 10n * 10n ** TOKEN_DATA.decimals,
    };

    const tx = await update(umi, {
      factory: dataPda,
      authority: deployer,
      assetData: expectedAssetData,
      tokenData: expectedTokenData,
    }).sendAndConfirm(umi, { send: { skipPreflight: true } });

    const receipt = await umi.rpc.getTransaction(tx.signature);
    expect(receipt?.meta.logs.some((l) => l.includes(AUTH_ERROR_MESSAGE))).eq(true);
  });

  it('[Error] Authority Constrains - `disenchant`', async () => {
    const { umi, deployer, dataPda, token, authorityPda, treasurePda } = setup;

    umi.payer = deployer;

    const [ata] = findAssociatedTokenPda(umi, {
      mint: token.mint.publicKey,
      owner: deployer.publicKey,
    });

    const tx = await disenchant(umi, {
      factory: dataPda,
      authorityPda: authorityPda,
      authority: deployer,
      tokenMint: token.mint.publicKey,
      tokenTreasure: treasurePda,
      authorityTokenAta: ata,
      associatedTokenProgram: SPL_ASSOCIATED_TOKEN_PROGRAM_ID,
    }).sendAndConfirm(umi, { send: { skipPreflight: true } });

    const receipt = await umi.rpc.getTransaction(tx.signature);
    expect(receipt?.meta.logs.some((l) => l.includes(AUTH_ERROR_MESSAGE))).eq(true);
  });

  it('[Success] Update', async () => {
    const { umi, collection, delegate, dataPda } = setup;

    umi.payer = delegate;

    const expectedAssetData: AssetData = {
      assetSymbol: 'SINNER',
      assetNextIndex: 1024n,
      assetNamePrefix: 'Sinnew #',
      assetUriPrefix: 'https://meta.sindao.org/metadata/',
      assetUriSuffix: '',
      assetSellerFeeBasisPoints: 99,
      assetCreators: [
        {
          address: collection.authority.publicKey,
          verified: true,
          percentageShare: 100,
        },
      ],
    };
    const expectedTokenData: TokenData = {
      tokenFromAmount: 20n * 10n ** TOKEN_DATA.decimals,
      tokenIntoAmount: 10n * 10n ** TOKEN_DATA.decimals,
    };

    const updateResult = await update(umi, {
      factory: dataPda,
      authority: delegate,
      assetData: expectedAssetData,
      tokenData: expectedTokenData,
    }).sendAndConfirm(umi);

    DEBUG && logInfo('Update', explorerTxLink(updateResult.signature));

    const dataAccount = await fetchTransmuteFactory(umi, dataPda);
    expect(dataAccount.assetData).to.deep.equal(expectedAssetData);
    expect(dataAccount.tokenData).to.deep.equal(expectedTokenData);
  });

  it('[Success] Disenchant', async () => {
    const { umi, deployer, delegate, dataPda, authorityPda, token, treasurePda } = setup;

    // switch back authority
    umi.payer = delegate;
    await setAuthority(umi, {
      factory: dataPda,
      authority: delegate,
      newAuthority: deployer.publicKey,
    }).sendAndConfirm(umi);

    umi.payer = deployer;

    const [ata] = findAssociatedTokenPda(umi, {
      mint: token.mint.publicKey,
      owner: deployer.publicKey,
    });

    const updateResult = await disenchant(umi, {
      factory: dataPda,
      authorityPda: authorityPda,
      authority: deployer,
      tokenMint: token.mint.publicKey,
      tokenTreasure: treasurePda,
      authorityTokenAta: ata,
      associatedTokenProgram: SPL_ASSOCIATED_TOKEN_PROGRAM_ID,
    }).sendAndConfirm(umi, { send: { skipPreflight: true } });

    DEBUG && logInfo('Disenchant', explorerTxLink(updateResult.signature));

    const dataAccount = await safeFetchTransmuteFactory(umi, dataPda);
    expect(dataAccount).to.eq(null);
    // check factory token ata balance
    const treasureAccount = await safeFetchToken(umi, treasurePda);
    expect(treasureAccount).to.equal(null);
  });
});
