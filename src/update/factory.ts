import { explorerAddressLink, explorerTxLink } from '../utils/explorer';
import { AppLogger } from '../utils/logger';
import { ClusterType } from '../utils/cluster';
import { createUmi } from '../utils/umi';
import {
  NFT_AVAILABLE,
  NFT_COLLECTION_SETTINGS,
  NFT_NAME_PREFIX,
  PROD_NFT_STORAGE_CID,
  SPL_TOKEN_METADATA,
} from '../deploy/_config';
import {
  AssetData,
  TokenData,
  fetchTransmuteFactory,
  findFactoryDataPda,
  setPause,
  update,
} from '../../packages/client/src';

export const updateFactory = async (cluster: ClusterType = 'localnet') => {
  const { umi, deployer, factory } = await createUmi(cluster);

  AppLogger.info('Factory', explorerAddressLink(factory.publicKey, { cluster }));

  const [dataPda] = findFactoryDataPda(umi);

  const accountExists = await umi.rpc.accountExists(dataPda);

  if (!accountExists) {
    AppLogger.error('Factory not deployed.');
    return;
  }

  const assetData: AssetData = {
    assetSymbol: NFT_COLLECTION_SETTINGS.symbol,
    assetNextIndex: NFT_AVAILABLE + 1n,
    assetNamePrefix: NFT_NAME_PREFIX,
    assetUriPrefix: PROD_NFT_STORAGE_CID + '/',
    assetUriSuffix: '',
    assetSellerFeeBasisPoints: Number(NFT_COLLECTION_SETTINGS.sellerFeeBasisPoints.basisPoints),
    assetCreators: [
      {
        address: deployer.publicKey,
        verified: true,
        percentageShare: 100,
      },
    ],
  };

  const tokenData: TokenData = {
    tokenFromAmount: 666_666_666n * 10n ** SPL_TOKEN_METADATA.decimals,
    tokenIntoAmount: 600_000_000n * 10n ** SPL_TOKEN_METADATA.decimals,
  };

  const updateResult = await update(umi, {
    factory: dataPda,
    authority: deployer,
    assetData: assetData,
    tokenData: tokenData,
  }).sendAndConfirm(umi, { send: { skipPreflight: true } });

  AppLogger.info('Update Factory Tx', explorerTxLink(updateResult.signature, { cluster }));

  const dataAccount = await fetchTransmuteFactory(umi, dataPda);
  AppLogger.info('Factory Data', dataAccount);

  AppLogger.info('Done.');
};

export const setPauseFactory = async (paused: boolean, cluster: ClusterType = 'localnet') => {
  const { umi, deployer, factory } = await createUmi(cluster);

  AppLogger.info('Factory', explorerAddressLink(factory.publicKey, { cluster }));

  const [dataPda] = findFactoryDataPda(umi);

  const accountExists = await umi.rpc.accountExists(dataPda);

  if (!accountExists) {
    AppLogger.error('Factory not deployed.');
    return;
  }

  const updateResult = await setPause(umi, {
    factory: dataPda,
    authority: deployer,
    paused,
  }).sendAndConfirm(umi, { send: { skipPreflight: true } });

  AppLogger.info('SetPause Factory Tx', explorerTxLink(updateResult.signature, { cluster }));

  const dataAccount = await fetchTransmuteFactory(umi, dataPda);
  AppLogger.info('Factory Data', dataAccount);

  AppLogger.info('Done.');
};
