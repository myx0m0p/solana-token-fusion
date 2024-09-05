import { createCollection as createCollectionCore } from '@metaplex-foundation/mpl-core';
import { createFungible, mintV1, TokenStandard } from '@metaplex-foundation/mpl-token-metadata';
import { createAssociatedToken, findAssociatedTokenPda } from '@metaplex-foundation/mpl-toolbox';
import {
  PublicKey,
  Signer,
  Umi,
  generateSigner,
  percentAmount,
  transactionBuilder,
} from '@metaplex-foundation/umi';

type CoreAsset = {
  name: string;
  uri: string;
};

export const collectionData = (index?: string): CoreAsset => ({
  name: `STF Collection${index ? `#${index}` : ''}`,
  uri: `https://stf.org/collection${index ? `#${index}` : ''}.json`,
});

export const assetData = (index?: string): CoreAsset => ({
  name: `STF Asset${index ? `#${index}` : ''}`,
  uri: `https://stf.org/asset${index ? `#${index}` : ''}.json`,
});

type TokenData = {
  name: string;
  symbol: string;
  uri: string;
  decimals: bigint;
  supply: bigint;
};

export const tokenData = (): TokenData => {
  return {
    name: 'STF Token',
    symbol: 'STF',
    uri: 'https://stf.org/token.json',
    decimals: 9n,
    supply: 1_000_000n,
  };
};

export type CollectionAccounts = {
  collection: Signer;
  authority: Signer;
  data: CoreAsset;
};

export const createCollection = async (
  umi: Umi,
  {
    collection = generateSigner(umi),
    authority = umi.identity,
    data = collectionData(),
  }: Partial<CollectionAccounts> = {}
): Promise<CollectionAccounts> => {
  await createCollectionCore(umi, {
    collection,
    ...data,
    plugins: [
      {
        type: 'UpdateDelegate',
        additionalDelegates: [],
      },
    ],
  }).sendAndConfirm(umi);

  return {
    collection,
    authority,
    data,
  };
};

export type AssetAccounts = {
  asset: Signer;
  owner: Signer;
  data: CoreAsset;
};

export const generateAsset = async (
  umi: Umi,
  { asset = generateSigner(umi), owner = umi.identity, data = assetData() }: Partial<AssetAccounts> = {}
): Promise<AssetAccounts> => {
  return {
    asset,
    owner,
    data,
  };
};

export type TokenAccounts = {
  mint: Signer;
  authority: Signer;
  data: TokenData;
  authorityAta: PublicKey;
};

export const createToken = async (
  umi: Umi,
  { mint = generateSigner(umi), authority = umi.identity, data = tokenData() }: Partial<TokenAccounts> = {}
): Promise<TokenAccounts> => {
  const [authorityAta] = findAssociatedTokenPda(umi, {
    mint: mint.publicKey,
    owner: authority.publicKey,
  });

  // create token mint
  let builder = transactionBuilder().add([
    createFungible(umi, {
      mint,
      authority,
      updateAuthority: authority,
      name: data.name,
      symbol: data.symbol,
      uri: data.uri,
      sellerFeeBasisPoints: percentAmount(0),
      decimals: Number(data.decimals),
    }),
    mintV1(umi, {
      mint: mint.publicKey,
      authority,
      amount: data.supply * 10n ** data.decimals,
      tokenOwner: authority.publicKey,
      tokenStandard: TokenStandard.Fungible,
    }),
  ]);

  await builder.sendAndConfirm(umi);

  return {
    mint,
    authority,
    data,
    authorityAta,
  };
};

export type AtaAccounts = {
  mint: PublicKey;
  owner: PublicKey;
  payer: Signer;
};

export const createAta = async (umi: Umi, { mint, owner, payer }: AtaAccounts): Promise<PublicKey> => {
  const [authorityAta] = findAssociatedTokenPda(umi, {
    mint,
    owner,
  });

  // create token mint
  let builder = transactionBuilder().add([
    createAssociatedToken(umi, {
      payer,
      owner,
      mint,
    }),
  ]);

  await builder.sendAndConfirm(umi);

  return authorityAta;
};
