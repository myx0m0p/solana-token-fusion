import { ClusterType } from '@/types';
import { PublicKey } from '@metaplex-foundation/umi';
import bs58 from 'bs58';

export enum LinkType {
  Address = 'address',
  Tx = 'tx',
}

export type LinkResult = {
  entity: string;
  link: string;
};

export class Explorer {
  public Uri = 'https://solana.fm';
  public cluster?: ClusterType;

  constructor(cluster?: ClusterType) {
    this.cluster = cluster;
  }

  // This is stupid hack to get around the fact that solana.fm has different names for the clusters
  // need to refactor this to be able to switch between different explorers
  private _cluster() {
    switch (this.cluster) {
      case 'custom':
        return 'localnet-solana';
      case 'devnet':
        return 'devnet-alpha';
      case 'mainnet':
      default:
        return undefined;
    }
  }

  private _link(entity: string, type: LinkType): string {
    const result = `${this.Uri}/${type}/${entity}`;
    return this._cluster() ? `${result}?cluster=${this._cluster()}` : result;
  }

  address(entity?: PublicKey | string): LinkResult {
    if (!entity) {
      return {
        entity: '',
        link: '',
      };
    }
    return {
      entity: entity.toString(),
      link: this._link(entity.toString(), LinkType.Address),
    };
  }

  tx(entity?: Uint8Array | string): LinkResult {
    if (!entity) {
      return {
        entity: '',
        link: '',
      };
    }
    const tx = typeof entity === 'string' ? entity : bs58.encode(entity);
    return {
      entity: tx,
      link: this._link(tx, LinkType.Tx),
    };
  }
}
