import { PublicKey } from '@metaplex-foundation/umi';
import * as bs58 from 'bs58';
import { ClusterType } from './cluster';

export enum Explorer {
  Solana = 'https://explorer.solana.com',
}
export enum ExplorerLinkType {
  Address = 'address',
  Tx = 'tx',
}

export type ExplorerLink = {
  type: ExplorerLinkType;
  explorer?: Explorer;
  cluster?: ClusterType;
};

export type ExplorerLinkResult = {
  entity: string;
  link: string;
};

const explorerLink = (entity: string, options: ExplorerLink): string => {
  const { type, explorer = Explorer.Solana, cluster = 'localnet' } = options;

  const result = `${explorer}/${type}/${entity}`;

  return cluster ? `${result}?cluster=${cluster === 'localnet' ? 'custom' : cluster}` : result;
};

export const explorerAddressLink = (
  entity: PublicKey | string,
  options?: Partial<ExplorerLink>
): ExplorerLinkResult => {
  const link = explorerLink(entity.toString(), {
    ...options,
    type: ExplorerLinkType.Address,
  });
  return {
    entity: entity.toString(),
    link,
  };
};

export const explorerTxLink = (
  entity: Uint8Array | string,
  options?: Partial<ExplorerLink>
): ExplorerLinkResult => {
  const tx = typeof entity === 'string' ? entity : bs58.encode(entity);
  const link = explorerLink(tx, {
    ...options,
    type: ExplorerLinkType.Tx,
  });
  return {
    entity: tx,
    link,
  };
};
