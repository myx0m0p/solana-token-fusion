import { memo } from 'react';

import type { Props } from './Icon.types';

const Component: React.FC<Props> = ({ kind, className }) => (
  <svg className={className} viewBox='0 0 1 1'>
    <use xlinkHref={`/media/sprite.svg#${kind}`} />
  </svg>
);

export const Icon = memo(Component);
Icon.displayName = 'Icon';
