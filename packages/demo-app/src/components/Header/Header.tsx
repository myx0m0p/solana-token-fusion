/* eslint-disable @next/next/no-img-element */
import { memo } from 'react';
import cn from 'classnames';

import { ConnectButton } from '@/components/ConnectButton';
import S from './Header.module.scss';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Component: React.FC = () => {
  const pathname = usePathname();
  return (
    <header className={S.header}>
      <div className={S.container}>
        <Link href='/'>
          <div className={S.logo}>
            <img className={S.logoIcon} src='media/logo.svg' alt='sindao logo icon' />
            <img className={S.logoImage} src='media/logo-text.svg' alt='sindao logo text' />
          </div>
        </Link>
        <ul className={S.nav}>
          <li className={S.navItem}>
            <Link
              className={cn(S.link, { [S.active]: pathname === '/mint' || pathname === '/' })}
              href='/mint'
            >
              Mint
            </Link>
          </li>
          <li className={S.navItem}>
            <Link className={cn(S.link, { [S.active]: pathname === '/burn' })} href='/burn'>
              Burn
            </Link>
          </li>
        </ul>

        <div className={cn(S.connectButton)}>
          <ConnectButton size='lg' />
        </div>
        <div className={S.connectButtonMobile}>
          <ConnectButton size='sm' />
        </div>
      </div>
    </header>
  );
};

export const Header = memo(Component);
Header.displayName = 'Header';
