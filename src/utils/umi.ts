import {
  MetadataDelegateRole,
  createNft as baseCreateNft,
  findMasterEditionPda,
  findMetadataDelegateRecordPda,
  findMetadataPda,
  findTokenRecordPda,
  mplTokenMetadata,
} from '@metaplex-foundation/mpl-token-metadata';
import { findAssociatedTokenPda, mplToolbox } from '@metaplex-foundation/mpl-toolbox';
import {
  PublicKey,
  Signer,
  SolAmount,
  Umi,
  createSignerFromKeypair,
  generateSigner,
  percentAmount,
  publicKey,
  signerIdentity,
  sol,
} from '@metaplex-foundation/umi';
import { createUmi as baseCreateUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { ClusterType, getClusterSettings } from './cluster';
import { loadKey } from './loadKey';
import { mplCandyMachine } from '@metaplex-foundation/mpl-candy-machine';

export const METAPLEX_DEFAULT_RULESET = publicKey('eBJLFYPxJmMGKuFwpDWkzxZeUrad92kZRC5BJLpzyT9');

const requestAirdrop = async (umi: Umi, input: { address: PublicKey; amount: SolAmount }) => {
  const bal = await umi.rpc.getBalance(input.address);
  if (bal.basisPoints > 0) return;
  await umi.rpc.airdrop(input.address, input.amount);
};

export const createUmi = async (cluster: ClusterType = 'localnet') => {
  const clusterSettings = getClusterSettings(cluster);
  const umi = await baseCreateUmi(clusterSettings.rpc, { commitment: clusterSettings.commitment });

  const deployerKeypair = umi.eddsa.createKeypairFromSecretKey(loadKey('deployer.json', cluster));
  const minterKeypair = umi.eddsa.createKeypairFromSecretKey(loadKey('minter.json', cluster));
  const delegateKeypair = umi.eddsa.createKeypairFromSecretKey(loadKey('delegate.json', cluster));
  const treasureKeypair = umi.eddsa.createKeypairFromSecretKey(loadKey('treasure.json', cluster));

  const tokenKeypair = umi.eddsa.createKeypairFromSecretKey(loadKey('token.json', cluster));
  const collectionKeypair = umi.eddsa.createKeypairFromSecretKey(
    loadKey('collection.json', cluster)
  );
  const candyKeypair = umi.eddsa.createKeypairFromSecretKey(loadKey('candy.json', cluster));
  const factoryKeypair = umi.eddsa.createKeypairFromSecretKey(loadKey('factory.json', cluster));

  const deployer = createSignerFromKeypair(umi, deployerKeypair);
  const minter = createSignerFromKeypair(umi, minterKeypair);
  const delegate = createSignerFromKeypair(umi, delegateKeypair);
  const treasure = createSignerFromKeypair(umi, treasureKeypair);

  const token = createSignerFromKeypair(umi, tokenKeypair);
  const collection = createSignerFromKeypair(umi, collectionKeypair);
  const candy = createSignerFromKeypair(umi, candyKeypair);
  const factory = createSignerFromKeypair(umi, factoryKeypair);

  umi.use(signerIdentity(deployer));
  umi.use(mplTokenMetadata());
  umi.use(mplToolbox());
  umi.use(mplCandyMachine());

  if (clusterSettings.airdropEnabled) {
    await requestAirdrop(umi, {
      address: deployer.publicKey,
      amount: sol(clusterSettings.aidropAmount || 0.1),
    });
    await requestAirdrop(umi, {
      address: minter.publicKey,
      amount: sol(clusterSettings.aidropAmount || 0.1),
    });
    await requestAirdrop(umi, {
      address: delegate.publicKey,
      amount: sol(clusterSettings.aidropAmount || 0.1),
    });
  }

  return {
    umi,
    deployer,
    minter,
    delegate,
    treasure,
    token,
    collection,
    candy,
    factory,
  };
};

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

export interface CollectionAccounts {
  mint: Signer;
  authority: Signer;
  metadata: PublicKey;
  masterEdition: PublicKey;
  delegateRecord: PublicKey;
}

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

export interface AssetAccounts {
  mint: Signer;
  authority: Signer;
  metadata: PublicKey;
  masterEdition: PublicKey;
  token: PublicKey;
  tokenRecord: PublicKey;
}

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
