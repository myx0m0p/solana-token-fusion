import { create, fetchAssetV1, fetchCollection } from '@metaplex-foundation/mpl-core';
import { setComputeUnitPrice } from '@metaplex-foundation/mpl-toolbox';
import { generateSigner, transactionBuilder } from '@metaplex-foundation/umi';

import { explorerAddressLink, explorerTxLink } from '../utils/explorer';
import { AppLogger } from '../utils/logger';
import { createUmi } from '../utils/umi';
import { AssetCliOptions } from '../types';

export const deployAsset = async ({ name, uri, cluster }: AssetCliOptions) => {
  const { umi, collection, clusterSettings } = await createUmi(cluster);

  AppLogger.info('Collection Mint', explorerAddressLink(collection.publicKey, { cluster }));

  let builder = transactionBuilder();

  // add priority
  if (clusterSettings.priority) {
    builder = builder.add(setComputeUnitPrice(umi, { microLamports: clusterSettings.priority }));
  }

  // create asset
  const assetSigner = generateSigner(umi);
  builder = builder.add(
    create(umi, {
      asset: assetSigner,
      collection: collection,
      name,
      uri,
    })
  );

  const builderResult = await builder.sendAndConfirm(umi);

  AppLogger.info('Create Asset Tx', explorerTxLink(builderResult.signature, { cluster }));

  const assetData = await fetchAssetV1(umi, assetSigner.publicKey);
  AppLogger.info('Asset Data', assetData);
  const collectionData = await fetchCollection(umi, collection.publicKey);
  AppLogger.info('Collection Data', collectionData);

  AppLogger.info('Done');
};
