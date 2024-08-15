import { PublicKey, Umi, generateSigner, transactionBuilder } from '@metaplex-foundation/umi';
import { setComputeUnitPrice } from '@metaplex-foundation/mpl-toolbox';

import { fusionIntoV1, fusionFromV1 } from '@stf/token-fusion';
import { COLLECTION_ID, TOKEN_ID, ClusterSettings } from '@/config';

// Spl Token -> Asset
export const fusionInto = (umi: Umi) => {
  const asset = generateSigner(umi);

  const { priority, commitment } = ClusterSettings;

  const tb = transactionBuilder();

  if (priority) {
    tb.add(setComputeUnitPrice(umi, { microLamports: priority }));
  }

  tb.add(
    fusionIntoV1(umi, {
      user: umi.identity,
      asset: asset,
      tokenMint: TOKEN_ID,
      collection: COLLECTION_ID,
    })
  );

  return tb.sendAndConfirm(umi, { confirm: { commitment } });
};

// Asset -> Spl Token
export const fusionFrom = (umi: Umi, asset: PublicKey) => {
  const { priority, commitment } = ClusterSettings;

  const tb = transactionBuilder();

  if (priority) {
    tb.add(setComputeUnitPrice(umi, { microLamports: priority }));
  }

  tb.add(
    fusionFromV1(umi, {
      user: umi.identity,
      asset: asset,
      tokenMint: TOKEN_ID,
      collection: COLLECTION_ID,
    })
  );

  return tb.sendAndConfirm(umi, { confirm: { commitment } });
};
