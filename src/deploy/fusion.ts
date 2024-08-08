import { some, transactionBuilder } from '@metaplex-foundation/umi';
import { setComputeUnitPrice } from '@metaplex-foundation/mpl-toolbox';

import { explorerAddressLink, explorerTxLink } from '../utils/explorer';
import { AppLogger } from '../utils/logger';
import { createUmi } from '../utils/umi';

import { FusionCliOptions } from '../types';

import {
  AssetDataV1,
  fetchFusionDataV1,
  findEscrowAtaPda,
  findFusionDataPda,
  initV1,
  TokenDataV1,
} from '../../packages/client/dist/src';

//TODO Move to cli options with defaults
const ASSET_DATA_V1: AssetDataV1 = {
  maxSupply: some(100),
  nextIndex: 1n,
  namePrefix: 'STF #',
  uriPrefix: 'https://stf.org/assets/',
  uriSuffix: '.json',
};

const TOKEN_DATA_V1: TokenDataV1 = {
  intoAmount: 100n * 10n ** 9n, // mint asset
  fromAmount: 100n * 10n ** 9n, // burn asset
};

export const initFusion = async ({ cluster }: FusionCliOptions) => {
  const {
    umi,
    clusterSettings,
    collection: collectionMint,
    token: tokenMint,
    stfProgram,
  } = await createUmi(cluster);

  AppLogger.info('Token Fusion Program', explorerAddressLink(stfProgram.publicKey, { cluster }));

  const [dataPda] = findFusionDataPda(umi);
  const [escrowPda] = findEscrowAtaPda(umi, tokenMint.publicKey);

  const accountExists = await umi.rpc.accountExists(dataPda);

  if (accountExists) {
    AppLogger.error('Fusion already initialized.');
    return;
  }

  let builder = transactionBuilder();

  // add priority
  if (clusterSettings.priority) {
    builder = builder.add(setComputeUnitPrice(umi, { microLamports: clusterSettings.priority }));
  }

  builder = builder.add(
    initV1(umi, {
      tokenMint: tokenMint.publicKey,
      collection: collectionMint.publicKey,
      assetData: ASSET_DATA_V1,
      tokenData: TOKEN_DATA_V1,
    })
  );

  const builderResult = await builder.sendAndConfirm(umi);
  AppLogger.info('Init Fusion Tx', explorerTxLink(builderResult.signature, { cluster }));

  AppLogger.info('Escrow', explorerAddressLink(escrowPda, { cluster }));

  const dataAccount = await fetchFusionDataV1(umi, dataPda);
  AppLogger.info('Fusion Data', dataAccount);

  AppLogger.info('Done.');
};
