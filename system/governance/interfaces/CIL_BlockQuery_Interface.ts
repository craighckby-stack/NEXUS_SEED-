/**
 * CIL_BlockQuery_Interface (CIL-BQI)
 * Version: V2.0 (Refactored for efficiency and structural typing)
 * Responsible Subsystems: GSEP, AICV
 * Description: Defines the high-speed, cryptographically certified interface for retrieving 
 * constraint blocks from the Constraint Integrity Ledger (CIL).
 * 
 * NOTE: Requires CIL_QueryErrors.ts for structured exception handling (e.g., CILNotFoundError).
 */

/** Enumeration of Governance Change Vectors */
export type CIL_EventTrigger = 
    | 'SCHEMA_EVOLUTION' 
    | 'THRESHOLD_TUNING' 
    | 'CALCULUS_AMENDMENT' 
    | 'STATE_TRANSITION'
    | 'HOTFIX_APPLIED'; // Added for critical, immediate constraint deployment.

/** Defines the expected structure of the verifiable governance content payload. */
export interface CIL_ContentPayload {
    schemas: Record<string, string | object>;       // Definitions required for state validation
    thresholds: Record<string, number | string>;    // Operational bounds and limits
    formulae: Record<string, string>;               // Constraint calculus and derived functions
}

export interface CILBlockMetadata {
    blockNumber: number;
    rootContentHash: string;      // SHA3-512 cryptographic commitment
    timestampNanoUtc: string;     // High-precision time reference (ISO or large int)
    eventTrigger: CIL_EventTrigger; 
    aiaEpochRef: string;          // Reference ID to the Active Integrity Assurance Epoch
}

export interface CertifiedCILBlock extends CILBlockMetadata {
    contentPayload: CIL_ContentPayload; 
    
    // Cryptographic Proofs for Non-Repudiation and L3/L4 validation
    aicvCertificateChain: string; // AI Constraint Validation proof chain
    scrSnapshotMerkleRoot: string; // Merkle root hash of the supporting State Constraint Repository snapshot
}

export interface CIL_BlockQuery_Interface {

  /**
   * Retrieves a certified block based on the specific governance commitment identifier.
   * Essential for auditing and non-repudiation queries.
   * @param commitmentId UUIDv4 identifying the governance event/transaction.
   * @returns Promise<CertifiedCILBlock>
   * @throws CILNotFoundError | CILIntegrityError
   */
  queryByCommitmentID(commitmentId: string): Promise<CertifiedCILBlock>;

  /**
   * Retrieves the constraint block that defined the effective state during a specific AIA Epoch.
   * @param aiaEpochRef The reference ID to the Active Integrity Assurance index.
   * @returns Promise<CertifiedCILBlock>
   * @throws CILNotFoundError
   */
  queryEffectiveByAIA(aiaEpochRef: string): Promise<CertifiedCILBlock>;

  /**
   * Verifies the authenticity and non-repudiation anchor of a locally derived content hash.
   * Used for rapid integrity checks during runtime initialization.
   * @param blockNumber The expected ledger index.
   * @param rootHash Local SHA3-512 hash of constraints utilized.
   * @returns Promise<CILBlockMetadata> (Confirms integrity without transferring payload)
   * @throws CILMismatchError | CILBlockIntegrityViolation
   */
  verifyHashAnchor(blockNumber: number, rootHash: string): Promise<CILBlockMetadata>;
}