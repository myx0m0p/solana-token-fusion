import fs from 'fs';
import path from 'path';
import { ClusterType } from './cluster';

export const loadKey = (filename: string, cluster: ClusterType = 'localnet'): Uint8Array => {
  return new Uint8Array(
    JSON.parse(fs.readFileSync(path.join('.keys', cluster, filename)).toString())
  );
};
