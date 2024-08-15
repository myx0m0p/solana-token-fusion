import { ClusterType } from '@/types';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_SOLANA_CLUSTER: ClusterType;
      NEXT_PUBLIC_SOLANA_MAINNET_RPC: string;
      NEXT_PUBLIC_TOKEN_ID: string;
      NEXT_PUBLIC_COLLECTION_ID: string;
      NEXT_PUBLIC_APP_URL: string;
      NEXT_PUBLIC_APP_METADATA_URI: string;
    }
  }
}
