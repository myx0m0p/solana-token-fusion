import { useQuery } from '@tanstack/react-query';

import { PublicKey } from '@metaplex-foundation/umi';

import { fetchCollectionV1 } from '@metaplex-foundation/mpl-core';
import { fetchFusionDataV1, findFusionDataPda } from '@stf/token-fusion';

import { useUmi } from '@/providers/useUmi';

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
      return fetchCollectionV1(umi, collection);
    },
  });
};
