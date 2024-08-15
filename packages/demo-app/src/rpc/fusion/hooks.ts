import { useQuery } from '@tanstack/react-query';

import { Umi } from '@metaplex-foundation/umi';

import { fetchFusionDataV1, findFusionDataPda } from '@stf/token-fusion';

export const useFusionData = (umi: Umi) => {
  return useQuery({
    queryKey: ['fusionData'],
    queryFn: () => {
      const [dataPda] = findFusionDataPda(umi);
      return fetchFusionDataV1(umi, dataPda);
    },
  });
};
