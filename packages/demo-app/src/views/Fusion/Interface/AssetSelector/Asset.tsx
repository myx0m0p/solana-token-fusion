/* eslint-disable @next/next/no-img-element */
import { memo } from 'react';
import { AssetV1 } from '@metaplex-foundation/mpl-core';
import Image from 'next/image';

import cn from 'classnames';

import S from './AssetSelector.module.scss';
import { useAssetMetadata } from '@/rpc/fusion';

type Props = {
  asset: AssetV1;
  selected?: boolean;
  onSelect?: (asset: AssetV1) => void;
};

const Component: React.FC<Props> = ({ asset, selected, onSelect }) => {
  const { data: metadata } = useAssetMetadata(asset);

  return (
    <div
      className={cn(S.assetContainer, { [S.selected]: selected })}
      onClick={() => onSelect && onSelect(asset)}
    >
      {!metadata && (
        <div className={S.preloaderContainer}>
          <div className={S.preloader}>
            <svg className={S.icon} viewBox='25 25 50 50'>
              <circle className={S.path} cx='50' cy='50' r='20' />
            </svg>
          </div>
        </div>
      )}
      {metadata && (
        <Image src={metadata.image} width={114} height={114} alt={asset.name} title={asset.name} />
      )}
    </div>
  );
};

export const Asset = memo(Component);
Asset.displayName = 'Asset';
