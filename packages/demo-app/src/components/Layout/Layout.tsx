import { memo } from 'react';

import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { NotificationContainer } from '@/components/NotificationContainer';

import { Head } from './components/Head';

import S from './Layout.module.scss';

type Props = {
  children?: React.ReactNode;
};

const Component: React.FC<Props> = ({ children }) => {
  return (
    <>
      <Head />

      <div className={S.layout}>
        <div className={S.header}>
          <Header />
        </div>

        <main className={S.main}>{children}</main>

        <div className={S.footer}>
          <Footer />
        </div>
      </div>
      <NotificationContainer />
    </>
  );
};

export const Layout = memo(Component);
Layout.displayName = 'Layout';
