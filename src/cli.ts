import 'dotenv/config';

import { Command } from '@commander-js/extra-typings';

import { ClusterType } from './utils/cluster';
import { deployCollection } from './deploy/collection';
import { deployCandy } from './deploy/candy';
import { deployToken } from './deploy/token';
import { enchantFactory } from './deploy/factory';
import { updateCandy } from './deploy/candy.update';
import { destroyCandy } from './deploy/candy.destroy';

const program = new Command();

program.name('CLI').description('Token Fusion deployment CLI').version('0.1.0');

program
  .command('token')
  .description('Deploy Spl Token')
  .option(
    '-c, --cluster <string>',
    'Solana cluster name to deploy: `localnet`, `devnet`, `mainnet`',
    'localnet'
  )
  .action(async (options) => {
    await deployToken(options.cluster as ClusterType);
  });

program
  .command('collection')
  .description('Deploy Collection')
  .option(
    '-c, --cluster <string>',
    'Solana cluster name to deploy: `localnet`, `devnet`, `mainnet`',
    'localnet'
  )
  .action(async (options) => {
    await deployCollection(options.cluster as ClusterType);
  });

program
  .command('factory')
  .description('Enchant Transmute Factory Program')
  .option(
    '-c, --cluster <string>',
    'Solana cluster name to deploy: `localnet`, `devnet`, `mainnet`',
    'localnet'
  )
  .action(async (options) => {
    await enchantFactory(options.cluster as ClusterType);
  });

program
  .command('deploy')
  .description('Deploy Spl Token, Collection and Enchant Factory')
  .option('-t, --token')
  .option(
    '-c, --cluster <string>',
    'Solana cluster name to deploy: `localnet`, `devnet`, `mainnet`',
    'localnet'
  )
  .action(async (options) => {
    await deployToken(options.cluster as ClusterType);
    await deployCollection(options.cluster as ClusterType);
    // await deployCandy(options.cluster as ClusterType);
    await enchantFactory(options.cluster as ClusterType);
  });

program.parse();
