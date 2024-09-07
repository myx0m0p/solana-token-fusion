import 'dotenv/config';

import { Command } from '@commander-js/extra-typings';
import { none, publicKey, some } from '@metaplex-foundation/umi';

import { AssetDataV1, FeeDataV1 } from '../packages/client/dist/src';

import { ClusterType } from './types';
import { deployCollection } from './deploy/collection';
import { deployToken } from './deploy/token';
import { deployAsset } from './deploy/asset';
import { initFusion, setPauseFusion, showFusionData, updateFusionData } from './deploy/fusion';

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
  // token
  .option('--mint <string>', 'Token mint')
  .option('--decimals <number>', 'Token decimals', parseInt, 9)
  // collection
  .option('--collection <string>', 'Collection mint')
  // asset
  .option('--supply <number>', 'Asset supply', parseInt, 100)
  .option('--index <number>', 'Next index', parseInt, 1)
  .option('--prefix <string>', 'Asset prefix', 'STF #')
  .option('--uri-prefix <string>', 'Asset uri prefix', 'https://meta.femininebrother.org/metadata/')
  .option('--uri-suffix <string>', 'Asset uri suffix', '')
  // fee
  .option('--escrow <number>', 'Escrow amount', parseInt, 100)
  .option('--fee <number>', 'Fee amount', parseInt, 0)
  .option('--burn <number>', 'Burn amount', parseInt, 0)
  .option('--sol <number>', 'Sol fee amount', parseInt, 0)
  .option('--fee-recipient <string>', 'Fee recipient')

  .option(
    '-c, --cluster <string>',
    'Solana cluster name to deploy: `localnet`, `devnet`, `mainnet`',
    (value) => value as ClusterType,
    'localnet'
  )
  .action(async (options) => {
    const assetData: AssetDataV1 = {
      maxSupply: some(options.supply),
      nextIndex: BigInt(options.index),
      namePrefix: options.prefix,
      uriPrefix: options.uriPrefix,
      uriSuffix: options.uriSuffix,
    };

    const feeData: FeeDataV1 = {
      escrowAmount: BigInt(options.escrow) * 10n ** BigInt(options.decimals), // escrow
      feeAmount: BigInt(options.fee) * 10n ** BigInt(options.decimals), // fee
      burnAmount: BigInt(options.burn) * 10n ** BigInt(options.decimals), // burn
      solFeeAmount: BigInt(options.sol) * 10n ** 9n, // sol fee
      feeRecipient: options.feeRecipient ? some(publicKey(options.feeRecipient)) : none(), // fee recipient
    };

    await initFusion({
      cluster: options.cluster,
      assetData,
      feeData,
      tokenMint: options.mint ? publicKey(options.mint) : undefined,
      collectionMint: options.collection ? publicKey(options.collection) : undefined,
    });
  });

fusion
  .command('update')
  .description('Update Token Fusion Program')
  // token
  .option('--decimals <number>', 'Token decimals', parseInt, 9)
  // asset
  .option('--supply <number>', 'Asset supply', parseInt)
  .option('--index <number>', 'Next index', parseInt)
  .option('--prefix <string>', 'Asset prefix')
  .option('--uri-prefix <string>', 'Asset uri prefix')
  .option('--uri-suffix <string>', 'Asset uri suffix')
  // fee
  .option('--escrow <number>', 'Escrow amount', parseInt)
  .option('--fee <number>', 'Fee amount', parseInt)
  .option('--burn <number>', 'Burn amount', parseInt)
  .option('--sol <number>', 'Sol fee amount', parseInt)
  .option('--fee-recipient <string>', 'Fee recipient')

  .option(
    '-c, --cluster <string>',
    'Solana cluster name to deploy: `localnet`, `devnet`, `mainnet`',
    (value) => value as ClusterType,
    'localnet'
  )
  .action(async (options) => {
    const assetData: Partial<AssetDataV1> = {
      maxSupply: options.supply ? some(options.supply) : undefined,
      nextIndex: options.index ? BigInt(options.index) : undefined,
      namePrefix: options.prefix,
      uriPrefix: options.uriPrefix,
      uriSuffix: options.uriSuffix,
    };

    const feeData: Partial<FeeDataV1> = {
      escrowAmount: options.escrow ? BigInt(options.escrow) * 10n ** BigInt(options.decimals) : undefined, // escrow
      feeAmount: options.fee ? BigInt(options.fee) * 10n ** BigInt(options.decimals) : undefined, // fee
      burnAmount: options.burn ? BigInt(options.burn) * 10n ** BigInt(options.decimals) : undefined, // burn
      solFeeAmount: options.sol ? BigInt(options.sol) * 10n ** 9n : undefined, // sol fee
      feeRecipient: options.feeRecipient ? some(publicKey(options.feeRecipient)) : undefined, // fee recipient
    };

    await updateFusionData({
      cluster: options.cluster,
      updateAssetData: assetData,
      updateFeeData: feeData,
    });
  });

fusion
  .command('pause')
  .description('Pause/Unpause Token Fusion Program')
  .option('--pause <boolean>', 'Status', (value) => value === 'true', false)
  .option(
    '-c, --cluster <string>',
    'Solana cluster name to deploy: `localnet`, `devnet`, `mainnet`',
    (value) => value as ClusterType,
    'localnet'
  )
  .action(async (options) => {
    await setPauseFusion({
      cluster: options.cluster,
      pause: options.pause,
    });
  });

fusion
  .command('show')
  .description('Show Fusion Data')
  .option(
    '-c, --cluster <string>',
    'Solana cluster name to deploy: `localnet`, `devnet`, `mainnet`',
    (value) => value as ClusterType,
    'localnet'
  )
  .action(async (options) => {
    await showFusionData({
      cluster: options.cluster,
    });
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
        assetData: {
          maxSupply: some(100),
          nextIndex: 1n,
          namePrefix: 'STF #',
          uriPrefix: 'https://meta.femininebrother.org/metadata/',
          uriSuffix: '',
        },
        feeData: {
          escrowAmount: 100n * 10n ** 9n, // escrow
          feeAmount: 20n * 10n ** 9n, // fee
          burnAmount: 30n * 10n ** 9n, // burn
          solFeeAmount: 1337n * 10n ** 4n, // 0.01337 sol fee
          feeRecipient: some(publicKey('CRumnxQ9i84X7pbmgCdSSMW6WJ7njUad3LgK3kFo11zG')),
        },
      });
    }
  });

program.parse();
