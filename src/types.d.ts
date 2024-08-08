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

export type FusionCliOptions = BaseCliOptions;
