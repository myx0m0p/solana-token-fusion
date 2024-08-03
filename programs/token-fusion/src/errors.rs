use anchor_lang::error_code;

#[error_code]
pub enum FusionError {
    #[msg("Account does not have correct owner")]
    IncorrectOwner,

    #[msg("Account is not initialized")]
    Uninitialized,

    #[msg("Mint Mismatch")]
    MintMismatch,

    #[msg("Index greater than length")]
    IndexGreaterThanLength,

    #[msg("Numerical overflow error")]
    NumericalOverflowError,

    #[msg("Can only provide up to 4 creators")]
    TooManyCreators,

    #[msg("Incorrect collection NFT authority")]
    IncorrectCollectionAuthority,

    #[msg("The metadata account has data in it, and this must be empty to mint a new NFT")]
    MetadataAccountMustBeEmpty,

    #[msg("Value longer than expected maximum value")]
    ExceededLengthError,

    #[msg("Next asset index should be gt 0")]
    InvalidNextAssetIndex,

    #[msg("Collection public key mismatch")]
    CollectionKeyMismatch,

    #[msg("Token public key mismatch")]
    TokenKeyMismatch,

    #[msg("Instruction could not be created")]
    InstructionBuilderFailed,

    #[msg("Missing collection authority record")]
    MissingCollectionAuthorityRecord,

    #[msg("Missing metadata delegate record")]
    MissingMetadataDelegateRecord,

    #[msg("Invalid token standard")]
    InvalidTokenStandard,

    #[msg("Missing token account")]
    MissingTokenAccount,

    #[msg("Missing token record")]
    MissingTokenRecord,

    #[msg("Missing instructions sysvar account")]
    MissingInstructionsSysvar,

    #[msg("Missing SPL ATA program")]
    MissingSplAtaProgram,

    #[msg("Incorrect collection mint")]
    IncorrectCollectionMint,

    #[msg("Missing collection mint metadata")]
    MissingCollectionMint,

    #[msg("The metadata account is empty")]
    MetadataAccountIsEmpty,

    #[msg("Fusion paused")]
    FusionPaused,

    #[msg("Invalid token amounts")]
    InvalidTokenAmounts,

    #[msg("Max supply reached")]
    MaxSupplyReached,

    #[msg("Invalid protocol fee wallet")]
    InvalidProtocolFeeWallet,
}
