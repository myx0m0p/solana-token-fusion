import { ReactNode, useMemo } from 'react';

import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import { mplToolbox } from '@metaplex-foundation/mpl-toolbox';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';

import { tokenFusionPlugin } from '@stf/token-fusion';

import { UmiContext } from './useUmi';

export function UmiProvider({ children }: { children: ReactNode }) {
  const wallet = useWallet();
  const { connection } = useConnection();
  const umi = useMemo(
    () =>
      createUmi(connection)
        .use(walletAdapterIdentity(wallet))
        .use(mplToolbox())
        .use(tokenFusionPlugin()),
    [wallet, connection]
  );

  return <UmiContext.Provider value={{ umi }}>{children}</UmiContext.Provider>;
}
