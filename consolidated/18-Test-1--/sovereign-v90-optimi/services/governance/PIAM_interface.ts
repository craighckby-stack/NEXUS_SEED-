import { SealingReceipt } from "#plugin:IntegrityCoreTypes";

interface GFTReportV94 {
    report_id: string;
    timestamp: number;
    // ... extensive forensic data specific to V94 terminal failure
}

/**
 * Post-Mortem Integrity Assurance Module (PIAM) Interface Kernel
 * Responsible for integrity sealing of terminal state, complete system isolation,
 * cryptographic signing and robust broadcasting of the final GFTR during 
 * SIH (TERMINAL) failure class events.
 */
export interface PIAMInterfaceKernel {

    /**
     * Executes deep forensic state capture and cryptographically seals the terminal 
     * execution environment state (memory, registers, filesystem snapshot). 
     * This is the critical first step for forensic integrity assurance.
     * @param failureId report_id associated with the terminal event.
     * @returns A receipt confirming the successful sealing operation, including the state hash.
     */
    captureAndSealTerminalState(failureId: string): Promise<SealingReceipt>;

    /**
     * Initiates the Physical/Logical Terminal Isolation Sequence. This renders the
     * active execution environment immutable and prepares for hibernation/deep sleep.
     * Requires the hash of the sealed state (data_hash) to ensure isolation is chained to integrity validation.
     * @param stateSealHash The hash of the sealed state package, linking isolation to integrity.
     * @returns True if isolation protocols were secured successfully.
     */
    initiateIsolationSequence(stateSealHash: string): Promise<boolean>;

    /**
     * Finalizes the GFTR using data derived from the sealed state, signs it using the 
     * module's private key, and ensures resilient broadcast across specified recovery channels.
     * Guarantees non-repudiation of the terminal report.
     * @param report The completed GFTR structure.
     * @returns Transmission confirmation status.
     */
    sealAndBroadcastReport(report: GFTReportV94): Promise<{ success: boolean; tx_id: string }>;

    /**
     * Triggers the S8+ Recovery Staging Environment lockdown to prevent premature or unauthorized access
     * until post-mortem clearance is granted.
     */
    lockdownRecoveryStaging(): Promise<void>;
}