import { publicKey } from '@metaplex-foundation/umi';

import { getClusterSettings } from '@/utils/cluster';
import { Explorer } from '@/utils/explorer';

export const TOKEN_ID = publicKey(process.env.NEXT_PUBLIC_TOKEN_ID);
export const COLLECTION_ID = publicKey(process.env.NEXT_PUBLIC_COLLECTION_ID);

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL;
export const APP_METADATA_URI = process.env.NEXT_PUBLIC_APP_METADATA_URI;

export const NO_BREAK_SPACE = '\u00A0';

export const ClusterSettings = getClusterSettings(process.env.NEXT_PUBLIC_SOLANA_CLUSTER);
export const ClusterExplorer = new Explorer(process.env.NEXT_PUBLIC_SOLANA_CLUSTER);
