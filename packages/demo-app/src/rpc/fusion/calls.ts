import { PublicKey, Umi, generateSigner, transactionBuilder, unwrapOption } from '@metaplex-foundation/umi';
import { findAssociatedTokenPda, setComputeUnitPrice } from '@metaplex-foundation/mpl-toolbox';

import { fusionIntoV1, fusionFromV1, FusionDataV1 } from '@stf/token-fusion';
import { ClusterSettings } from '@/config';

type IntoOpt = {
  data: FusionDataV1;
};

type FromOpt = IntoOpt & {
  asset: PublicKey;
};

// Spl Token -> Asset
export const fusionInto = (umi: Umi, { data }: IntoOpt) => {
  const asset = generateSigner(umi);

  const { priority, commitment } = ClusterSettings;

  let tb = transactionBuilder();

  if (priority) {
    tb = tb.add(setComputeUnitPrice(umi, { microLamports: priority }));
  }

  const feeRecipient = unwrapOption(data.feeData.feeRecipient, () => undefined);
  const [feeRecipientAta] = feeRecipient
    ? findAssociatedTokenPda(umi, { mint: data.tokenMint, owner: feeRecipient })
    : [undefined];

  tb = tb.add(
    fusionIntoV1(umi, {
      user: umi.identity,
      asset: asset,
      tokenMint: data.tokenMint,
      collection: data.collection,
      feeRecipient,
      feeRecipientAta,
    })
  );

  return { asset, tx: tb.sendAndConfirm(umi, { confirm: { commitment } }) };
};

// Asset -> Spl Token
export const fusionFrom = (umi: Umi, { data, asset }: FromOpt) => {
  const { priority, commitment } = ClusterSettings;

  let tb = transactionBuilder();

  if (priority) {
    tb = tb.add(setComputeUnitPrice(umi, { microLamports: priority }));
  }

  tb = tb.add(
    fusionFromV1(umi, {
      user: umi.identity,
      asset: asset,
      tokenMint: data.tokenMint,
      collection: data.collection,
    })
  );

  return tb.sendAndConfirm(umi, { confirm: { commitment } });
};
