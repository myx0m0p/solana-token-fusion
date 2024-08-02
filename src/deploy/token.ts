import { TokenStandard, createFungible, mintV1 } from '@metaplex-foundation/mpl-token-metadata';
import { percentAmount, transactionBuilder } from '@metaplex-foundation/umi';
import { AuthorityType, setAuthority, setComputeUnitPrice } from '@metaplex-foundation/mpl-toolbox';

import { explorerAddressLink, explorerTxLink } from '../utils/explorer';
import { AppLogger } from '../utils/logger';
import { ClusterType } from '../utils/cluster';
import { createUmi } from '../utils/umi';

//TODO Move this to cli params with defaults
export const SPL_TOKEN_METADATA = {
  name: 'SFT Token',
  symbol: 'STF',
  uri: 'https://sft.org/token.json',
  decimals: 9n,
  mint: true,
  mintAmount: 1_000_000n,
};

export const deployToken = async (cluster: ClusterType = 'localnet') => {
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
      name: SPL_TOKEN_METADATA.name,
      symbol: SPL_TOKEN_METADATA.symbol,
      uri: SPL_TOKEN_METADATA.uri,
      sellerFeeBasisPoints: percentAmount(0),
      decimals: Number(SPL_TOKEN_METADATA.decimals),
    })
  );

  // mint tokens
  if (SPL_TOKEN_METADATA.mint) {
    builder = builder.add(
      mintV1(umi, {
        mint: token.publicKey,
        authority: deployer,
        amount: SPL_TOKEN_METADATA.mintAmount * 10n ** SPL_TOKEN_METADATA.decimals,
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
