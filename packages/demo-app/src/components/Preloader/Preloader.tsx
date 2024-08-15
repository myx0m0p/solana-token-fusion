import { memo } from 'react';

import S from './Preloader.module.scss';

const Component: React.FC = () => (
  <div className={S.preloader}>
    <svg className={S.icon} viewBox='25 25 50 50'>
      <circle className={S.path} cx='50' cy='50' r='20' />
    </svg>
  </div>
);

export const Preloader = memo(Component);
Preloader.displayName = 'Preloader';
