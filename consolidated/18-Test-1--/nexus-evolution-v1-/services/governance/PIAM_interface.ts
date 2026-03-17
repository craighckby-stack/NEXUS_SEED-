interface GFTReportV94 { /* (Reference schema definition) */ }

/**
 * Post-Mortem Integrity Assurance Module (PIAM) Interface
 * Responsible for terminal isolation, cryptographic sealing of state,
 * and broadcasting the final GFTR during SIH (TERMINAL) failure class events.
 */
export interface PIAM_Interface {
    /**
     * Initiates Terminal Isolation Sequence and prepares system for deep sleep/hibernation.
     * @param failureId report_id associated with the terminal event.
     * @returns True if isolation protocols were secured successfully.
     */
    isolateSystem(failureId: string): Promise<boolean>;

    /**
     * Finalizes the GFTR, signs it using the PIAM private key, and ensures broadcast across recovery channels.
     * This step guarantees non-repudiation of the terminal report.
     * @param report The completed GFTR structure.
     * @returns The cryptographically sealed report transmission status.
     */
    sealAndBroadcastReport(report: GFTReportV94): Promise<{ success: boolean; tx_id: string }>;

    /**
     * Triggers the S8+ Recovery Staging Environment lockdown.
     */
    lockdownRecoveryStaging(): Promise<void>;
}