import {
  safeFetchCandyMachine,
  safeFetchCandyGuard,
  updateCandyGuard,
} from '@metaplex-foundation/mpl-candy-machine';

import { NFT_COLLECTION_SETTINGS, getCandyGuardGroups } from './_config';
import { createUmi } from '../utils/umi';
import { ClusterType } from '../utils/cluster';
import { explorerTxLink } from '../utils/explorer';
import { AppLogger } from '../utils/logger';

export const updateCandy = async (cluster: ClusterType = 'localnet') => {
  const { umi, candy, treasure } = await createUmi(cluster);

  // get candy machine account
  let candyMachine = await safeFetchCandyMachine(umi, candy.publicKey);
  if (!candyMachine) {
    AppLogger.error('Candy Machine not found.');
    return;
  }
  // AppLogger.info('Candy Machine Before', candyMachine);

  // get candy guard account
  let candyGuard = await safeFetchCandyGuard(umi, candyMachine.mintAuthority);
  if (!candyGuard) {
    AppLogger.error('Candy Guard not found.');
    return;
  }
  AppLogger.info('Candy Guard Before', candyGuard);

  // update candy guard
  const candyResult = await updateCandyGuard(umi, {
    candyGuard: candyGuard.publicKey,
    guards: NFT_COLLECTION_SETTINGS.guards,
    groups: getCandyGuardGroups(treasure.publicKey, cluster),
  }).sendAndConfirm(umi);

  AppLogger.info('Update Candy Guard Tx', explorerTxLink(candyResult.signature, { cluster }));

  candyGuard = await safeFetchCandyGuard(umi, candyMachine.mintAuthority);
  if (!candyGuard) {
    AppLogger.error('Candy Guard not found.');
    return;
  }
  AppLogger.info('Candy Guard After', candyGuard);

  AppLogger.info('Done.');
};
