import { MaybeRpcAccount } from '@metaplex-foundation/umi';
import { TokenAmount } from '@solana/web3.js';

export type ClusterType = 'custom' | 'devnet' | 'mainnet';

export type AccountData = {
  data: MaybeRpcAccount;
  balance: TokenAmount;
};

export type Op = 'burn' | 'mint';
