import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';

import { rootNodeFromAnchor } from '@kinobi-so/nodes-from-anchor';
import { renderVisitor } from '@kinobi-so/renderers-js-umi';
import { createFromRoot, consoleLogVisitor, getDebugStringVisitor } from 'kinobi';

// shim for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the content of your IDL file.
const anchorIdlPath = path.join(__dirname, '..', 'idls', 'token_fusion.json');
const anchorIdl = JSON.parse(readFileSync(anchorIdlPath, 'utf-8'));

// Parse it into a Kinobi IDL.
const kinobi = createFromRoot(rootNodeFromAnchor(anchorIdl));

// kinobi.accept(consoleLogVisitor(getDebugStringVisitor({ indent: true })));

const clientDir = path.join(__dirname, '..', 'packages', 'client');
const pathToGeneratedFolder = path.join(clientDir, 'src', 'generated');
kinobi.accept(renderVisitor(pathToGeneratedFolder, {}));
