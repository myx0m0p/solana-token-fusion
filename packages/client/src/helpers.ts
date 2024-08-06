import { Context, Pda, PublicKey } from '@metaplex-foundation/umi';
import { string, publicKey as publicKeySerializer } from '@metaplex-foundation/umi/serializers';

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
  const programId = context.programs.getPublicKey(
    'associatedTokenProgram',
    'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'
  );
  const tokenProgram = context.programs.getPublicKey(
    'tokenProgram',
    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
  );
  const authorityPda = findFusionAuthorityPda(context);

  return context.eddsa.findPda(programId, [
    publicKeySerializer().serialize(authorityPda),
    publicKeySerializer().serialize(tokenProgram),
    publicKeySerializer().serialize(mint),
  ]);
}
