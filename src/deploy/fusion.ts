import { transactionBuilder, unwrapOption } from '@metaplex-foundation/umi';
import {
  createAssociatedToken,
  setComputeUnitPrice,
  findAssociatedTokenPda,
} from '@metaplex-foundation/mpl-toolbox';

import { explorerAddressLink, explorerTxLink } from '../utils/explorer';
import { AppLogger } from '../utils/logger';
import { createUmi } from '../utils/umi';

import {
  BaseCliOptions,
  FusionCliOptions,
  FusionDataUpdateCliOptions,
  FusionPauseCliOptions,
} from '../types';

import {
  fetchFusionDataV1,
  findEscrowAtaPda,
  findFusionDataPda,
  initV1,
  setPauseV1,
  updateV1,
} from '../../packages/client/dist/src';

export const initFusion = async ({
  cluster,
  assetData,
  feeData,
  tokenMint,
  collectionMint,
}: FusionCliOptions) => {
  const { umi, clusterSettings, stfProgram, token, collection } = await createUmi(cluster);

  AppLogger.info('Token Fusion Program', explorerAddressLink(stfProgram.publicKey, { cluster }));

  const [dataPda] = findFusionDataPda(umi);
  const [escrowPda] = findEscrowAtaPda(umi, tokenMint || token.publicKey);

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
      tokenMint: tokenMint || token.publicKey,
      collection: collectionMint || collection.publicKey,
      assetData,
      feeData,
    })
  );

  // create fee recipient ATA
  const feeRecipient = unwrapOption(feeData.feeRecipient);
  if (feeRecipient !== null) {
    const [feeRecipientAta] = findAssociatedTokenPda(umi, {
      mint: tokenMint || token.publicKey,
      owner: feeRecipient,
    });
    const accountExists = await umi.rpc.accountExists(feeRecipientAta);

    if (!accountExists) {
      builder = builder.add([
        createAssociatedToken(umi, {
          owner: feeRecipient,
          mint: tokenMint || token.publicKey,
        }),
      ]);
    }
  }

  const builderResult = await builder.sendAndConfirm(umi);
  AppLogger.info('Init Fusion Tx', explorerTxLink(builderResult.signature, { cluster }));

  AppLogger.info('Escrow', explorerAddressLink(escrowPda, { cluster }));

  const dataAccount = await fetchFusionDataV1(umi, dataPda);
  AppLogger.info('Fusion Data', dataAccount);

  AppLogger.info('Done.');
};

export const updateFusionData = async ({
  cluster,
  updateAssetData,
  updateFeeData,
}: FusionDataUpdateCliOptions) => {
  const { umi, clusterSettings, stfProgram } = await createUmi(cluster);

  AppLogger.info('Token Fusion Program', explorerAddressLink(stfProgram.publicKey, { cluster }));

  const [dataPda] = findFusionDataPda(umi);

  const accountExists = await umi.rpc.accountExists(dataPda);

  if (!accountExists) {
    AppLogger.error('Fusion is not initialized.');
    return;
  }

  let dataAccount = await fetchFusionDataV1(umi, dataPda);

  // merge asset data
  const assetDataV1 = dataAccount.assetData;
  const filteredUpdateAssetData = Object.fromEntries(
    Object.entries(updateAssetData || {}).filter(([_, v]) => v !== undefined)
  );
  const assetData = { ...assetDataV1, ...filteredUpdateAssetData };

  // merge fee data
  const feeDataV1 = dataAccount.feeData;
  const filteredUpdateFeeData = Object.fromEntries(
    Object.entries(updateFeeData || {}).filter(([_, v]) => v !== undefined)
  );
  const feeData = { ...feeDataV1, ...filteredUpdateFeeData };

  let builder = transactionBuilder();

  // add priority
  if (clusterSettings.priority) {
    builder = builder.add(setComputeUnitPrice(umi, { microLamports: clusterSettings.priority }));
  }

  builder = builder.add(
    updateV1(umi, {
      assetData,
      feeData,
    })
  );

  // create fee recipient ATA
  const feeRecipient = unwrapOption(feeData.feeRecipient);
  if (feeRecipient !== null) {
    const [feeRecipientAta] = findAssociatedTokenPda(umi, {
      mint: dataAccount.tokenMint,
      owner: feeRecipient,
    });
    const accountExists = await umi.rpc.accountExists(feeRecipientAta);

    if (!accountExists) {
      builder = builder.add([
        createAssociatedToken(umi, {
          owner: feeRecipient,
          mint: dataAccount.tokenMint,
        }),
      ]);
    }
  }

  const builderResult = await builder.sendAndConfirm(umi);
  AppLogger.info('Update Fusion Tx', explorerTxLink(builderResult.signature, { cluster }));

  dataAccount = await fetchFusionDataV1(umi, dataPda);
  AppLogger.info('Fusion Data', dataAccount);

  AppLogger.info('Done.');
};

export const setPauseFusion = async ({ cluster, pause }: FusionPauseCliOptions) => {
  const { umi, clusterSettings, stfProgram } = await createUmi(cluster);

  AppLogger.info('Token Fusion Program', explorerAddressLink(stfProgram.publicKey, { cluster }));

  const [dataPda] = findFusionDataPda(umi);

  const accountExists = await umi.rpc.accountExists(dataPda);

  if (!accountExists) {
    AppLogger.error('Fusion is not initialized.');
    return;
  }

  let builder = transactionBuilder();

  // add priority
  if (clusterSettings.priority) {
    builder = builder.add(setComputeUnitPrice(umi, { microLamports: clusterSettings.priority }));
  }

  builder = builder.add(
    setPauseV1(umi, {
      paused: pause,
    })
  );

  const builderResult = await builder.sendAndConfirm(umi);
  AppLogger.info('setPause Tx', explorerTxLink(builderResult.signature, { cluster }));

  const dataAccount = await fetchFusionDataV1(umi, dataPda);
  AppLogger.info('Fusion Data', dataAccount);

  AppLogger.info('Done.');
};

export const showFusionData = async ({ cluster }: BaseCliOptions) => {
  const { umi, stfProgram } = await createUmi(cluster);

  AppLogger.info('Token Fusion Program', explorerAddressLink(stfProgram.publicKey, { cluster }));

  const [dataPda] = findFusionDataPda(umi);

  const accountExists = await umi.rpc.accountExists(dataPda);

  if (!accountExists) {
    AppLogger.error('Fusion is not initialized.');
    return;
  }

  const dataAccount = await fetchFusionDataV1(umi, dataPda);
  AppLogger.info('Fusion Data', dataAccount);

  AppLogger.info('Done.');
};
