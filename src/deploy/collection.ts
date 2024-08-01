import { createNft } from '@metaplex-foundation/mpl-token-metadata';

import { explorerAddressLink, explorerTxLink } from '../utils/explorer';
import { AppLogger } from '../utils/logger';
import { ClusterType } from '../utils/cluster';
import { createUmi } from '../utils/umi';
import { NFT_COLLECTION_SETTINGS } from './_config';

export const deployCollection = async (cluster: ClusterType = 'localnet') => {
  const { umi, deployer, collection } = await createUmi(cluster);

  AppLogger.info('Collection Mint', explorerAddressLink(collection.publicKey, { cluster }));

  const accountExists = await umi.rpc.accountExists(collection.publicKey);

  if (accountExists) {
    AppLogger.error('Collection already deployed.');
    return;
  }

  const collectionResult = await createNft(umi, {
    mint: collection,
    authority: deployer,
    name: NFT_COLLECTION_SETTINGS.name,
    symbol: NFT_COLLECTION_SETTINGS.symbol,
    uri: NFT_COLLECTION_SETTINGS.uri,
    sellerFeeBasisPoints: NFT_COLLECTION_SETTINGS.sellerFeeBasisPoints,
    isCollection: true,
  }).sendAndConfirm(umi);

  AppLogger.info('Create Collection Tx', explorerTxLink(collectionResult.signature, { cluster }));

  AppLogger.info('Done.');
};
