import { publicKey, some, transactionBuilder, unwrapOption } from '@metaplex-foundation/umi';
import { createAssociatedToken, setComputeUnitPrice } from '@metaplex-foundation/mpl-toolbox';

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
  FeeDataV1,
} from '../../packages/client/dist/src';

//TODO Move to cli options with defaults
const ASSET_DATA_V1: AssetDataV1 = {
  maxSupply: some(100),
  nextIndex: 1n,
  namePrefix: 'STF #',
  uriPrefix: 'https://meta.femininebrother.org/metadata/',
  uriSuffix: '',
};

const FEE_DATA_V1: FeeDataV1 = {
  escrowAmount: 100n * 10n ** 9n, // escrow
  feeAmount: 20n * 10n ** 9n, // fee
  burnAmount: 30n * 10n ** 9n, // burn
  solFeeAmount: 1337n * 10n ** 4n, // 0.01337 sol fee
  feeRecipient: some(publicKey('CRumnxQ9i84X7pbmgCdSSMW6WJ7njUad3LgK3kFo11zG')),
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
      feeData: FEE_DATA_V1,
    })
  );

  // create fee recipient ATA
  const feeRecipient = unwrapOption(FEE_DATA_V1.feeRecipient);
  if (feeRecipient !== null) {
    builder = builder.add([
      createAssociatedToken(umi, {
        owner: feeRecipient,
        mint: tokenMint.publicKey,
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
