import { ClusterType } from '@/types';
import { Commitment } from '@metaplex-foundation/umi';

type ClusterSettings = {
  rpc: string;
  commitment: Commitment;
  priority: number;
};

const CLUSTER_RPC: Record<ClusterType, ClusterSettings> = {
  custom: {
    rpc: 'http://localhost:8899',
    commitment: 'confirmed',
    priority: 10_000,
  },
  devnet: {
    rpc: 'https://api.devnet.solana.com',
    commitment: 'processed',
    priority: 10_000,
  },
  mainnet: {
    rpc: process.env.NEXT_PUBLIC_SOLANA_MAINNET_RPC || 'https://api.mainnet-beta.solana.com',
    commitment: 'processed',
    priority: 10_000,
  },
};

export const getClusterSettings = (cluster: ClusterType = 'custom') => CLUSTER_RPC[cluster];
