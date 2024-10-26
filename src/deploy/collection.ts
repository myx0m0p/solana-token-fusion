import {
  createCollection,
  fetchCollection,
  // removeCollectionPlugin,
  ruleSet,
  updateCollection as updateCollectionCore,
  updateCollectionPlugin,
} from '@metaplex-foundation/mpl-core';
import { setComputeUnitPrice } from '@metaplex-foundation/mpl-toolbox';
import { publicKey, transactionBuilder } from '@metaplex-foundation/umi';

import { explorerAddressLink, explorerTxLink } from '../utils/explorer';
import { AppLogger } from '../utils/logger';
import { createUmi } from '../utils/umi';
import { BaseCliOptions, CollectionCliOptions } from '../types';

const creators = [
  { address: publicKey('GdrZqVh6tFAaB3tfAHSQKdBxb8irbYYmqLq71r5rMktE'), percentage: 50 },
  { address: publicKey('9PY3aGsgdomBNoCSXniW2sLcQ22K4HovZ4UipyFkhSkU'), percentage: 50 },
];

export const deployCollection = async ({ name, uri, royalty, cluster }: CollectionCliOptions) => {
  const { umi, collection, clusterSettings } = await createUmi(cluster);

  AppLogger.info('Collection Mint', explorerAddressLink(collection.publicKey, { cluster }));

  const accountExists = await umi.rpc.accountExists(collection.publicKey);

  if (accountExists) {
    AppLogger.error('Collection already deployed.');
    return;
  }

  let builder = transactionBuilder();

  // add priority
  if (clusterSettings.priority) {
    builder = builder.add(setComputeUnitPrice(umi, { microLamports: clusterSettings.priority }));
  }

  // create collection
  builder = builder.add(
    createCollection(umi, {
      collection,
      name,
      uri,
      plugins: [
        {
          type: 'UpdateDelegate',
          additionalDelegates: [],
        },
        {
          type: 'Royalties',
          basisPoints: royalty,
          creators,
          ruleSet: ruleSet('None'), // Compatibility rule set
        },
      ],
    })
  );

  const builderResult = await builder.sendAndConfirm(umi);

  AppLogger.info('Create Collection Tx', explorerTxLink(builderResult.signature, { cluster }));

  const collectionData = await fetchCollection(umi, collection.publicKey);
  AppLogger.info('Collection Data', collectionData);

  AppLogger.info('Done');
};

export const showCollection = async ({ cluster }: BaseCliOptions) => {
  const { umi, collection } = await createUmi(cluster);

  AppLogger.info('Collection', explorerAddressLink(collection.publicKey, { cluster }));

  const accountExists = await umi.rpc.accountExists(collection.publicKey);

  if (!accountExists) {
    AppLogger.error('Collection is not initialized.');
    return;
  }

  const data = await fetchCollection(umi, collection.publicKey);
  AppLogger.info('Collection', data);

  AppLogger.info('Done.');
};

export const updateCollection = async ({ name, uri, royalty, cluster }: CollectionCliOptions) => {
  const { umi, collection, clusterSettings } = await createUmi(cluster);

  AppLogger.info('Collection', explorerAddressLink(collection.publicKey, { cluster }));

  const accountExists = await umi.rpc.accountExists(collection.publicKey);

  if (!accountExists) {
    AppLogger.error('Collection is not initialized.');
    return;
  }

  let builder = transactionBuilder();

  // add priority
  if (clusterSettings.priority) {
    builder = builder.add(setComputeUnitPrice(umi, { microLamports: clusterSettings.priority }));
  }

  // update collection
  builder = builder.add(
    updateCollectionCore(umi, {
      collection: collection.publicKey,
      name,
      uri,
    })
  );

  // update royalties
  builder = builder.add(
    updateCollectionPlugin(umi, {
      collection: collection.publicKey,
      plugin: {
        type: 'Royalties',
        basisPoints: royalty,
        creators,
        ruleSet: ruleSet('None'),
      },
    })
  );

  // remove updateDelegate plugin
  // builder = builder.add(
  //   removeCollectionPlugin(umi, {
  //     collection: collection.publicKey,
  //     plugin: {
  //       type: 'UpdateDelegate',
  //     },
  //   })
  // );

  const builderResult = await builder.sendAndConfirm(umi);

  AppLogger.info('Create Collection Tx', explorerTxLink(builderResult.signature, { cluster }));

  const data = await fetchCollection(umi, collection.publicKey);
  AppLogger.info('Collection', data);

  AppLogger.info('Done.');
};
