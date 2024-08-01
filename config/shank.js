const path = require('path');
const { generateIdl } = require('@metaplex-foundation/shank-js');

const idlDir = path.join(__dirname, '..', 'idls');
const binaryInstallDir = path.join(__dirname, '..', '.crates');
const programDir = path.join(__dirname, '..', 'programs');

// From an Anchor program.
generateIdl({
  generator: 'anchor',
  programName: 'sin_transmute_factory',
  programId: 'FtryBRW5XzhHd6Z9ghHnYUM35BqhaFbukM6HUBT1peUo',
  idlDir,
  binaryInstallDir,
  programDir: path.join(programDir, 'sin-transmute-factory'),
});
