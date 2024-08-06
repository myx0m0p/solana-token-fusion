import { expect } from 'chai';
import { some } from '@metaplex-foundation/umi';

import { fetchToken, findAssociatedTokenPda } from '@metaplex-foundation/mpl-toolbox';

import { explorerAddressLink, explorerTxLink } from '../src/utils/explorer';
import { AppLogger } from '../src/utils/logger';

import { generateAsset, createCollection, createToken } from './_setup';
import { createUmi } from '../src/utils/umi';

import {
  AssetDataV1,
  fetchFusionDataV1,
  findEscrowAtaPda,
  findFusionDataPda,
  fusionFromV1,
  fusionIntoV1,
  initV1,
  TokenDataV1,
} from '../packages/client';
import { fetchAsset, fetchCollection, safeFetchAssetV1 } from '@metaplex-foundation/mpl-core';

// const AUTH_ERROR_MESSAGE = 'Error Number: 2001. Error Message: A has one constraint was violated.';

const DEBUG = process.env.DEBUG === 'true' || false;

type TestContext = Awaited<Promise<PromiseLike<ReturnType<typeof setupContext>>>>;

const setupContext = async () => {
  const { umi, deployer, user, token: tokenSigner, collection: collectionSigner } = await createUmi();

  const [dataPda] = findFusionDataPda(umi);

  const token = await createToken(umi, { mint: tokenSigner });
  const collection = await createCollection(umi, { collection: collectionSigner });
  const asset = await generateAsset(umi);

  return {
    umi,
    deployer,
    user,
    dataPda,
    token,
    collection,
    asset,
  };
};

const ASSET_DATA_V1: AssetDataV1 = {
  maxSupply: some(3),
  nextIndex: 1n,
  namePrefix: 'STF #',
  uriPrefix: 'https://stf.org/assets/',
  uriSuffix: '.json',
};

const TOKEN_DATA_V1: TokenDataV1 = {
  intoAmount: 100n * 10n ** 9n, // mint asset
  fromAmount: 100n * 10n ** 9n, // burn asset
};

describe('Solana Token Fusion Protocol', () => {
  let context: TestContext;

  before(async () => {
    context = await setupContext();
  });

  it('[Success] InitV1', async () => {
    const { umi, dataPda, token, collection } = context;

    // umi.identity = deployer

    const initResult = await initV1(umi, {
      tokenMint: token.mint.publicKey,
      collection: collection.collection.publicKey,
      assetData: ASSET_DATA_V1,
      tokenData: TOKEN_DATA_V1,
    }).sendAndConfirm(umi, { send: { skipPreflight: true } });

    DEBUG && AppLogger.info('Init TX', explorerTxLink(initResult.signature));

    const dataAccount = await fetchFusionDataV1(umi, dataPda);

    DEBUG && AppLogger.info('Data Account', dataAccount);

    expect(dataAccount.assetData).to.deep.equal(ASSET_DATA_V1);
    expect(dataAccount.tokenData).to.deep.equal(TOKEN_DATA_V1);
  });

  // it('[Error] Second Enchant', async () => {
  //   const { umi, authorityPda, dataPda, collection, token, treasurePda } = setup;

  //   umi.payer = collection.authority;

  //   const expectedAssetData: AssetData = {
  //     assetSymbol: 'SINNER',
  //     assetNextIndex: 667n,
  //     assetNamePrefix: 'Sinner #',
  //     assetUriPrefix: 'https://meta.sindao.org/metadata/',
  //     assetUriSuffix: '',
  //     assetSellerFeeBasisPoints: 99,
  //     assetCreators: [
  //       {
  //         address: collection.authority.publicKey,
  //         verified: true,
  //         percentageShare: 100,
  //       },
  //     ],
  //   };
  //   const expectedTokenData: TokenData = {
  //     tokenFromAmount: 666n * 10n ** TOKEN_DATA.decimals,
  //     tokenIntoAmount: 600n * 10n ** TOKEN_DATA.decimals,
  //   };

  //   const tx = await enchant(umi, {
  //     factory: dataPda,
  //     authorityPda: authorityPda,
  //     collectionMint: collection.mint.publicKey,
  //     collectionMetadata: collection.metadata,
  //     collectionMasterEdition: collection.masterEdition,
  //     collectionDelegateRecord: collection.delegateRecord,
  //     collectionUpdateAuthority: collection.authority,
  //     ruleSet: MPL_DEFAULT_RULESET,
  //     tokenMint: token.mint.publicKey,
  //     tokenTreasure: treasurePda,
  //     associatedTokenProgram: SPL_ASSOCIATED_TOKEN_PROGRAM_ID,
  //     authorizationRulesProgram: MPL_TOKEN_AUTH_RULES_PROGRAM_ID,
  //     // TODO Find out which account to use for this param
  //     authorizationRules: MPL_DEFAULT_RULESET,
  //     assetData: expectedAssetData,
  //     tokenData: expectedTokenData,
  //   }).sendAndConfirm(umi, { send: { skipPreflight: true } });

  //   DEBUG && logInfo('Second Enchant', explorerTxLink(tx.signature));

  //   const receipt = await umi.rpc.getTransaction(tx.signature);
  //   expect(receipt?.meta.logs.some((l) => l.includes('already in use'))).eq(true);
  // });

  it('[Success] Fusion Into', async () => {
    const { umi, dataPda, token, collection, asset } = context;

    const result = await fusionIntoV1(umi, {
      user: umi.identity,
      asset: asset.asset,
      collection: collection.collection.publicKey,
      tokenMint: token.mint.publicKey,
    }).sendAndConfirm(umi, { send: { skipPreflight: true } });

    DEBUG && AppLogger.info('Fusion Into TX', explorerTxLink(result.signature));

    const dataAccount = await fetchFusionDataV1(umi, dataPda);
    DEBUG && AppLogger.info('Data Account', dataAccount);

    const assetData = await fetchAsset(umi, asset.asset.publicKey);
    DEBUG && AppLogger.info('Asset Data', assetData);

    const collectionData = await fetchCollection(umi, collection.collection.publicKey);
    DEBUG && AppLogger.info('Collection Data', collectionData);

    expect(dataAccount.assetData.nextIndex).to.equal(2n);

    // check escrow balance
    const [escrowAta] = findEscrowAtaPda(umi, token.mint.publicKey);
    const escrowData = await fetchToken(umi, escrowAta);
    expect(escrowData.amount).to.equal(TOKEN_DATA_V1.intoAmount);
  });

  it('[Success] Fusion From', async () => {
    const { umi, dataPda, token, collection, asset } = context;

    const result = await fusionFromV1(umi, {
      user: umi.identity,
      asset: asset.asset.publicKey,
      collection: collection.collection.publicKey,
      tokenMint: token.mint.publicKey,
    }).sendAndConfirm(umi, { send: { skipPreflight: true } });

    DEBUG && AppLogger.info('Fusion From TX', explorerTxLink(result.signature));

    const dataAccount = await fetchFusionDataV1(umi, dataPda);
    DEBUG && AppLogger.info('Data Account', dataAccount);

    // const assetData = await safeFetchAssetV1(umi, asset.asset.publicKey);
    DEBUG && AppLogger.info('Asset', asset.asset.publicKey);

    const collectionData = await fetchCollection(umi, collection.collection.publicKey);
    DEBUG && AppLogger.info('Collection Data', collectionData);

    expect(dataAccount.assetData.nextIndex).to.equal(2n);

    // check escrow balance
    const [escrowAta] = findEscrowAtaPda(umi, token.mint.publicKey);
    const escrowData = await fetchToken(umi, escrowAta);
    expect(escrowData.amount).to.equal(0n);
  });

  // it('[Success] Set Pause', async () => {
  //   const { umi, deployer, dataPda } = setup;

  //   umi.payer = deployer;

  //   const updateResult = await setPause(umi, {
  //     factory: dataPda,
  //     authority: deployer,
  //     paused: true,
  //   }).sendAndConfirm(umi, { send: { skipPreflight: true } });

  //   DEBUG && logInfo('Set Pause', explorerTxLink(updateResult.signature));

  //   const dataAccount = await fetchTransmuteFactory(umi, dataPda);
  //   expect(dataAccount.paused).to.eq(true);
  // });

  // it('[Error] Transmute Paused', async () => {
  //   const { umi, dataPda, authorityPda, collection, asset, token, treasurePda } = setup;

  //   umi.payer = asset.authority;

  //   const transmuteResult = await transmuteInto(umi, {
  //     factory: dataPda,
  //     authorityPda: authorityPda,
  //     user: asset.authority,
  //     assetMint: asset.mint.publicKey,
  //     assetCollectionMetadata: collection.metadata,
  //     assetMetadata: asset.metadata,
  //     assetMasterEdition: asset.masterEdition,
  //     assetToken: asset.token,
  //     assetTokenRecord: asset.tokenRecord,
  //     tokenMint: token.mint.publicKey,
  //     tokenTreasure: treasurePda,
  //     userTokenAta: token.owner_ata,
  //     associatedTokenProgram: SPL_ASSOCIATED_TOKEN_PROGRAM_ID,
  //   }).sendAndConfirm(umi, { send: { skipPreflight: true } });

  //   DEBUG && logInfo('Transmute Paused', explorerTxLink(transmuteResult.signature));

  //   const receipt = await umi.rpc.getTransaction(transmuteResult.signature);
  //   expect(
  //     receipt?.meta.logs.some((l) =>
  //       l.includes('Error Number: 6023. Error Message: Transmutations paused.')
  //     )
  //   ).eq(true);
  // });

  // it('[Success] Set Unpause', async () => {
  //   const { umi, deployer, dataPda } = setup;

  //   umi.payer = deployer;

  //   const updateResult = await setPause(umi, {
  //     factory: dataPda,
  //     authority: deployer,
  //     paused: false,
  //   }).sendAndConfirm(umi, { send: { skipPreflight: true } });

  //   DEBUG && logInfo('Set Unpause', explorerTxLink(updateResult.signature));

  //   const dataAccount = await fetchTransmuteFactory(umi, dataPda);
  //   expect(dataAccount.paused).to.eq(false);
  // });

  // it('[Success] Transmute Into', async () => {
  //   const { umi, dataPda, authorityPda, collection, asset, token, treasurePda } = setup;

  //   umi.payer = asset.authority;

  //   const transmuteResult = await transmuteInto(umi, {
  //     factory: dataPda,
  //     authorityPda: authorityPda,
  //     user: asset.authority,
  //     assetMint: asset.mint.publicKey,
  //     assetCollectionMetadata: collection.metadata,
  //     assetMetadata: asset.metadata,
  //     assetMasterEdition: asset.masterEdition,
  //     assetToken: asset.token,
  //     assetTokenRecord: asset.tokenRecord,
  //     tokenMint: token.mint.publicKey,
  //     tokenTreasure: treasurePda,
  //     userTokenAta: token.owner_ata,
  //     associatedTokenProgram: SPL_ASSOCIATED_TOKEN_PROGRAM_ID,
  //   }).sendAndConfirm(umi, { send: { skipPreflight: true } });

  //   DEBUG && logInfo('Transmute Into', explorerTxLink(transmuteResult.signature));
  //   // check factory token ata balance
  //   const treasureAccount = await fetchToken(umi, treasurePda);
  //   expect(treasureAccount.amount).to.equal(0n);
  // });

  // it('[Success] Set Authority', async () => {
  //   const { umi, deployer, delegate, dataPda } = setup;

  //   umi.payer = deployer;

  //   const updateResult = await setAuthority(umi, {
  //     factory: dataPda,
  //     authority: deployer,
  //     newAuthority: delegate.publicKey,
  //   }).sendAndConfirm(umi, { send: { skipPreflight: true } });

  //   DEBUG && logInfo('Set Authority', explorerTxLink(updateResult.signature));

  //   const dataAccount = await fetchTransmuteFactory(umi, dataPda);
  //   expect(dataAccount.authority).to.deep.equal(delegate.publicKey);
  // });

  // it('[Error] Authority Constrains - `set_authority`', async () => {
  //   const { umi, deployer, delegate, dataPda } = setup;

  //   umi.payer = deployer;

  //   // check set authority
  //   const tx = await setAuthority(umi, {
  //     factory: dataPda,
  //     authority: deployer,
  //     newAuthority: delegate.publicKey,
  //   }).sendAndConfirm(umi, { send: { skipPreflight: true } });

  //   const receipt = await umi.rpc.getTransaction(tx.signature);
  //   expect(receipt?.meta.logs.some((l) => l.includes(AUTH_ERROR_MESSAGE))).eq(true);
  // });

  // it('[Error] Authority Constrains - `set_pause`', async () => {
  //   const { umi, deployer, dataPda } = setup;

  //   umi.payer = deployer;

  //   // check set pause
  //   const tx = await setPause(umi, {
  //     factory: dataPda,
  //     authority: deployer,
  //     paused: false,
  //   }).sendAndConfirm(umi, { send: { skipPreflight: true } });

  //   const receipt = await umi.rpc.getTransaction(tx.signature);
  //   expect(receipt?.meta.logs.some((l) => l.includes(AUTH_ERROR_MESSAGE))).eq(true);
  // });

  // it('[Error] Authority Constrains - `update`', async () => {
  //   const { umi, deployer, dataPda, collection } = setup;

  //   umi.payer = deployer;

  //   const expectedAssetData: AssetData = {
  //     assetSymbol: 'SINNER',
  //     assetNextIndex: 1024n,
  //     assetNamePrefix: 'Sinnew #',
  //     assetUriPrefix: 'https://meta.sindao.org/metadata/',
  //     assetUriSuffix: '',
  //     assetSellerFeeBasisPoints: 99,
  //     assetCreators: [
  //       {
  //         address: collection.authority.publicKey,
  //         verified: true,
  //         percentageShare: 100,
  //       },
  //     ],
  //   };
  //   const expectedTokenData: TokenData = {
  //     tokenFromAmount: 20n * 10n ** TOKEN_DATA.decimals,
  //     tokenIntoAmount: 10n * 10n ** TOKEN_DATA.decimals,
  //   };

  //   const tx = await update(umi, {
  //     factory: dataPda,
  //     authority: deployer,
  //     assetData: expectedAssetData,
  //     tokenData: expectedTokenData,
  //   }).sendAndConfirm(umi, { send: { skipPreflight: true } });

  //   const receipt = await umi.rpc.getTransaction(tx.signature);
  //   expect(receipt?.meta.logs.some((l) => l.includes(AUTH_ERROR_MESSAGE))).eq(true);
  // });

  // it('[Error] Authority Constrains - `disenchant`', async () => {
  //   const { umi, deployer, dataPda, token, authorityPda, treasurePda } = setup;

  //   umi.payer = deployer;

  //   const [ata] = findAssociatedTokenPda(umi, {
  //     mint: token.mint.publicKey,
  //     owner: deployer.publicKey,
  //   });

  //   const tx = await disenchant(umi, {
  //     factory: dataPda,
  //     authorityPda: authorityPda,
  //     authority: deployer,
  //     tokenMint: token.mint.publicKey,
  //     tokenTreasure: treasurePda,
  //     authorityTokenAta: ata,
  //     associatedTokenProgram: SPL_ASSOCIATED_TOKEN_PROGRAM_ID,
  //   }).sendAndConfirm(umi, { send: { skipPreflight: true } });

  //   const receipt = await umi.rpc.getTransaction(tx.signature);
  //   expect(receipt?.meta.logs.some((l) => l.includes(AUTH_ERROR_MESSAGE))).eq(true);
  // });

  // it('[Success] Update', async () => {
  //   const { umi, collection, delegate, dataPda } = setup;

  //   umi.payer = delegate;

  //   const expectedAssetData: AssetData = {
  //     assetSymbol: 'SINNER',
  //     assetNextIndex: 1024n,
  //     assetNamePrefix: 'Sinnew #',
  //     assetUriPrefix: 'https://meta.sindao.org/metadata/',
  //     assetUriSuffix: '',
  //     assetSellerFeeBasisPoints: 99,
  //     assetCreators: [
  //       {
  //         address: collection.authority.publicKey,
  //         verified: true,
  //         percentageShare: 100,
  //       },
  //     ],
  //   };
  //   const expectedTokenData: TokenData = {
  //     tokenFromAmount: 20n * 10n ** TOKEN_DATA.decimals,
  //     tokenIntoAmount: 10n * 10n ** TOKEN_DATA.decimals,
  //   };

  //   const updateResult = await update(umi, {
  //     factory: dataPda,
  //     authority: delegate,
  //     assetData: expectedAssetData,
  //     tokenData: expectedTokenData,
  //   }).sendAndConfirm(umi);

  //   DEBUG && logInfo('Update', explorerTxLink(updateResult.signature));

  //   const dataAccount = await fetchTransmuteFactory(umi, dataPda);
  //   expect(dataAccount.assetData).to.deep.equal(expectedAssetData);
  //   expect(dataAccount.tokenData).to.deep.equal(expectedTokenData);
  // });

  // it('[Success] Disenchant', async () => {
  //   const { umi, deployer, delegate, dataPda, authorityPda, token, treasurePda } = setup;

  //   // switch back authority
  //   umi.payer = delegate;
  //   await setAuthority(umi, {
  //     factory: dataPda,
  //     authority: delegate,
  //     newAuthority: deployer.publicKey,
  //   }).sendAndConfirm(umi);

  //   umi.payer = deployer;

  //   const [ata] = findAssociatedTokenPda(umi, {
  //     mint: token.mint.publicKey,
  //     owner: deployer.publicKey,
  //   });

  //   const updateResult = await disenchant(umi, {
  //     factory: dataPda,
  //     authorityPda: authorityPda,
  //     authority: deployer,
  //     tokenMint: token.mint.publicKey,
  //     tokenTreasure: treasurePda,
  //     authorityTokenAta: ata,
  //     associatedTokenProgram: SPL_ASSOCIATED_TOKEN_PROGRAM_ID,
  //   }).sendAndConfirm(umi, { send: { skipPreflight: true } });

  //   DEBUG && logInfo('Disenchant', explorerTxLink(updateResult.signature));

  //   const dataAccount = await safeFetchTransmuteFactory(umi, dataPda);
  //   expect(dataAccount).to.eq(null);
  //   // check factory token ata balance
  //   const treasureAccount = await safeFetchToken(umi, treasurePda);
  //   expect(treasureAccount).to.equal(null);
  // });
});
