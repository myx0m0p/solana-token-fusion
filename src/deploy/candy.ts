import { none, transactionBuilder } from '@metaplex-foundation/umi';
import {
  create as createCandy,
  addConfigLines,
  route,
} from '@metaplex-foundation/mpl-candy-machine';

import {
  ITEMS_PER_TX,
  NFT_COLLECTION_SETTINGS,
  getCandyGuardGroups,
  getLineSettings,
} from './_config';
import { createUmi } from '../utils/umi';
import { ClusterType } from '../utils/cluster';
import { explorerAddressLink, explorerTxLink } from '../utils/explorer';
import { AppLogger } from '../utils/logger';

export const deployCandy = async (cluster: ClusterType = 'localnet') => {
  const { umi, deployer, collection, candy, treasure } = await createUmi(cluster);

  AppLogger.info('Treasure', explorerAddressLink(treasure.publicKey, { cluster }));

  // Check if collection is already deployed
  AppLogger.info('Candy', explorerAddressLink(candy.publicKey, { cluster }));

  const collectionAccountExists = await umi.rpc.accountExists(collection.publicKey);
  if (!collectionAccountExists) {
    AppLogger.error('Collection not deployed.');
    return;
  }

  // check if candy machine is already deployed
  const candyAccountExists = await umi.rpc.accountExists(candy.publicKey);

  if (candyAccountExists) {
    AppLogger.error('Candy Machine already deployed.');
    return;
  }

  // Deploy candy machine
  const candyResult = await (
    await createCandy(umi, {
      candyMachine: candy,
      collectionMint: collection.publicKey,
      collectionUpdateAuthority: deployer,
      symbol: NFT_COLLECTION_SETTINGS.symbol,
      tokenStandard: NFT_COLLECTION_SETTINGS.tokenStandard,
      sellerFeeBasisPoints: NFT_COLLECTION_SETTINGS.sellerFeeBasisPoints,
      itemsAvailable: NFT_COLLECTION_SETTINGS.itemsAvailable,
      creators: [{ address: deployer.publicKey, percentageShare: 100, verified: true }],
      configLineSettings: NFT_COLLECTION_SETTINGS.configLineSettings,
      hiddenSettings: none(),
      guards: NFT_COLLECTION_SETTINGS.guards,
      groups: getCandyGuardGroups(treasure.publicKey, cluster),
      ruleSet: NFT_COLLECTION_SETTINGS.ruleSet,
    })
  ).sendAndConfirm(umi);

  AppLogger.info('Create Candy Tx', explorerTxLink(candyResult.signature, { cluster }));

  // add config lines
  // only 66 items fits into one tx, so we must divide to batches

  const configLines = getLineSettings(Number(NFT_COLLECTION_SETTINGS.itemsAvailable), ITEMS_PER_TX);

  let lineIndex = 0;

  for (const lines of configLines) {
    await addConfigLines(umi, {
      candyMachine: candy.publicKey,
      index: lineIndex,
      configLines: lines,
    }).sendAndConfirm(umi, { confirm: { commitment: 'confirmed' } });

    // logInfo("Lines Tx", explorerTxLink(linesResult.signature));
    AppLogger.info(`Inserting items [${lineIndex}]..[${lineIndex + ITEMS_PER_TX}]`);
    lineIndex += ITEMS_PER_TX;
  }

  // enable allocation account
  const initResult = await transactionBuilder()
    .add(
      // free
      route(umi, {
        guard: 'allocation',
        candyMachine: candy.publicKey,
        group: 'FR',
        routeArgs: {
          id: 3,
          candyGuardAuthority: deployer,
        },
      })
    )
    // .add(
    //   // pre
    //   route(umi, {
    //     guard: 'allocation',
    //     candyMachine: candy.publicKey,
    //     group: 'Pre',
    //     routeArgs: {
    //       id: 3,
    //       candyGuardAuthority: deployer,
    //     },
    //   })
    // )
    .sendAndConfirm(umi);

  AppLogger.info('Init Allocations Tx', explorerTxLink(initResult.signature, { cluster }));

  AppLogger.info('Done.');
};
