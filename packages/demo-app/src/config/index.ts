import { getClusterSettings } from '@/utils/cluster';
import { Explorer } from '@/utils/explorer';

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL;
export const APP_METADATA_URI = process.env.NEXT_PUBLIC_APP_METADATA_URI;

export const ClusterSettings = getClusterSettings(process.env.NEXT_PUBLIC_SOLANA_CLUSTER);
export const ClusterExplorer = new Explorer(process.env.NEXT_PUBLIC_SOLANA_CLUSTER);
