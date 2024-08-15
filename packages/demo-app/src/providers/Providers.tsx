'use client';
import { ReactNode, useMemo } from 'react';

import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { UmiProvider } from './UmiProvider';
import { ClusterSettings } from '@/config';

export function Providers({ children }: { children: ReactNode }) {
  const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], []);

  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ConnectionProvider endpoint={ClusterSettings.rpc}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <UmiProvider>{children}</UmiProvider>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
