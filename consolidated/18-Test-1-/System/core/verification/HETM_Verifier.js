const { LogIntegrityService } = require('../persistence/LogIntegrityService');

class HETMVerifierError extends Error {
    /**
     * @param {string} message 
     * @param {string} errorCode 
     */
    constructor(message, errorCode = "VERIFY_E_000") {
        super(message);
        this.name = 'HETMVerifierError';
        this.errorCode = errorCode;
        // Maintain error chain for logging
        if (typeof Error.captureStackTrace === 'function') {
            Error.captureStackTrace(this, HETMVerifierError);
        }
    }
}

class HETMVerifier {
    /**
     * Validates the host environment against the policy defined in the HETM manifest.
     * Utilizes fail-fast principles.
     */
    static REQUIRED_FIELDS = [
        "attestation_signature", 
        "required_platform_measurement", 
        "minimal_os_integrity_level", 
        "required_enclave_features", 
        "audit_log_endpoint"
    ];

    /**
     * @param {Object<string, any>} manifestData
     */
    constructor(manifestData) {
        this.manifest = manifestData;
        this._validateManifestStructure();
    }
        
    /**
     * Ensures all mandatory keys exist before verification starts (VERIFY_E_1XX).
     * @private
     */
    _validateManifestStructure() {
        const missingKeys = HETMVerifier.REQUIRED_FIELDS.filter(
            field => !(field in this.manifest)
        );

        if (missingKeys.length > 0) {
            throw new HETMVerifierError(
                `Manifest is structurally invalid. Missing fields: ${missingKeys.join(', ')}`,
                "VERIFY_E_100"
            );
        }
    }

    /**
     * Verifies the CRoT attestation signature against the manifest payload (VERIFY_E_2XX).
     * @private
     * @async
     */
    async _verifySignature() {
        const signature = this.manifest.attestation_signature;
        // Implementation relies on GACR.crypto.CRA (GACR Cryptographic Root of Trust Access)
        
        // --- [CRA STUB] ---
        if (!signature || typeof signature !== 'string' || signature.length < 64) {
             throw new HETMVerifierError("Invalid or malformed attestation signature.", "VERIFY_E_200");
        }
        // Future implementation: await GACR.crypto.CRA.verify(...) 
        // --- [CRA STUB END] ---
    }

    /**
     * Gathers real-time measurement (e.g., TPM PCR state) via HIPA.
     * @returns {Promise<string>}
     * @private
     * @async
     */
    async _getCurrentPlatformMeasurement() {
        // Implementation relies on GACR.hardware.HIPA (Hardware Isolation & Platform Access)
        // --- [HIPA STUB] ---
        // return GACR.hardware.HIPA.getPlatformMeasurement();
        return "a3b4c5d6e7f8a3b4c5d6e7f8a3b4c5d6e7f8a3b4c5d6e7f8a3b4c5d6e7f8a3b4c5d6e7f8a3b4c5d6e7f8a3b4c5d6e7f8";
        // --- [HIPA STUB END] ---
    }

    /**
     * Compares required platform measurement against real-time measurement (VERIFY_E_3XX).
     * @private
     * @async
     */
    async _verifyPlatformState() {
        const requiredMeasurement = String(this.manifest.required_platform_measurement).toLowerCase();
        const currentMeasurement = String(await this._getCurrentPlatformMeasurement()).toLowerCase();

        if (currentMeasurement !== requiredMeasurement) {
            // Truncate hashes for cleaner logging output during secure panic reporting
            throw new HETMVerifierError(
                `Platform measurement mismatch. Required Hash: ${requiredMeasurement.substring(0, 16)}..., Found Hash: ${currentMeasurement.substring(0, 16)}...`,
                "VERIFY_E_301"
            );
        }
    }
        
    /**
     * Checks if required features and minimal OS integrity levels are met (VERIFY_E_4XX).
     * @private
     * @async
     */
    async _verifyFeaturesAndLevels() {
        /** @type {Array<string>} */
        const requiredFeatures = this.manifest.required_enclave_features;
        const minIntegrityLevel = this.manifest.minimal_os_integrity_level;
        
        // Feature and Level checks rely on HIPA/OS queries
        
        // --- [HIPA/OS STUB] ---
        if (minIntegrityLevel < 1 || minIntegrityLevel > 10) {
             throw new HETMVerifierError(
                `Required OS integrity level (${minIntegrityLevel}) is outside defined policy bounds (1-10).`,
                "VERIFY_E_401"
            );
        }
        
        // Future implementation: if (!(await GACR.hardware.HIPA.hasFeatures(requiredFeatures))) ...
        // --- [HIPA/OS STUB END] ---
    }

    /**
     * Verifies essential network connectivity for security components (VERIFY_E_5XX).
     * @private
     * @async
     */
    async _verifyConnectivity() {
        const auditEndpoint = this.manifest.audit_log_endpoint;
        
        // Implementation relies on GACR.net.NetSec
        
        // --- [NetSec STUB] ---
        // if (!(await GACR.net.NetSec.verifyEndpointReachability(auditEndpoint, 5))) ...
        
        if (!auditEndpoint.startsWith("https://") && !auditEndpoint.startsWith("tcp://")) {
            throw new HETMVerifierError(`Audit log endpoint uses insecure schema: ${auditEndpoint}`, "VERIFY_E_502");
        }
        // --- [NetSec STUB END] ---
    }


    /**
     * Executes sequential, fail-fast integrity checks.
     * @returns {Promise<boolean>} True if integrity is verified, False otherwise.
     */
    async checkIntegrity() {
        try {
            // 1. Verification of Policy Source Integrity
            await this._verifySignature();
            
            // 2. Verification of Platform Integrity (Hardware Root of Trust)
            await this._verifyPlatformState();
            
            // 3. Verification of System Policy Compliance (Features & Levels)
            await this._verifyFeaturesAndLevels();
            
            // 4. Verification of Operational Security Posture (Network Control)
            await this._verifyConnectivity();
            
            return true;
            
        } catch (e) {
            if (e instanceof HETMVerifierError) {
                // Log critical failure and trigger secure panic state (S0 environment specific).
                LogIntegrityService.recordVerificationFailure(
                    'HETM',
                    e.errorCode,
                    e.message
                );
                // Trigger System Panic 
                return false;
            }
            throw e; // Re-throw unexpected errors
        }
    }
}

module.exports = { 
    HETMVerifier,
    HETMVerifierError 
};