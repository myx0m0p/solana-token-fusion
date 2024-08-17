import { useQuery } from '@tanstack/react-query';

import { PublicKey } from '@solana/web3.js';

import { findAssociatedTokenPda, safeFetchToken } from '@metaplex-foundation/mpl-toolbox';
import { collectionAddress, fetchAssetsByOwner } from '@metaplex-foundation/mpl-core';
import { fromWeb3JsPublicKey } from '@metaplex-foundation/umi-web3js-adapters';

import { useUmi } from '@/providers/useUmi';
import { TokenAmount } from '@/utils/tokenAmount';
import { FusionDataV1 } from '@stf/token-fusion';

type Options = {
  publicKey: PublicKey | null;
  data: FusionDataV1 | null;
};

export const useAccountData = ({ publicKey, data }: Options) => {
  const umi = useUmi();
  return useQuery({
    enabled: !!publicKey,
    queryKey: ['account_data', publicKey],
    queryFn: async () => {
      if (!publicKey) {
        throw new Error('Invalid publicKey');
      }
      const userPublicKey = fromWeb3JsPublicKey(publicKey);

      if (!data) {
        throw new Error('Invalid data');
      }

      const [userTokenAccount] = findAssociatedTokenPda(umi, {
        mint: data.tokenMint,
        owner: userPublicKey,
      });
      const userAccount = await umi.rpc.getAccount(userPublicKey);
      const tokenAccount = await safeFetchToken(umi, userTokenAccount);
      const assets = await fetchAssetsByOwner(umi, userPublicKey);
      const sortedAssets = assets.sort((a, b) => a.name.localeCompare(b.name));
      return {
        data: userAccount,
        balance: tokenAccount ? new TokenAmount(tokenAccount.amount) : new TokenAmount(0n),
        assets: sortedAssets.filter((asset) => {
          const assetCollection = collectionAddress(asset);
          return assetCollection && assetCollection === data.collection;
        }),
      };
    },
  });
};
