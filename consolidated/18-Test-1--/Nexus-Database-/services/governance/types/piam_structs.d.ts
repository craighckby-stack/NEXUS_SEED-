/**
 * Standardized data structures for PIAM (Post-Mortem Integrity Assurance Module).
 */

/**
 * General Failure Termination Report (GFTR) V94 Schema.
 * Used for documenting terminal SIH events.
 */
export interface GFTReportV94 {
    report_id: string;
    timestamp: number;
    system_version: string;
    sealed_state_hash: string;
    // Placeholder for required extensive forensic fields...
}

/**
 * Receipt confirming successful execution environment state sealing.
 * Critical for establishing forensic chain-of-custody.
 */
export interface PIAMSealingReceipt {
    state_hash: string;
    sealing_key_id: string;
    sealing_timestamp: number;
    integrity_check_nonce: string;
}