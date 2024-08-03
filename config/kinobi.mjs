import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';

import { rootNodeFromAnchor } from '@kinobi-so/nodes-from-anchor';
import { renderVisitor } from '@kinobi-so/renderers-js-umi';
import { createFromRoot } from 'kinobi';

// shim for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the content of your IDL file.
const anchorIdlPath = path.join(__dirname, '..', 'idls', 'token_fusion.json');
const anchorIdl = JSON.parse(readFileSync(anchorIdlPath, 'utf-8'));

// Parse it into a Kinobi IDL.
const kinobi = createFromRoot(rootNodeFromAnchor(anchorIdl));

// Set default values for instruction accounts.
// kinobi.update(
//     new k.SetInstructionAccountDefaultValuesVisitor([
//         {
//             account: 'authority',
//             ignoreIfOptional: true,
//             ...k.identityDefault(),
//         },
//         {
//             account: 'metadata',
//             ignoreIfOptional: true,
//             ...k.pdaDefault('metadata'),
//         },
//         {
//             account: 'tokenRecord',
//             ignoreIfOptional: true,
//             ...k.pdaDefault('tokenRecord'),
//         },
//         {
//             account: /^edition|masterEdition$/,
//             ignoreIfOptional: true,
//             ...k.pdaDefault('masterEdition'),
//         },
//         {
//             account: 'authorizationRulesProgram',
//             ...k.conditionalDefault('account', 'authorizationRules', {
//                 ifTrue: k.programDefault('mplTokenAuthRules', 'auth9SigNpDKz4sJJ1DfCTuZrZNSAgh9sFD3rboVmgg'),
//             }),
//         },
//     ])
// );

// Set account discriminators.
// const key = (name) => ({
//     field: 'key',
//     value: k.vEnum('Key', name),
// });
// kinobi.update(
//     new k.SetAccountDiscriminatorFromFieldVisitor({
//         Edition: key('EditionV1'),
//         Metadata: key('MetadataV1'),
//         MasterEdition: key('MasterEditionV2'),
//         EditionMarker: key('EditionMarker'),
//         UseAuthorityRecord: key('UseAuthorityRecord'),
//         CollectionAuthorityRecord: key('CollectionAuthorityRecord'),
//         TokenOwnedEscrow: key('TokenOwnedEscrow'),
//         TokenRecord: key('TokenRecord'),
//         MetadataDelegate: key('MetadataDelegate'),
//     })
// );

// Wrap leaves.
// kinobi.update(
//     new k.setNumberWrappersVisitor({
//         'ExchangeSettings.assetSellerFeeBasisPoints': {
//             kind: 'Amount',
//             identifier: '%',
//             decimals: 2,
//         },
//     })
// );

// Set struct default values.
// kinobi.update(
//     new k.SetStructDefaultValuesVisitor({
//         assetData: {
//             symbol: k.vScalar(''),
//             isMutable: k.vScalar(true),
//             primarySaleHappened: k.vScalar(false),
//             collection: k.vNone(),
//             uses: k.vNone(),
//             collectionDetails: k.vNone(),
//             ruleSet: k.vNone(),
//         },
//         'updateArgs.AsUpdateAuthorityV2': { tokenStandard: k.vNone() },
//         'updateArgs.AsAuthorityItemDelegateV2': { tokenStandard: k.vNone() },
//     })
// );

// // Render JavaScript.
// const jsDir = path.join(clientDir, 'src', 'generated');
// const prettier = require(path.join(clientDir, '.prettierrc.js'));
// kinobi.accept(new k.renderJavaScriptVisitor(jsDir, { prettier }));

// // Render Rust.
// const rustDir = path.join(rustClientDir, 'src', 'generated');
// kinobi.accept(
//   k.renderRustVisitor(rustDir, {
//     formatCode: true,
//     crateFolder: rustClientDir,
//     renderParentInstructions: true,
//   })
// );

const clientDir = path.join(__dirname, '..', 'packages', 'client');
const pathToGeneratedFolder = path.join(clientDir, 'src', 'generated');
const options = {}; // See below.
kinobi.accept(renderVisitor(pathToGeneratedFolder, options));
