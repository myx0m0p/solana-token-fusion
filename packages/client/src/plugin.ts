import { UmiPlugin } from '@metaplex-foundation/umi';
import { createTokenFusionProgram } from './generated';

export const tokenFusionPlugin = (): UmiPlugin => ({
  install(umi) {
    umi.programs.add(createTokenFusionProgram(), false);
  },
});
