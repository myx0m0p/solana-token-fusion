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
  public Uri = 'https://explorer.solana.com';
  public cluster?: ClusterType;

  constructor(cluster?: ClusterType) {
    this.cluster = cluster;
  }

  private _link(entity: string, type: LinkType): string {
    const result = `${this.Uri}/${type}/${entity}`;
    return this.cluster ? `${result}?cluster=${this.cluster}` : result;
  }

  address(entity: PublicKey | string): LinkResult {
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
