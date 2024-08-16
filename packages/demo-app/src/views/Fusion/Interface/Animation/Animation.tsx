/* eslint-disable @next/next/no-img-element */
import { memo } from 'react';

import S from './Animation.module.scss';
import type { Props } from './Animation.types';

const Component: React.FC<Props> = ({ url }) => (
  <div className={S.animation}>
    <img src={url} className={S.video} alt='cover' height='468' width='468' />
    {/* <video
      src={url}
      className={S.video}
      muted
      autoPlay
      loop
      playsInline
      height='468'
      width='468'
      preload='auto'
    /> */}
  </div>
);

export const Animation = memo(Component);
Animation.displayName = 'Animation';
