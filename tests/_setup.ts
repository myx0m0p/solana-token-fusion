import {
  MetadataDelegateRole,
  TokenStandard,
  createNft as baseCreateNft,
  createFungible,
  findMasterEditionPda,
  findMetadataDelegateRecordPda,
  findMetadataPda,
  findTokenRecordPda,
  mintV1,
} from '@metaplex-foundation/mpl-token-metadata';
import { findAssociatedTokenPda } from '@metaplex-foundation/mpl-toolbox';
import {
  PublicKey,
  Signer,
  Umi,
  generateSigner,
  percentAmount,
  transactionBuilder,
} from '@metaplex-foundation/umi';

type CollectionData = Pick<
  Parameters<typeof baseCreateNft>[1],
  'name' | 'symbol' | 'sellerFeeBasisPoints' | 'uri'
>;

export const collectionData = (): CollectionData => ({
  name: 'My Asset',
  symbol: 'OLD',
  sellerFeeBasisPoints: percentAmount(10, 2),
  uri: 'https://example.com/my-asset.json',
});

export const newCollectionData = (): CollectionData => ({
  name: 'My new Asset',
  symbol: 'NEW',
  sellerFeeBasisPoints: percentAmount(100, 2),
  uri: 'https://example.com/my-new-asset.json',
});

export type CollectionAccounts = {
  mint: Signer;
  authority: Signer;
  metadata: PublicKey;
  masterEdition: PublicKey;
  delegateRecord: PublicKey;
};

export const generateCollection = async (
  umi: Umi,
  authorityDelegate: PublicKey,
  authority = umi.identity,
  data: CollectionData = collectionData()
): Promise<CollectionAccounts> => {
  const mint = generateSigner(umi);

  await baseCreateNft(umi, {
    mint,
    ...data,
    isCollection: true,
  }).sendAndConfirm(umi);

  const [metadata] = findMetadataPda(umi, {
    mint: mint.publicKey,
  });

  const [masterEdition] = findMasterEditionPda(umi, {
    mint: mint.publicKey,
  });

  const [delegateRecord] = findMetadataDelegateRecordPda(umi, {
    mint: mint.publicKey,
    updateAuthority: authority.publicKey,
    delegateRole: MetadataDelegateRole.Collection,
    delegate: authorityDelegate,
  });

  return {
    mint,
    authority,
    metadata,
    masterEdition,
    delegateRecord,
  };
};

export type AssetAccounts = {
  mint: Signer;
  authority: Signer;
  metadata: PublicKey;
  masterEdition: PublicKey;
  token: PublicKey;
  tokenRecord: PublicKey;
};

export const generateAsset = async (umi: Umi, authority = umi.identity): Promise<AssetAccounts> => {
  const mint = generateSigner(umi);

  const [metadata] = findMetadataPda(umi, {
    mint: mint.publicKey,
  });

  const [masterEdition] = findMasterEditionPda(umi, {
    mint: mint.publicKey,
  });

  const [token] = findAssociatedTokenPda(umi, {
    mint: mint.publicKey,
    owner: authority.publicKey,
  });

  const [tokenRecord] = findTokenRecordPda(umi, {
    mint: mint.publicKey,
    token: token,
  });

  return {
    mint,
    authority,
    metadata,
    masterEdition,
    token,
    tokenRecord,
  };
};

export const TOKEN_DATA = {
  name: 'SIN',
  symbol: 'SIN',
  uri: '',
  decimals: 6n,
  mintAmount: 6_666_666_666_666n,
};

export type TokenAccounts = {
  mint: Signer;
  authority: Signer;
  owner_ata: PublicKey;
};

export const generateToken = async (umi: Umi, authority = umi.identity): Promise<TokenAccounts> => {
  const mint = generateSigner(umi);

  const [owner_ata] = findAssociatedTokenPda(umi, {
    mint: mint.publicKey,
    owner: authority.publicKey,
  });

  // create token mint
  let builder = transactionBuilder().add([
    createFungible(umi, {
      mint,
      authority,
      updateAuthority: authority,
      name: TOKEN_DATA.name,
      symbol: TOKEN_DATA.symbol,
      uri: TOKEN_DATA.uri,
      sellerFeeBasisPoints: percentAmount(0),
      decimals: Number(TOKEN_DATA.decimals),
    }),
    mintV1(umi, {
      mint: mint.publicKey,
      authority,
      amount: TOKEN_DATA.mintAmount * 10n ** TOKEN_DATA.decimals,
      tokenOwner: authority.publicKey,
      tokenStandard: TokenStandard.Fungible,
    }),
  ]);

  await builder.sendAndConfirm(umi);

  return {
    mint,
    authority,
    owner_ata,
  };
};
