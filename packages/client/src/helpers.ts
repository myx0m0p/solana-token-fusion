import { findAssociatedTokenPda } from '@metaplex-foundation/mpl-toolbox';
import { Context, Pda, PublicKey } from '@metaplex-foundation/umi';
import { string } from '@metaplex-foundation/umi/serializers';

import { getTokenFusionProgramId } from './generated';

export function findFusionDataPda(context: Pick<Context, 'eddsa' | 'programs'>): Pda {
  const programId = getTokenFusionProgramId(context);
  return context.eddsa.findPda(programId, [string({ size: 'variable' }).serialize('fusion_data')]);
}
export function findFusionAuthorityPda(context: Pick<Context, 'eddsa' | 'programs'>): Pda {
  const programId = getTokenFusionProgramId(context);
  return context.eddsa.findPda(programId, [string({ size: 'variable' }).serialize('authority')]);
}

export function findEscrowAtaPda(
  context: Pick<Context, 'eddsa' | 'programs'>,
  mint: PublicKey
): Pda {
  const [authorityPda] = findFusionAuthorityPda(context);

  return findAssociatedTokenPda(context, {
    mint,
    owner: authorityPda,
  });
}
