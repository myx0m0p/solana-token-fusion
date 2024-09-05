import { transactionBuilder, unwrapOption } from '@metaplex-foundation/umi';
import { createAssociatedToken, setComputeUnitPrice } from '@metaplex-foundation/mpl-toolbox';

import { explorerAddressLink, explorerTxLink } from '../utils/explorer';
import { AppLogger } from '../utils/logger';
import { createUmi } from '../utils/umi';

import { FusionCliOptions } from '../types';

import {
  fetchFusionDataV1,
  findEscrowAtaPda,
  findFusionDataPda,
  initV1,
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
    builder = builder.add([
      createAssociatedToken(umi, {
        owner: feeRecipient,
        mint: tokenMint || token.publicKey,
      }),
    ]);
  }

  const builderResult = await builder.sendAndConfirm(umi);
  AppLogger.info('Init Fusion Tx', explorerTxLink(builderResult.signature, { cluster }));

  AppLogger.info('Escrow', explorerAddressLink(escrowPda, { cluster }));

  const dataAccount = await fetchFusionDataV1(umi, dataPda);
  AppLogger.info('Fusion Data', dataAccount);

  AppLogger.info('Done.');
};
