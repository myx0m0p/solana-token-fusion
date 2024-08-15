import { memo } from 'react';

import S from './Footer.module.scss';

const Component: React.FC = () => (
  <footer className={S.footer}>
    <div className={S.container}>
      <div className={S.copyright}>&copy; 2024 Token Fusion Protocol</div>
    </div>
  </footer>
);

export const Footer = memo(Component);
Footer.displayName = 'Footer';
