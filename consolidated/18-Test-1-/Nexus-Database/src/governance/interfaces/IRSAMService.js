/**
 * Interface definition for the Risk & Security Attestation Manager (RSAM).
 * All concrete RSAM implementations must adhere to this asynchronous contract 
 * to ensure non-blocking operation of the Governance Constraint Orchestrator (GCO).
 */
class IRSAMService {
    
    /**
     * Asynchronously registers a policy intent package (e.g., M-01) 
     * for mandatory pre-attestation processing.
     * @param {IntentPackage} intentPackage - The packaged mutation intent.
     * @returns {Promise<{attestationId: string, status: string}>} Registration confirmation.
     */
    async registerPolicyIntent(intentPackage) {
        throw new Error("Method 'registerPolicyIntent()' must be implemented.");
    }

    /**
     * Asynchronously retrieves the current attestation status for a registered intent.
     * @param {string} intentId
     * @returns {Promise<AttestationStatus>} 
     */
    async getAttestationStatus(intentId) {
        throw new Error("Method 'getAttestationStatus()' must be implemented.");
    }
}

module.exports = IRSAMService;