import { memo, useMemo } from 'react';

import { Preloader } from '@/components/Preloader';
import { useUmi } from '@/providers/useUmi';
import { useFusionData } from '@/rpc/fusion';
import { Op } from '@/types';

import { MintInterface, BurnInterface } from './Interface';

import S from './Fusion.module.scss';

type Props = {
  op: Op;
};
const Component: React.FC<Props> = ({ op }) => {
  const umi = useUmi();
  const { data, refetch } = useFusionData(umi);

  const isDataLoaded = useMemo(() => {
    return data;
  }, [data]);

  return (
    <div className={S.page}>
      {!isDataLoaded && (
        <div className={S.preloader}>
          <Preloader />
        </div>
      )}

      {isDataLoaded && data && op === 'mint' && (
        <MintInterface fusionData={data} refetchFusionData={refetch} />
      )}
      {isDataLoaded && data && op === 'burn' && (
        <BurnInterface fusionData={data} refetchFusionData={refetch} />
      )}
    </div>
  );
};

export const Fusion = memo(Component);
Fusion.displayName = 'Fusion';
