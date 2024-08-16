import { useQuery } from '@tanstack/react-query';

import { PublicKey } from '@solana/web3.js';

import { findAssociatedTokenPda, safeFetchToken } from '@metaplex-foundation/mpl-toolbox';
import { collectionAddress, fetchAssetsByOwner } from '@metaplex-foundation/mpl-core';
import { fromWeb3JsPublicKey } from '@metaplex-foundation/umi-web3js-adapters';

import { useUmi } from '@/providers/useUmi';
import { TOKEN_ID, COLLECTION_ID } from '@/config';
import { TokenAmount } from '@/utils/tokenAmount';

export const useAccountData = (publicKey: PublicKey | null) => {
  const umi = useUmi();
  return useQuery({
    enabled: !!publicKey,
    queryKey: ['account_data', publicKey],
    queryFn: async () => {
      if (!publicKey) {
        throw new Error('Invalid publicKey');
      }
      const userPublicKey = fromWeb3JsPublicKey(publicKey);

      const [userTokenAccount] = findAssociatedTokenPda(umi, {
        mint: TOKEN_ID,
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
          return assetCollection && assetCollection === COLLECTION_ID;
        }),
      };
    },
  });
};
