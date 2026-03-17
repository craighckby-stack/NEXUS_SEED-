/**
 * High-Integrity Tool Kernel Interface for the Risk & Security Attestation Manager (RSAM).
 * This kernel is responsible for managing the pre-attestation lifecycle of governance mutation intents (e.g., M-01).
 * All concrete implementations must adhere to this asynchronous contract, adhering to the AIA Enforcement Layer mandates
 * for non-blocking operation within core governance components like the Governance Constraint Orchestrator Kernel.
 * 
 * @interface IRiskAttestationManagerToolKernel
 */
class IRiskAttestationManagerToolKernel {
    
    /**
     * Asynchronously registers an immutable policy intent package (e.g., M-01) 
     * for mandatory pre-attestation processing.
     * 
     * @param {Readonly<Object>} intentPackage - The immutable packaged mutation intent. Must adhere to PayloadSchemaRegistry/M-01 schema.
     * @returns {Promise<{attestationId: string, status: string}>} The initial attestation registration record summary.
     */
    async registerPolicyIntent(intentPackage) {
        // Enforce contract implementation
        throw new Error("IRiskAttestationManagerToolKernel::registerPolicyIntent must be implemented.");
    }

    /**
     * Asynchronously retrieves the current, detailed attestation status for a registered intent.
     * 
     * @param {string} attestationId - The unique ID returned during registration via registerPolicyIntent.
     * @returns {Promise<AttestationStatus>} A detailed status object, including compliance metrics and risk scores.
     */
    async getAttestationStatus(attestationId) {
        // Enforce contract implementation
        throw new Error("IRiskAttestationManagerToolKernel::getAttestationStatus must be implemented.");
    }
}

module.exports = IRiskAttestationManagerToolKernel;