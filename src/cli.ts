import 'dotenv/config';

import { Command } from '@commander-js/extra-typings';

import { ClusterType } from './types';
import { deployCollection } from './deploy/collection';
import { deployToken } from './deploy/token';
import { deployAsset } from './deploy/asset';
import { initFusion } from './deploy/fusion';

const program = new Command();

program.name('CLI').description('Token Fusion deployment CLI').version('0.1.0');

const token = program.command('token');
token
  .command('deploy')
  .description('Deploy Spl Token')
  .option('-n, --name <string>', 'Token name', 'STF Token')
  .option('-s, --symbol <string>', 'Token symbol', 'STF')
  .option('-u, --uri <string>', 'Token URI', 'https://stf.org/token.json')
  .option('-d, --decimals <number>', 'Token decimals', parseInt, 9)
  .option('-m, --mint', 'Mint tokens', true)
  .option('-t, --supply <number>', 'Token supply', parseInt, 1000000)
  .option(
    '-c, --cluster <string>',
    'Solana cluster name to deploy: `localnet`, `devnet`, `mainnet`',
    (value) => value as ClusterType,
    'localnet'
  )
  .action(async (options) => {
    await deployToken(options);
  });

const collection = program.command('collection');
collection
  .command('deploy')
  .description('Deploy Collection')
  .option('-n, --name <string>', 'Collection name', 'STF Collection')
  .option('-u, --uri <string>', 'Collection URI', 'https://stf.org/collection.json')
  .option('-r, --royalty <number>', 'Collection royalty bp', parseInt, 500)
  .option(
    '-c, --cluster <string>',
    'Solana cluster name to deploy: `localnet`, `devnet`, `mainnet`',
    (value) => value as ClusterType,
    'localnet'
  )
  .action(async (options) => {
    await deployCollection(options);
  });

const asset = program.command('asset');
asset
  .command('deploy')
  .description('Deploy Asset')
  .option('-n, --name <string>', 'Asset name', 'STF Asset')
  .option('-u, --uri <string>', 'Asset URI', 'https://stf.org/asset.json')
  .option(
    '-c, --cluster <string>',
    'Solana cluster name to deploy: `localnet`, `devnet`, `mainnet`',
    (value) => value as ClusterType,
    'localnet'
  )
  .action(async (options) => {
    await deployAsset(options);
  });

const fusion = program.command('fusion');
fusion
  .command('init')
  .description('Init Token Fusion Program')
  .option(
    '-c, --cluster <string>',
    'Solana cluster name to deploy: `localnet`, `devnet`, `mainnet`',
    (value) => value as ClusterType,
    'localnet'
  )
  .action(async (options) => {
    await initFusion(options);
  });

program
  .command('deploy')
  .description('Deploy Spl Token, Collection and Enchant Factory')
  .option('-t, --token', 'Deploy Token', true)
  .option('-l, --collection', 'Deploy Collection', true)
  .option('-a, --asset', 'Deploy Asset', false)
  .option('-f, --fusion', 'Init Token Fusion', true)
  .option(
    '-c, --cluster <string>',
    'Solana cluster name to deploy: `localnet`, `devnet`, `mainnet`',
    (value) => value as ClusterType,
    'localnet'
  )
  .action(async (options) => {
    if (options.token) {
      await deployToken({
        cluster: options.cluster,
        name: 'STF Token',
        symbol: 'STF',
        uri: 'https://stf.org/token.json',
        decimals: 9,
        mint: true,
        supply: 1000000,
      });
    }
    if (options.collection) {
      await deployCollection({
        cluster: options.cluster,
        name: 'STF Collection',
        uri: 'https://stf.org/collection.json',
        royalty: 500,
      });
    }
    if (options.asset) {
      await deployAsset({
        cluster: options.cluster,
        name: 'STF Asset',
        uri: 'https://stf.org/asset.json',
      });
    }
    if (options.fusion) {
      await initFusion({
        cluster: options.cluster,
      });
    }
  });

program.parse();
