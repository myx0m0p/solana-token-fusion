import { memo } from 'react';
import { AssetV1 } from '@metaplex-foundation/mpl-core';

import S from './AssetSelector.module.scss';
import { Asset } from './Asset';

type Props = {
  assets?: AssetV1[];
  selected?: AssetV1;
  onSelect?: (digitalAsset: AssetV1) => void;
};

const Component: React.FC<Props> = ({ assets, selected, onSelect }) => {
  if (!assets || assets.length === 0)
    return <div className={S.container}>You got no mutardios. Go and get one!</div>;

  return (
    <div className={S.container}>
      {assets.map((asset) => (
        <Asset
          key={asset.publicKey}
          asset={asset}
          selected={asset.publicKey === selected?.publicKey}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
};

export const AssetSelector = memo(Component);
AssetSelector.displayName = 'AssetSelector';
