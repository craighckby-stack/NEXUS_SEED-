/**
 * Standardized data structures for PIAM (Post-Mortem Integrity Assurance Module).
 * 
 * NOTE: Generic sealing receipt structures have been abstracted to the IntegrityReceipts plugin.
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