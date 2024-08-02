import fs from 'fs';
import path from 'path';

import { fromWeb3JsKeypair } from '@metaplex-foundation/umi-web3js-adapters';

import { ClusterType } from './cluster';
import { FileKeypair } from './file-keypair';

export const loadKey = (filename: string, cluster: ClusterType = 'localnet'): Uint8Array => {
  return new Uint8Array(
    JSON.parse(fs.readFileSync(path.join('.keys', cluster, filename)).toString())
  );
};

export const loadOrGenerateKeypair = (filename: string, cluster: ClusterType = 'localnet') => {
  const keypair = FileKeypair.loadOrGenerate(path.join('.keys', cluster, filename)).keypair;
  return fromWeb3JsKeypair(keypair);
};
