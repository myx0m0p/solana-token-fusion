import { createCollection } from '@metaplex-foundation/mpl-core';
import { createFungible, mintV1, TokenStandard } from '@metaplex-foundation/mpl-token-metadata';
import { findAssociatedTokenPda } from '@metaplex-foundation/mpl-toolbox';
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

export type CollectionAccounts = {
  collection: Signer;
  authority: PublicKey;
};

export const generateCollection = async (
  umi: Umi,
  {
    collection = generateSigner(umi),
    authority = umi.identity.publicKey,
  }: Partial<CollectionAccounts> = {},
  data = collectionData()
): Promise<CollectionAccounts> => {
  await createCollection(umi, {
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
  };
};

export type AssetAccounts = {
  asset: Signer;
};

export const generateAsset = async (
  umi: Umi,
  asset = generateSigner(umi)
): Promise<AssetAccounts> => {
  return {
    asset,
  };
};

export const TOKEN_DATA = {
  name: 'STF Token',
  symbol: 'STF',
  uri: 'https://stf.org/token.json',
  decimals: 9n,
  supply: 1_000_000n,
};

export type TokenData = typeof TOKEN_DATA;

export type TokenAccounts = {
  mint: Signer;
  authority: Signer;
  ata: PublicKey;
  data: TokenData;
};

export const generateToken = async (
  umi: Umi,
  data = TOKEN_DATA,
  { mint = generateSigner(umi), authority = umi.identity }: Partial<TokenAccounts> = {}
): Promise<TokenAccounts> => {
  const [ata] = findAssociatedTokenPda(umi, {
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
    ata,
    data,
  };
};
