import { useEventListener } from 'ahooks';
import { AppProps } from 'next/app';

import { Layout } from '@/components/Layout';
import { Providers } from '../providers';

import '@/styles/global.scss';
import '@solana/wallet-adapter-react-ui/styles.css';

export default function App({ Component, pageProps }: AppProps) {
  // disable image dragging
  useEventListener('dragstart', (event: DragEvent) => {
    const target = event.target as HTMLImageElement;
    if (target.tagName === 'IMG') event.preventDefault();
  });

  return (
    <Providers>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </Providers>
  );
}
