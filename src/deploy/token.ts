import { TokenStandard, createFungible, mintV1 } from '@metaplex-foundation/mpl-token-metadata';
import { percentAmount, transactionBuilder } from '@metaplex-foundation/umi';
import { AuthorityType, setAuthority, setComputeUnitPrice } from '@metaplex-foundation/mpl-toolbox';

import { explorerAddressLink, explorerTxLink } from '../utils/explorer';
import { AppLogger } from '../utils/logger';
import { createUmi } from '../utils/umi';
import { TokenCliOptions } from '../types';

export const deployToken = async ({
  cluster,
  name,
  symbol,
  uri,
  decimals,
  mint,
  supply,
}: TokenCliOptions) => {
  const { umi, deployer, token, treasure, clusterSettings } = await createUmi(cluster);

  // local wallet
  const tokenOwner = cluster === 'localnet' ? deployer.publicKey : treasure.publicKey;

  AppLogger.info('Token Mint', explorerAddressLink(token.publicKey, { cluster }));

  const accountExists = await umi.rpc.accountExists(token.publicKey);

  if (accountExists) {
    AppLogger.error('Token already deployed.');
    return;
  }

  let builder = transactionBuilder();

  // add priority
  if (clusterSettings.priority) {
    builder = builder.add(setComputeUnitPrice(umi, { microLamports: clusterSettings.priority }));
  }

  // create token mint
  builder = builder.add(
    createFungible(umi, {
      mint: token,
      authority: deployer,
      updateAuthority: deployer,
      name,
      symbol,
      uri,
      sellerFeeBasisPoints: percentAmount(0),
      decimals,
    })
  );

  // mint tokens
  if (mint) {
    builder = builder.add(
      mintV1(umi, {
        mint: token.publicKey,
        authority: deployer,
        amount: BigInt(supply) * 10n ** BigInt(decimals),
        tokenOwner: tokenOwner,
        tokenStandard: TokenStandard.Fungible,
      })
    );
  }

  // drop mint authority
  builder = builder.add(
    setAuthority(umi, {
      owned: token.publicKey,
      owner: deployer,
      authorityType: AuthorityType.MintTokens,
      newAuthority: null,
    })
  );

  // drop freeze authority
  builder = builder.add(
    setAuthority(umi, {
      owned: token.publicKey,
      owner: deployer,
      authorityType: AuthorityType.FreezeAccount,
      newAuthority: null,
    })
  );

  const builderResult = await builder.sendAndConfirm(umi);

  AppLogger.info('Create Token Tx', explorerTxLink(builderResult.signature, { cluster }));

  AppLogger.info('Done');
};
