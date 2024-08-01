import { findMetadataPda, updateMetadataAccountV2 } from '@metaplex-foundation/mpl-token-metadata';
import { publicKey, transactionBuilder } from '@metaplex-foundation/umi';
import {
  findAssociatedTokenPda,
  setComputeUnitPrice,
  transferTokensChecked,
} from '@metaplex-foundation/mpl-toolbox';

import { explorerAddressLink, explorerTxLink } from '../utils/explorer';
import { AppLogger } from '../utils/logger';
import { ClusterType } from '../utils/cluster';
import { createUmi } from '../utils/umi';

import { SPL_TOKEN_METADATA } from '../deploy/_config';

export const updateTokenMetadata = async (cluster: ClusterType = 'localnet') => {
  const { umi, deployer, token } = await createUmi(cluster);

  AppLogger.info('Token Mint', explorerAddressLink(token.publicKey, { cluster }));

  const accountExists = await umi.rpc.accountExists(token.publicKey);

  if (!accountExists) {
    AppLogger.error('Token is not deployed.');
    return;
  }

  const [metadataPda] = findMetadataPda(umi, { mint: token.publicKey });

  // create token mint
  let builder = transactionBuilder();
  builder = builder.add(setComputeUnitPrice(umi, { microLamports: 100_000n }));
  builder = builder.add(
    updateMetadataAccountV2(umi, {
      metadata: metadataPda,
      updateAuthority: deployer,
      data: {
        name: SPL_TOKEN_METADATA.name,
        symbol: SPL_TOKEN_METADATA.symbol,
        uri: SPL_TOKEN_METADATA.uri,
        sellerFeeBasisPoints: 0,
        creators: [{ address: deployer.publicKey, verified: true, share: 100 }],
        collection: null,
        uses: null,
      },
    })
  );

  const builderResult = await builder.sendAndConfirm(umi);

  AppLogger.info('Update Tx', explorerTxLink(builderResult.signature, { cluster }));

  AppLogger.info('Done.');
};

export const transferTokens = async (
  amount: string,
  to: string,
  cluster: ClusterType = 'localnet'
) => {
  const { umi, deployer, token } = await createUmi(cluster);

  AppLogger.info('Token Mint', explorerAddressLink(token.publicKey, { cluster }));

  const accountExists = await umi.rpc.accountExists(token.publicKey);

  if (!accountExists) {
    AppLogger.error('Token is not deployed.');
    return;
  }

  const destinationAta = publicKey(to);

  const [sourceAta] = findAssociatedTokenPda(umi, {
    mint: token.publicKey,
    owner: deployer.publicKey,
  });

  // create token mint
  let builder = transactionBuilder();
  builder = builder.add(
    transferTokensChecked(umi, {
      source: sourceAta,
      mint: token.publicKey,
      destination: destinationAta,
      amount: parseInt(amount),
      decimals: Number(SPL_TOKEN_METADATA.decimals),
    })
  );

  const builderResult = await builder.sendAndConfirm(umi);

  AppLogger.info('Transfer Tx', explorerTxLink(builderResult.signature, { cluster }));

  AppLogger.info('Done.');
};
