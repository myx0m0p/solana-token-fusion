import { expect } from 'chai';
import { generateSigner, some } from '@metaplex-foundation/umi';

import { fetchToken, safeFetchToken } from '@metaplex-foundation/mpl-toolbox';
import { fetchAsset, fetchCollection } from '@metaplex-foundation/mpl-core';

import { explorerTxLink } from '../src/utils/explorer';
import { AppLogger } from '../src/utils/logger';

import { createUmi } from '../src/utils/umi';

import {
  AssetDataV1,
  destroyV1,
  fetchFusionDataV1,
  findEscrowAtaPda,
  findFusionDataPda,
  fusionFromV1,
  fusionIntoV1,
  initV1,
  safeFetchFusionDataV1,
  setAuthorityV1,
  setPauseV1,
  TokenDataV1,
  updateV1,
} from '../packages/client';

import { generateAsset, createCollection, createToken } from './_setup';

const AUTH_ERROR_MESSAGE = 'Error Number: 2001. Error Message: A has one constraint was violated.';

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

const ASSET_DATA_V2: AssetDataV1 = {
  maxSupply: some(1),
  nextIndex: 11n,
  namePrefix: 'STF #',
  uriPrefix: 'https://stf.org/assets/',
  uriSuffix: '.json',
};

const TOKEN_DATA_V2: TokenDataV1 = {
  intoAmount: 100n * 10n ** 9n, // mint asset
  fromAmount: 50n * 10n ** 9n, // burn asset
};

describe('Solana Token Fusion Protocol', () => {
  let context: TestContext;

  before(async () => {
    context = await setupContext();
  });

  it('[Success] InitV1', async () => {
    const { umi, dataPda, token, collection } = context;

    // umi.identity = deployer

    const res = await initV1(umi, {
      tokenMint: token.mint.publicKey,
      collection: collection.collection.publicKey,
      assetData: ASSET_DATA_V1,
      tokenData: TOKEN_DATA_V1,
    }).sendAndConfirm(umi, { send: { skipPreflight: true } });

    DEBUG && AppLogger.info('Init TX', explorerTxLink(res.signature));

    const dataAccount = await fetchFusionDataV1(umi, dataPda);

    DEBUG && AppLogger.info('Data Account', dataAccount);

    expect(dataAccount.assetData).to.deep.equal(ASSET_DATA_V1);
    expect(dataAccount.tokenData).to.deep.equal(TOKEN_DATA_V1);
  });

  it('[Error] InitV1 - Double init', async () => {
    const { umi, token, collection } = context;

    // umi.identity = deployer

    const res = await initV1(umi, {
      tokenMint: token.mint.publicKey,
      collection: collection.collection.publicKey,
      assetData: ASSET_DATA_V1,
      tokenData: TOKEN_DATA_V1,
    }).sendAndConfirm(umi, { send: { skipPreflight: true } });

    DEBUG && AppLogger.info('Second Init TX', explorerTxLink(res.signature));

    const receipt = await umi.rpc.getTransaction(res.signature);
    expect(receipt?.meta.logs.some((l) => l.includes('already in use'))).eq(true);
  });

  it('[Success] FusionIntoV1', async () => {
    const { umi, dataPda, token, collection, asset } = context;

    const res = await fusionIntoV1(umi, {
      user: umi.identity,
      asset: asset.asset,
      collection: collection.collection.publicKey,
      tokenMint: token.mint.publicKey,
    }).sendAndConfirm(umi, { send: { skipPreflight: true } });

    DEBUG && AppLogger.info('Fusion Into TX', explorerTxLink(res.signature));

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

  it('[Success] SetPauseV1 - true', async () => {
    const { umi, deployer, dataPda } = context;

    // umi.identity = deployer

    const res = await setPauseV1(umi, {
      authority: deployer,
      paused: true,
    }).sendAndConfirm(umi, { send: { skipPreflight: true } });

    DEBUG && AppLogger.info('Set Pause TX', explorerTxLink(res.signature));

    const dataAccount = await fetchFusionDataV1(umi, dataPda);
    expect(dataAccount.paused).to.eq(true);
  });

  it('[Error] FusionFromV1 - Fusion Paused', async () => {
    const { umi, token, collection, asset } = context;

    const res = await fusionFromV1(umi, {
      user: umi.identity,
      asset: asset.asset.publicKey,
      collection: collection.collection.publicKey,
      tokenMint: token.mint.publicKey,
    }).sendAndConfirm(umi, { send: { skipPreflight: true } });

    DEBUG && AppLogger.info('Fusion Paused TX', explorerTxLink(res.signature));

    const receipt = await umi.rpc.getTransaction(res.signature);
    expect(
      receipt?.meta.logs.some((l) => l.includes('Error Number: 6023. Error Message: Fusion paused.'))
    ).eq(true);
  });

  it('[Success] SetPauseV1 - false', async () => {
    const { umi, deployer, dataPda } = context;

    // umi.identity = deployer

    const res = await setPauseV1(umi, {
      fusionData: dataPda,
      authority: deployer,
      paused: false,
    }).sendAndConfirm(umi, { send: { skipPreflight: true } });

    DEBUG && AppLogger.info('Set Unpause TX', explorerTxLink(res.signature));

    const dataAccount = await fetchFusionDataV1(umi, dataPda);
    expect(dataAccount.paused).to.eq(false);
  });

  it('[Success] FusionFromV1', async () => {
    const { umi, dataPda, token, collection, asset } = context;

    const res = await fusionFromV1(umi, {
      user: umi.identity,
      asset: asset.asset.publicKey,
      collection: collection.collection.publicKey,
      tokenMint: token.mint.publicKey,
    }).sendAndConfirm(umi, { send: { skipPreflight: true } });

    DEBUG && AppLogger.info('Fusion From TX', explorerTxLink(res.signature));

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

  it('[Success] SetAuthorityV1', async () => {
    const { umi, deployer, user, dataPda } = context;

    // umi.identity = deployer

    const res = await setAuthorityV1(umi, {
      authority: deployer,
      newAuthority: user.publicKey,
    }).sendAndConfirm(umi, { send: { skipPreflight: true } });

    DEBUG && AppLogger.info('Set Authority TX', explorerTxLink(res.signature));

    const dataAccount = await fetchFusionDataV1(umi, dataPda);
    expect(dataAccount.authority).to.deep.equal(user.publicKey);
  });

  it('[Error] SetAuthorityV1 - authority constrains', async () => {
    const { umi, deployer, user } = context;

    // umi.identity = deployer

    const res = await setAuthorityV1(umi, {
      authority: deployer,
      newAuthority: user.publicKey,
    }).sendAndConfirm(umi, { send: { skipPreflight: true } });

    const receipt = await umi.rpc.getTransaction(res.signature);
    expect(receipt?.meta.logs.some((l) => l.includes(AUTH_ERROR_MESSAGE))).eq(true);
  });

  it('[Error] SetPauseV1 - authority constrains', async () => {
    const { umi, deployer } = context;

    // umi.identity = deployer

    const res = await setPauseV1(umi, {
      authority: deployer,
      paused: false,
    }).sendAndConfirm(umi, { send: { skipPreflight: true } });

    const receipt = await umi.rpc.getTransaction(res.signature);
    expect(receipt?.meta.logs.some((l) => l.includes(AUTH_ERROR_MESSAGE))).eq(true);
  });

  it('[Error] UpdateV1 - authority constrains', async () => {
    const { umi, deployer } = context;

    // umi.identity = deployer

    const res = await updateV1(umi, {
      authority: deployer,
      assetData: ASSET_DATA_V1,
      tokenData: TOKEN_DATA_V1,
    }).sendAndConfirm(umi, { send: { skipPreflight: true } });

    const receipt = await umi.rpc.getTransaction(res.signature);
    expect(receipt?.meta.logs.some((l) => l.includes(AUTH_ERROR_MESSAGE))).eq(true);
  });

  it('[Error] DestroyV1 - authority constrains', async () => {
    const { umi, deployer, token, collection } = context;

    // umi.identity = deployer

    const res = await destroyV1(umi, {
      authority: deployer,
      tokenMint: token.mint.publicKey,
      collection: collection.collection.publicKey,
    }).sendAndConfirm(umi, { send: { skipPreflight: true } });

    const receipt = await umi.rpc.getTransaction(res.signature);
    expect(receipt?.meta.logs.some((l) => l.includes(AUTH_ERROR_MESSAGE))).eq(true);
  });

  it('[Success] UpdateV1', async () => {
    const { umi, dataPda, user } = context;

    umi.identity = user;

    const res = await updateV1(umi, {
      assetData: ASSET_DATA_V2,
      tokenData: TOKEN_DATA_V2,
    }).sendAndConfirm(umi, { send: { skipPreflight: true } });

    DEBUG && AppLogger.info('Update TX', explorerTxLink(res.signature));

    const dataAccount = await fetchFusionDataV1(umi, dataPda);
    expect(dataAccount.assetData).to.deep.equal(ASSET_DATA_V2);
    expect(dataAccount.tokenData).to.deep.equal(TOKEN_DATA_V2);
  });

  it('[Success] FusionIntoV1 - minted asset data updated', async () => {
    const { umi, dataPda, deployer, token, collection } = context;

    const asset = generateSigner(umi);

    const res = await fusionIntoV1(umi, {
      user: deployer,
      asset: asset,
      collection: collection.collection.publicKey,
      tokenMint: token.mint.publicKey,
    }).sendAndConfirm(umi, { send: { skipPreflight: true } });

    DEBUG && AppLogger.info('Fusion Into TX#1', explorerTxLink(res.signature));

    const dataAccount = await fetchFusionDataV1(umi, dataPda);
    DEBUG && AppLogger.info('Data Account', dataAccount);

    const assetData = await fetchAsset(umi, asset.publicKey);
    DEBUG && AppLogger.info('Asset Data', assetData);

    const collectionData = await fetchCollection(umi, collection.collection.publicKey);
    DEBUG && AppLogger.info('Collection Data', collectionData);

    expect(assetData.name).to.equal('STF #11');

    // check escrow balance
    const [escrowAta] = findEscrowAtaPda(umi, token.mint.publicKey);
    const escrowData = await fetchToken(umi, escrowAta);
    expect(escrowData.amount).to.equal(TOKEN_DATA_V2.fromAmount);
  });

  it('[Error] FusionIntoV1 - asset limit constrains', async () => {
    const { umi, deployer, token, collection } = context;

    const asset = generateSigner(umi);

    const res = await fusionIntoV1(umi, {
      user: deployer,
      asset: asset,
      collection: collection.collection.publicKey,
      tokenMint: token.mint.publicKey,
    }).sendAndConfirm(umi, { send: { skipPreflight: true } });

    DEBUG && AppLogger.info('Fusion Into TX#2', explorerTxLink(res.signature));

    const receipt = await umi.rpc.getTransaction(res.signature);
    expect(
      receipt?.meta.logs.some((l) => l.includes('Error Number: 6025. Error Message: Max supply reached.'))
    ).eq(true);
  });

  it('[Success] DestroyV1', async () => {
    const { umi, dataPda, user, token, collection } = context;

    umi.identity = user;

    const res = await destroyV1(umi, {
      tokenMint: token.mint.publicKey,
      collection: collection.collection.publicKey,
    }).sendAndConfirm(umi, { send: { skipPreflight: true } });

    DEBUG && AppLogger.info('Destroy TX', explorerTxLink(res.signature));

    const dataAccount = await safeFetchFusionDataV1(umi, dataPda);
    expect(dataAccount).to.eq(null);

    // check escrow account
    const [escrowAta] = findEscrowAtaPda(umi, token.mint.publicKey);
    const escrowData = await safeFetchToken(umi, escrowAta);
    expect(escrowData).to.equal(null);
  });
});
