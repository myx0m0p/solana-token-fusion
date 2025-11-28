# Solana Token Fusion Protocol

A Solana program that enables bidirectional conversion between SPL tokens and Metaplex Core Assets (NFTs). Users can fuse tokens into assets and burn assets back into tokens, with configurable fees, escrow mechanisms, and supply limits.

## Overview

The Token Fusion Protocol allows users to:
- **Fuse Tokens into Assets**: Convert SPL tokens into Metaplex Core Assets (NFTs) by transferring tokens to an escrow and minting a new asset
- **Fuse Assets into Tokens**: Burn assets to recover tokens from the escrow
- **Configure Fees**: Set token fees, burn amounts, SOL fees, and fee recipients
- **Manage Supply**: Control maximum asset supply and track minting index
- **Pause Operations**: Temporarily halt fusion operations for maintenance

## Architecture

This project is a monorepo containing:

### 1. Anchor Program (`programs/token-fusion/`)
The core Solana program written in Rust using the Anchor framework.

**Key Components**:
- **State**: `FusionDataV1` - Stores fusion configuration, asset data, and fee settings
- **Instructions**:
  - `init_v1` - Initialize the fusion data account
  - `fusion_into_v1` - Fuse tokens into an asset
  - `fusion_from_v1` - Fuse an asset back into tokens
  - `update_v1` - Update fusion configuration
  - `set_authority_v1` - Transfer authority
  - `set_pause_v1` - Pause/unpause operations
  - `destroy_v1` - Destroy fusion data and withdraw funds

**Dependencies**:
- `anchor-lang` v0.30.1
- `anchor-spl` v0.30.1
- `mpl-core` v0.7.2 (Metaplex Core)

### 2. TypeScript Client (`packages/client/`)
A TypeScript SDK generated from the Anchor IDL using Kinobi, providing type-safe interfaces for interacting with the program.

**Features**:
- Type-safe instruction builders
- PDA derivation helpers
- UMI (Unified Metaplex Interface) integration
- Auto-generated from Anchor IDL

### 3. Demo Web Application (`packages/demo-app/`)
A Next.js web application demonstrating the fusion protocol.

**Tech Stack**:
- Next.js 14
- React 18
- Solana Wallet Adapter
- TanStack Query
- UMI for Solana interactions

### 4. CLI Tool (`src/cli.ts`)
A command-line interface for deploying and managing the fusion protocol.

**Commands**:
- `token deploy` - Deploy SPL token
- `collection deploy` - Deploy Metaplex collection
- `asset deploy` - Deploy asset
- `fusion init` - Initialize fusion protocol
- `fusion update` - Update fusion configuration
- `fusion pause` - Pause/unpause operations
- `fusion show` - Display fusion data
- `deploy` - Full deployment workflow

## Installation

### Prerequisites

- **Rust** (latest stable version)
- **Solana CLI** (v1.18+)
- **Anchor** (v0.30.1+)
- **Node.js** (v20+)
- **pnpm** (v9.7.1+)

### Setup

1. **Clone the repository**:
```bash
git clone <repository-url>
cd solana-token-fusion
```

2. **Install dependencies**:
```bash
pnpm install
```

3. **Build the Anchor program**:
```bash
anchor build
```

4. **Generate TypeScript client**:
```bash
pnpm generate
```

This command:
- Builds the Anchor IDL (`pnpm generate:idls`)
- Generates the TypeScript client from IDL (`pnpm generate:client`)
- Builds the client package (`pnpm build:client`)

## Usage

### Local Development

1. **Start a local Solana validator**:
```bash
anchor localnet
```

2. **Deploy the program**:
```bash
anchor deploy
```

3. **Run tests**:
```bash
pnpm test
```

### CLI Usage

#### Initialize Fusion Protocol

```bash
pnpm cli fusion init \
  --mint <TOKEN_MINT> \
  --collection <COLLECTION_MINT> \
  --supply <MAX_SUPPLY> \
  --index <START_INDEX> \
  --prefix "STF #" \
  --uri-prefix "https://meta.example.org/metadata/" \
  --escrow <ESCROW_AMOUNT> \
  --fee <FEE_AMOUNT> \
  --burn <BURN_AMOUNT> \
  --sol <SOL_FEE_AMOUNT> \
  --fee-recipient <FEE_RECIPIENT_ADDRESS> \
  --cluster localnet
```

#### Update Fusion Configuration

```bash
pnpm cli fusion update \
  --supply <NEW_MAX_SUPPLY> \
  --fee <NEW_FEE_AMOUNT> \
  --cluster localnet
```

#### Pause/Unpause Operations

```bash
# Pause
pnpm cli fusion pause --pause true --cluster localnet

# Unpause
pnpm cli fusion pause --pause false --cluster localnet
```

#### View Fusion Data

```bash
pnpm cli fusion show --cluster localnet
```

#### Full Deployment

```bash
pnpm cli deploy --cluster localnet
```

### Program Instructions

#### Initialize (`init_v1`)

Initializes the fusion data account with configuration for assets and fees.

**Parameters**:
- `asset_data`: Asset configuration (max supply, name prefix, URI templates)
- `fee_data`: Fee configuration (escrow amount, fees, burn amount, SOL fees)

**Accounts**:
- Fusion data PDA
- Authority PDA
- Collection update authority (signer)
- Payer (signer)
- Token mint
- Escrow ATA
- Collection account
- Required programs (Token, ATA, Core, System)

#### Fuse Into (`fusion_into_v1`)

Converts tokens into an asset. Tokens are transferred to escrow (with optional burn), and a new asset is minted.

**Process**:
1. Validate fusion is not paused
2. Transfer tokens to escrow (escrow amount)
3. Transfer fee tokens to fee recipient (if configured)
4. Burn tokens (if burn amount configured)
5. Collect SOL fee (if configured)
6. Mint new asset with generated name and URI
7. Increment next index

**Accounts**:
- Fusion data PDA
- Authority PDA
- User (signer)
- Asset signer (signer)
- Collection account
- Token mint
- Escrow ATA
- User ATA
- Fee recipient (optional)
- Fee recipient ATA (optional)
- Fee SOL account
- Required programs

#### Fuse From (`fusion_from_v1`)

Burns an asset and transfers tokens from escrow back to the user.

**Process**:
1. Validate fusion is not paused
2. Burn the asset
3. Transfer escrow amount from escrow to user
4. Decrement next index

**Accounts**:
- Fusion data PDA
- Authority PDA
- User (signer)
- Asset account (signer)
- Collection account
- Token mint
- Escrow ATA
- User ATA
- Fee SOL account
- Required programs

### Web Interface

1. **Start the development server**:
```bash
cd packages/demo-app
pnpm dev
```

2. **Open your browser**:
Navigate to `http://localhost:3000`

3. **Connect your wallet**:
Use the wallet adapter to connect a Solana wallet (Phantom, Solflare, etc.)

4. **Fuse tokens**:
- Go to the mint page (`/`)
- Enter the amount of tokens to fuse
- Click "Fuse" to create an asset

5. **Burn assets**:
- Go to the burn page (`/burn`)
- Select an asset to burn
- Click "Burn" to recover tokens

## Testing

Run the test suite:

```bash
pnpm test
```

Tests cover:
- Initialization
- Fusion into (tokens → asset)
- Fusion from (asset → tokens)
- Authority management
- Pause/unpause functionality
- Supply limits
- Fee handling
- Error cases

Enable debug logging:
```bash
DEBUG=true pnpm test
```

## Development

### Building

```bash
# Build Anchor program
anchor build

# Generate client
pnpm generate

# Build client package
pnpm --filter ./packages/client run build

# Build demo app
pnpm --filter ./packages/demo-app run build
```

### Code Generation

The TypeScript client is auto-generated from the Anchor IDL using Kinobi:

1. Build IDL: `anchor idl build -p token-fusion -o idls/token_fusion.json`
2. Generate client: `node ./config/kinobi.mjs`
3. Build client: `pnpm --filter ./packages/client run build`

Or use the convenience script:
```bash
pnpm generate
```

### Running Locally

1. Start local validator:
```bash
anchor localnet
```

2. Deploy program:
```bash
anchor deploy
```

3. Initialize fusion:
```bash
pnpm cli fusion init --cluster localnet [options]
```

4. Start web app:
```bash
cd packages/demo-app
pnpm dev
```
## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## Support

For issues and questions, please open an issue on GitHub.
