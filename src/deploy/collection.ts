import { createCollection, fetchCollection, ruleSet } from '@metaplex-foundation/mpl-core';
import { setComputeUnitPrice } from '@metaplex-foundation/mpl-toolbox';
import { transactionBuilder } from '@metaplex-foundation/umi';

import { explorerAddressLink, explorerTxLink } from '../utils/explorer';
import { AppLogger } from '../utils/logger';
import { createUmi } from '../utils/umi';
import { CollectionCliOptions } from '../types';

export const deployCollection = async ({ name, uri, royalty, cluster }: CollectionCliOptions) => {
  const { umi, deployer, collection, clusterSettings } = await createUmi(cluster);

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
          creators: [
            {
              address: deployer.publicKey,
              percentage: 100,
            },
          ],
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
