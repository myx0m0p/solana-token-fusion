import { create, fetchAssetV1, fetchCollection } from '@metaplex-foundation/mpl-core';
import { setComputeUnitPrice } from '@metaplex-foundation/mpl-toolbox';
import { generateSigner, transactionBuilder } from '@metaplex-foundation/umi';

import { explorerAddressLink, explorerTxLink } from '../utils/explorer';
import { AppLogger } from '../utils/logger';
import { ClusterType } from '../utils/cluster';
import { createUmi } from '../utils/umi';

//TODO Move this to cli params with defaults
export const ASSET_DATA = {
  name: 'STF Asset',
  uri: 'https://sft.org/asset.json',
};

export const deployAsset = async (cluster: ClusterType = 'localnet') => {
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
      name: ASSET_DATA.name,
      uri: ASSET_DATA.uri,
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
