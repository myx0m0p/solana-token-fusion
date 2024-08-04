import { UmiPlugin } from '@metaplex-foundation/umi';
import { createTokenFusionProgram } from './generated';

export const sinTransmuteFactory = (): UmiPlugin => ({
  install(umi) {
    umi.programs.add(createTokenFusionProgram(), false);
  },
});
