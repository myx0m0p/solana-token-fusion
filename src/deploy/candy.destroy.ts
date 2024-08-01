import {
  safeFetchCandyMachine,
  safeFetchCandyGuard,
  deleteCandyMachine,
  deleteCandyGuard,
} from '@metaplex-foundation/mpl-candy-machine';

import { createUmi } from '../utils/umi';
import { ClusterType } from '../utils/cluster';
import { explorerTxLink } from '../utils/explorer';
import { AppLogger } from '../utils/logger';

export const destroyCandy = async (cluster: ClusterType = 'localnet') => {
  const { umi, candy } = await createUmi(cluster);

  // get candy machine account
  let candyMachine = await safeFetchCandyMachine(umi, candy.publicKey);
  if (!candyMachine) {
    AppLogger.error('Candy Machine not found.');
    return;
  }

  // get candy guard account
  let candyGuard = await safeFetchCandyGuard(umi, candyMachine.mintAuthority);
  if (!candyGuard) {
    AppLogger.error('Candy Guard not found.');
    return;
  }

  const destroyCandyResult = await deleteCandyMachine(umi, {
    candyMachine: candyMachine.publicKey,
  }).sendAndConfirm(umi);

  AppLogger.info('Destroy Candy Tx', explorerTxLink(destroyCandyResult.signature, { cluster }));

  const destroyGuardResult = await deleteCandyGuard(umi, {
    candyGuard: candyMachine.mintAuthority,
  }).sendAndConfirm(umi);

  AppLogger.info(
    'Destroy Candy Guard Tx',
    explorerTxLink(destroyGuardResult.signature, { cluster })
  );

  AppLogger.info('Done.');
};
