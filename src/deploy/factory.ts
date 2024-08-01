import { PublicKey, Signer, Umi, transactionBuilder } from '@metaplex-foundation/umi';
import {
  MetadataDelegateRole,
  findMasterEditionPda,
  findMetadataDelegateRecordPda,
  findMetadataPda,
} from '@metaplex-foundation/mpl-token-metadata';
import { MPL_TOKEN_AUTH_RULES_PROGRAM_ID } from '@metaplex-foundation/mpl-candy-machine';
import {
  SPL_ASSOCIATED_TOKEN_PROGRAM_ID,
  findAssociatedTokenPda,
  setComputeUnitPrice,
} from '@metaplex-foundation/mpl-toolbox';

import { explorerAddressLink, explorerTxLink } from '../utils/explorer';
import { AppLogger } from '../utils/logger';
import { ClusterType } from '../utils/cluster';
import { METAPLEX_DEFAULT_RULESET, createUmi } from '../utils/umi';
import {
  NFT_AVAILABLE,
  NFT_COLLECTION_SETTINGS,
  NFT_NAME_PREFIX,
  PROD_NFT_STORAGE_CID,
  SPL_TOKEN_METADATA,
} from './_config';
import {
  AssetData,
  TokenData,
  enchant,
  fetchTransmuteFactory,
  findFactoryAuthorityPda,
  findFactoryDataPda,
} from '../../packages/client/src';

export const getCollectionAccounts = (
  umi: Umi,
  input: {
    mint: PublicKey;
    authority: Signer;
    authorityDelegate: PublicKey;
  }
) => {
  const { mint, authority, authorityDelegate } = input;
  const [metadata] = findMetadataPda(umi, {
    mint,
  });

  const [masterEdition] = findMasterEditionPda(umi, {
    mint,
  });

  const [delegateRecord] = findMetadataDelegateRecordPda(umi, {
    mint,
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
export const enchantFactory = async (cluster: ClusterType = 'localnet') => {
  const {
    umi,
    deployer,
    collection: collectionMint,
    factory,
    token: tokenMint,
  } = await createUmi(cluster);

  AppLogger.info('Factory', explorerAddressLink(factory.publicKey, { cluster }));

  const [dataPda] = findFactoryDataPda(umi);
  const [authorityPda] = findFactoryAuthorityPda(umi);
  const [treasurePda] = findAssociatedTokenPda(umi, {
    mint: tokenMint.publicKey,
    owner: authorityPda,
  });

  const accountExists = await umi.rpc.accountExists(dataPda);

  if (accountExists) {
    AppLogger.error('Factory already enchanted.');
    return;
  }

  const collection = getCollectionAccounts(umi, {
    mint: collectionMint.publicKey,
    authority: deployer,
    authorityDelegate: authorityPda,
  });

  const assetData: AssetData = {
    assetSymbol: NFT_COLLECTION_SETTINGS.symbol,
    assetNextIndex: NFT_AVAILABLE + 1n,
    assetNamePrefix: NFT_NAME_PREFIX,
    assetUriPrefix: PROD_NFT_STORAGE_CID + '/',
    assetUriSuffix: '',
    assetSellerFeeBasisPoints: Number(NFT_COLLECTION_SETTINGS.sellerFeeBasisPoints.basisPoints),
    assetCreators: [
      {
        address: deployer.publicKey,
        verified: true,
        percentageShare: 100,
      },
    ],
  };

  const tokenData: TokenData = {
    tokenFromAmount: 666_666_666n * 10n ** SPL_TOKEN_METADATA.decimals,
    tokenIntoAmount: 600_000_000n * 10n ** SPL_TOKEN_METADATA.decimals,
  };

  let builder = transactionBuilder();
  builder = builder.add(setComputeUnitPrice(umi, { microLamports: 100_000n }));

  builder = builder.add(
    enchant(umi, {
      factory: dataPda,
      authorityPda: authorityPda,
      collectionMint: collection.mint,
      collectionMetadata: collection.metadata,
      collectionMasterEdition: collection.masterEdition,
      collectionDelegateRecord: collection.delegateRecord,
      collectionUpdateAuthority: collection.authority,
      ruleSet: METAPLEX_DEFAULT_RULESET,
      tokenMint: tokenMint.publicKey,
      tokenTreasure: treasurePda,
      associatedTokenProgram: SPL_ASSOCIATED_TOKEN_PROGRAM_ID,
      authorizationRulesProgram: MPL_TOKEN_AUTH_RULES_PROGRAM_ID,
      authorizationRules: METAPLEX_DEFAULT_RULESET,
      assetData: assetData,
      tokenData: tokenData,
    })
  );

  const builderResult = await builder.sendAndConfirm(umi);
  AppLogger.info('Enchant Factory Tx', explorerTxLink(builderResult.signature, { cluster }));
  AppLogger.info('Treasure PDA', explorerAddressLink(treasurePda, { cluster }));

  const dataAccount = await fetchTransmuteFactory(umi, dataPda);
  AppLogger.info('Factory Data', dataAccount);

  AppLogger.info('Done.');
};
