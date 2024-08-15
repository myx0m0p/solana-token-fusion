import { memo } from 'react';

import S from './ConnectWallet.module.scss';

const Component: React.FC = () => (
  <div className={S.pending}>
    <div className={S.title}>Connect Wallet to enter</div>
  </div>
);

export const ConnectWallet = memo(Component);
ConnectWallet.displayName = 'ConnectWallet';
