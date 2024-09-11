/* eslint-disable @next/next/no-img-element */
import { memo, useState } from 'react';
import { AssetV1 } from '@metaplex-foundation/mpl-core';
import Image from 'next/image';

import cn from 'classnames';

import S from './AssetSelector.module.scss';
import { useAssetMetadata } from '@/rpc/fusion';

const REFETCH_INTERVAL = 5000;

type Props = {
  asset: AssetV1;
  selected?: boolean;
  onSelect?: (asset: AssetV1) => void;
};

const Component: React.FC<Props> = ({ asset, selected, onSelect }) => {
  const [loaded, setLoaded] = useState(false);

  const { data: metadata } = useAssetMetadata(asset);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setTimeout(() => {
      (e.target as HTMLImageElement).src = metadata?.image || '';
    }, REFETCH_INTERVAL);
  };

  return (
    <div
      className={cn(S.assetContainer, { [S.selected]: selected })}
      onClick={() => onSelect && onSelect(asset)}
    >
      {!loaded && (
        <div className={S.preloaderContainer}>
          <div className={S.preloader}>
            <svg className={S.icon} viewBox='25 25 50 50'>
              <circle className={S.path} cx='50' cy='50' r='20' />
            </svg>
          </div>
        </div>
      )}
      <Image
        src={metadata?.image || ''}
        width={114}
        height={114}
        alt={asset.name}
        title={asset.name}
        onLoad={() => setLoaded(true)}
        onError={handleError}
      />
    </div>
  );
};

export const Asset = memo(Component);
Asset.displayName = 'Asset';
