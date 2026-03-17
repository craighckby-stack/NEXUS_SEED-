/**
 * CIL_BlockQuery_Interface (CIL-BQI)
 * Version: V3.0 (Structural Integrity and Read-Only Commitment enforcement)
 * Responsible Subsystems: GSEP, AICV
 * Description: Defines the high-speed, cryptographically certified interface for retrieving 
 * immutable constraint blocks from the Constraint Integrity Ledger (CIL).
 *
 * NOTE: Requires ./errors/CIL_QueryErrors.ts for structured exception handling.
 */

/** Enumeration of Governance Change Vectors */
export type CIL_EventTrigger = 
    | 'SCHEMA_EVOLUTION' 
    | 'THRESHOLD_TUNING' 
    | 'CALCULUS_AMENDMENT' 
    | 'STATE_TRANSITION'
    | 'HOTFIX_APPLIED';

/** Defines the expected structure of the verifiable governance content payload. */
export interface CIL_ContentPayload {
    readonly schemas: Readonly<Record<string, string | object>>;       // Definitions required for state validation (e.g., JSON Schemas)
    readonly thresholds: Readonly<Record<string, number | string>>;    // Operational bounds and limits
    readonly formulae: Readonly<Record<string, string>>;               // Constraint calculus and derived functions (e.g., DSL snippets)
}

export interface CILBlockMetadata {
    readonly blockNumber: number;
    readonly rootContentHash: string;      // SHA3-512 cryptographic commitment hex string
    readonly timestampNanoUtc: string;     // High-precision time reference (Standardized large integer string)
    readonly eventTrigger: CIL_EventTrigger; 
    readonly aiaEpochRef: string;          // Reference ID to the Active Integrity Assurance Epoch
}

export interface CertifiedCILBlock extends CILBlockMetadata {
    readonly contentPayload: CIL_ContentPayload; 
    
    // Cryptographic Proofs for Non-Repudiation and L3/L4 validation
    readonly aicvCertificateChain: string; // AI Constraint Validation proof chain (e.g., PEM/DER encoded)
    readonly scrSnapshotMerkleRoot: string; // Merkle root hash of the supporting State Constraint Repository snapshot
}

/**
 * Interface for querying immutable, certified Constraint Integrity Ledger blocks.
 */
export interface CIL_BlockQuery_Interface {

  /**
   * Retrieves a certified block based on the specific governance commitment identifier (UUIDv4).
   * Essential for auditing and non-repudiation queries.
   * @param commitmentId UUIDv4 identifying the governance event/transaction.
   * @returns A promise resolving to the immutable CertifiedCILBlock.
   * @throws CILNotFoundError | CILIntegrityError
   */
  queryByCommitmentID(commitmentId: string): Promise<CertifiedCILBlock>;

  /**
   * Retrieves the constraint block that defined the effective state during a specific AIA Epoch.
   * @param aiaEpochRef The reference ID to the Active Integrity Assurance index.
   * @returns A promise resolving to the immutable CertifiedCILBlock.
   * @throws CILNotFoundError
   */
  queryEffectiveByAIA(aiaEpochRef: string): Promise<CertifiedCILBlock>;

  /**
   * Verifies the authenticity and non-repudiation anchor of a locally derived content hash 
   * against the ledger without transmitting the full payload.
   * @param blockNumber The expected ledger index.
   * @param rootHash Local SHA3-512 hash of constraints utilized.
   * @returns A promise resolving to confirmed CILBlockMetadata.
   * @throws CILMismatchError | CILBlockIntegrityViolation
   */
  verifyHashAnchor(blockNumber: number, rootHash: string): Promise<CILBlockMetadata>;

  /**
   * Fetches the latest committed CertifiedCILBlock in the ledger.
   * Essential for rapid runtime bootstrap and state synchronization.
   * @returns A promise resolving to the immutable CertifiedCILBlock.
   */
  queryLatestBlock(): Promise<CertifiedCILBlock>;
}