import { Commitment } from '@metaplex-foundation/umi';

export type ClusterType = 'localnet' | 'devnet' | 'mainnet';

type ClusterSettings = {
  rpc: string;
  commitment: Commitment;
  airdropEnabled?: boolean;
  aidropAmount?: number;
};

const CLUSTER_RPC: Record<ClusterType, ClusterSettings> = {
  localnet: {
    rpc: process.env.SOLANA_LOCALNET_RPC || 'http://localhost:8899',
    commitment: 'confirmed',
    airdropEnabled: true,
    aidropAmount: 1, // 1 SOL
  },
  devnet: {
    rpc: process.env.SOLANA_DEVNET_RPC || 'https://api.devnet.solana.com',
    commitment: 'processed',
    airdropEnabled: false,
  },
  mainnet: {
    rpc: process.env.SOLANA_MAINNET_RPC || 'https://api.mainnet-beta.solana.com',
    commitment: 'processed',
    airdropEnabled: false,
  },
};

export const getClusterSettings = (cluster: ClusterType = 'localnet') => CLUSTER_RPC[cluster];
