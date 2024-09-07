import { PublicKey } from '@metaplex-foundation/umi';
import { AssetDataV1, FeeDataV1 } from '../packages/client/dist/src';

export type ClusterType = 'localnet' | 'devnet' | 'mainnet';

export type BaseCliOptions = {
  cluster: ClusterType;
};

export type TokenCliOptions = BaseCliOptions & {
  name: string;
  symbol: string;
  uri: string;
  decimals: number;
  mint: boolean;
  supply: number;
};

export type CollectionCliOptions = BaseCliOptions & {
  name: string;
  uri: string;
  royalty: number;
};

export type AssetCliOptions = BaseCliOptions & {
  name: string;
  uri: string;
};

export type FusionCliOptions = BaseCliOptions & {
  assetData: AssetDataV1;
  feeData: FeeDataV1;
  tokenMint?: PublicKey;
  collectionMint?: PublicKey;
};

export type FusionDataUpdateCliOptions = BaseCliOptions & {
  updateAssetData: Partial<AssetDataV1>;
  updateFeeData: Partial<FeeDataV1>;
};

export type FusionPauseCliOptions = BaseCliOptions & {
  pause: boolean;
};
