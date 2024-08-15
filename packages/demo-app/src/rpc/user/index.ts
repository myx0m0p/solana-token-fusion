import { useQuery } from '@tanstack/react-query';

import { PublicKey } from '@solana/web3.js';
import { fromWeb3JsPublicKey } from '@metaplex-foundation/umi-web3js-adapters';

import { useUmi } from '@/providers/useUmi';
import { findAssociatedTokenPda, safeFetchToken } from '@metaplex-foundation/mpl-toolbox';
import { TOKEN_ID, COLLECTION_ID } from '@/config';
import { TokenAmount } from '@/utils/tokenAmount';
import { fetchAllDigitalAssetByOwner } from '@metaplex-foundation/mpl-token-metadata';
import { unwrapOption } from '@metaplex-foundation/umi';

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
      const assets = await fetchAllDigitalAssetByOwner(umi, userPublicKey);
      const sortedAssets = assets.sort((a, b) => a.metadata.name.localeCompare(b.metadata.name));
      return {
        data: userAccount,
        balance: tokenAccount ? new TokenAmount(tokenAccount.amount) : new TokenAmount(0n),
        assets: sortedAssets.filter((asset) => {
          const assetCollection = unwrapOption(asset.metadata.collection);
          return assetCollection && assetCollection.key === COLLECTION_ID;
        }),
      };
    },
  });
};
