/* eslint-disable @next/next/no-img-element */
import { memo, useState } from 'react';
import { DigitalAsset } from '@metaplex-foundation/mpl-token-metadata';
import Image from 'next/image';

import cn from 'classnames';

import { assetImageUri } from '@/utils/assetImageUri';

import S from './AssetSelector.module.scss';

const REFETCH_INTERVAL = 5000;

type Props = {
  asset: DigitalAsset;
  selected?: boolean;
  onSelect?: (asset: DigitalAsset) => void;
};

const Component: React.FC<Props> = ({ asset, selected, onSelect }) => {
  const [loaded, setLoaded] = useState(false);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setTimeout(() => {
      (e.target as HTMLImageElement).src = assetImageUri(asset.metadata.uri);
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
        src={assetImageUri(asset.metadata.uri)}
        width={114}
        height={114}
        alt={asset.metadata.name}
        title={asset.metadata.name}
        onLoad={() => setLoaded(true)}
        onError={handleError}
      />
    </div>
  );
};

export const Asset = memo(Component);
Asset.displayName = 'Asset';
