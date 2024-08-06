import { mplCore } from '@metaplex-foundation/mpl-core';
import { mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';
import { mplToolbox } from '@metaplex-foundation/mpl-toolbox';
import { createUmi as baseCreateUmi } from '@metaplex-foundation/umi-bundle-defaults';
import {
  PublicKey,
  SolAmount,
  Umi,
  createSignerFromKeypair,
  signerIdentity,
  sol,
} from '@metaplex-foundation/umi';
import { ClusterType, getClusterSettings } from './cluster';
import { loadOrGenerateKeypair } from './loadKey';

const requestAirdrop = async (umi: Umi, input: { address: PublicKey; amount: SolAmount }) => {
  const bal = await umi.rpc.getBalance(input.address);
  if (bal.basisPoints > 0) return;
  await umi.rpc.airdrop(input.address, input.amount);
};

export const createUmi = async (cluster: ClusterType = 'localnet') => {
  const clusterSettings = getClusterSettings(cluster);
  const umi = await baseCreateUmi(clusterSettings.rpc, { commitment: clusterSettings.commitment });

  const deployer = createSignerFromKeypair(umi, loadOrGenerateKeypair('deployer.json', cluster));
  const user = createSignerFromKeypair(umi, loadOrGenerateKeypair('user.json', cluster));
  const treasure = createSignerFromKeypair(umi, loadOrGenerateKeypair('treasure.json', cluster));

  const token = createSignerFromKeypair(umi, loadOrGenerateKeypair('token.json', cluster));
  const collection = createSignerFromKeypair(umi, loadOrGenerateKeypair('collection.json', cluster));
  const stfProgram = createSignerFromKeypair(umi, loadOrGenerateKeypair('stf_program.json', cluster));

  umi.use(signerIdentity(deployer));
  umi.use(mplTokenMetadata());
  umi.use(mplToolbox());
  umi.use(mplCore());

  if (clusterSettings.airdropEnabled) {
    await requestAirdrop(umi, {
      address: deployer.publicKey,
      amount: sol(clusterSettings.aidropAmount || 0.1),
    });
    await requestAirdrop(umi, {
      address: user.publicKey,
      amount: sol(clusterSettings.aidropAmount || 0.1),
    });
  }

  return {
    umi,
    deployer,
    user,
    treasure,
    token,
    collection,
    stfProgram,
    clusterSettings,
  };
};
