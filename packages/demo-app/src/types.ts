import { MaybeRpcAccount } from '@metaplex-foundation/umi';
import { TokenAmount } from '@solana/web3.js';

export type ClusterType = 'custom' | 'devnet' | 'mainnet';

export type AccountData = {
  data: MaybeRpcAccount;
  balance: TokenAmount;
};

export type Op = 'burn' | 'mint';

export type AssetMetadata = {
  name: string;
  description: string;
  external_url: string;
  image: string;
  attributes: { trait_type: string; value: string }[];
  properties: {
    files: { uri: string; type: string }[];
  };
};
