import { useQuery } from '@tanstack/react-query';

import { PublicKey } from '@metaplex-foundation/umi';

import { AssetV1 } from '@metaplex-foundation/mpl-core';
import { das } from '@metaplex-foundation/mpl-core-das';
import { fetchFusionDataV1, findFusionDataPda } from '@stf/token-fusion';

import { useUmi } from '@/providers/useUmi';
import { AssetMetadata } from '@/types';

export const useFusionData = () => {
  const umi = useUmi();

  return useQuery({
    queryKey: ['fusionData'],
    queryFn: () => {
      const [dataPda] = findFusionDataPda(umi);
      return fetchFusionDataV1(umi, dataPda);
    },
  });
};

export const useCollectionData = (collection: PublicKey) => {
  const umi = useUmi();

  return useQuery({
    queryKey: ['collectionData', collection],
    queryFn: () => {
      return das.getCollection(umi, collection);
    },
  });
};

export const useAssetMetadata = (asset: AssetV1) => {
  return useQuery({
    queryKey: ['assetMetadata', asset.publicKey],
    queryFn: () => {
      return fetch(asset.uri).then((res) => res.json() as Promise<AssetMetadata>);
    },
  });
};
