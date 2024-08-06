import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';

import { rootNodeFromAnchor } from '@kinobi-so/nodes-from-anchor';
import { renderVisitor } from '@kinobi-so/renderers-js-umi';
import {
  createFromRoot,
  consoleLogVisitor,
  getDebugStringVisitor,
  setInstructionAccountDefaultValuesVisitor,
  publicKeyValueNode,
  pdaValueNode,
  pdaNode,
  updateAccountsVisitor,
  variablePdaSeedNode,
  publicKeyTypeNode,
} from 'kinobi';

// shim for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the content of your IDL file.
const anchorIdlPath = path.join(__dirname, '..', 'idls', 'token_fusion.json');
const anchorIdl = JSON.parse(readFileSync(anchorIdlPath, 'utf-8'));

// Parse it into a Kinobi IDL.
const kinobi = createFromRoot(rootNodeFromAnchor(anchorIdl));

// Fix feeAccount write access [bug in kinobi]
// Fix associated token accounts programId [bug in kinobi]
kinobi.update(
  setInstructionAccountDefaultValuesVisitor([
    {
      account: 'feeAccount',
      defaultValue: publicKeyValueNode('CRumnxQ9i84X7pbmgCdSSMW6WJ7njUad3LgK3kFo11zG'),
    },
    {
      account: 'escrowAtaPda',
      defaultValue: pdaValueNode(
        pdaNode({
          name: 'escrowAtaPda',
          programId: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
          seeds: [
            variablePdaSeedNode('authorityPda', publicKeyTypeNode()),
            variablePdaSeedNode('tokenProgram', publicKeyTypeNode()),
            variablePdaSeedNode('tokenMint', publicKeyTypeNode()),
          ],
        })
      ),
    },
    {
      account: 'userAta',
      defaultValue: pdaValueNode(
        pdaNode({
          name: 'userAta',
          programId: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
          seeds: [
            variablePdaSeedNode('user', publicKeyTypeNode()),
            variablePdaSeedNode('tokenProgram', publicKeyTypeNode()),
            variablePdaSeedNode('tokenMint', publicKeyTypeNode()),
          ],
        })
      ),
    },
    {
      account: 'authorityAta',
      defaultValue: pdaValueNode(
        pdaNode({
          name: 'authorityAta',
          programId: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
          seeds: [
            variablePdaSeedNode('authority', publicKeyTypeNode()),
            variablePdaSeedNode('tokenProgram', publicKeyTypeNode()),
            variablePdaSeedNode('tokenMint', publicKeyTypeNode()),
          ],
        })
      ),
    },
  ])
);

// remove BaseAssetV1 and BaseCollectionV1 from the IDL
kinobi.update(
  updateAccountsVisitor({
    baseAssetV1: {
      delete: true,
    },
    baseCollectionV1: {
      delete: true,
    },
  })
);

const clientDir = path.join(__dirname, '..', 'packages', 'client');
const pathToGeneratedFolder = path.join(clientDir, 'src', 'generated');
kinobi.accept(renderVisitor(pathToGeneratedFolder, {}));

// Print the Kinobi IDL to the console.
// kinobi.accept(consoleLogVisitor(getDebugStringVisitor({ indent: true })));
