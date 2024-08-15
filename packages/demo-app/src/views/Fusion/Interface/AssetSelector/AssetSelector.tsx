import { memo } from 'react';
import { DigitalAsset } from '@metaplex-foundation/mpl-token-metadata';

import S from './AssetSelector.module.scss';
import { Asset } from './Asset';

type Props = {
  assets?: DigitalAsset[];
  selected?: DigitalAsset;
  onSelect?: (digitalAsset: DigitalAsset) => void;
};

const Component: React.FC<Props> = ({ assets, selected, onSelect }) => {
  if (!assets || assets.length === 0)
    return <div className={S.container}>You got no Sinners in your wallet. Think about it.</div>;

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
