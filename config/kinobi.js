const path = require('path');
const k = require('@metaplex-foundation/kinobi');

// Paths.
const clientDir = path.join(__dirname, '..', 'packages', 'client');
const rustClientDir = path.join(__dirname, '..', 'client', 'rust');
const idlDir = path.join(__dirname, '..', 'idls');

// Instanciate Kinobi.
const kinobi = k.createFromIdls([path.join(idlDir, 'sin_transmute_factory.json')]);

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

// Render JavaScript.
const jsDir = path.join(clientDir, 'src', 'generated');
const prettier = require(path.join(clientDir, '.prettierrc.js'));
kinobi.accept(new k.renderJavaScriptVisitor(jsDir, { prettier }));

// Render Rust.
const rustDir = path.join(rustClientDir, 'src', 'generated');
kinobi.accept(
  k.renderRustVisitor(rustDir, {
    formatCode: true,
    crateFolder: rustClientDir,
    renderParentInstructions: true,
  })
);
