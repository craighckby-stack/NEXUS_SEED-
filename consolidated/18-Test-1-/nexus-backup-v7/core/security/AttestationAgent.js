const Interface = require('../TEE_Interface');
const Cryptographer = require('../../utility/CryptoService');

const MODULE_ID = "SIVM_V2";
const CONFIG_KEY = "SIVM_EKEY_1";

/**
 * Configuration abstraction: Retrieves the necessary endpoint parameters.
 * @returns {{url: string, key: string}} Attestation destination configuration.
 */
const getAttestationConfig = () => {
    // O(1) synchronous lookup
    return Interface.getEndpoint(CONFIG_KEY);
};

/**
 * Precondition check: Ensures the environment meets minimum security requirements.
 * @throws {Error} If the system is not in a secure state.
 */
const validateSecureContext = () => {
    if (!Interface.isSecureState()) {
        throw new Error("Security context violation: Attestation aborted.");
    }
};

/**
 * Phase 1: Generation of the immutable data package (The Pledge).
 * Collects sealed evidence and failure metadata.
 */
const generateImmutablePledge = async (failureData) => {
    const sealedEvidence = await Interface.collectSealedEvidence();
    return {
        timestamp: Interface.getSecureTime(),
        module_id: MODULE_ID,
        failure_data: failureData,
        immutable_evidence: sealedEvidence
    };
};

/**
 * Phase 2: Sealing the Pledge (Encryption).
 * Encrypts the manifest using AES-256-GCM via the derived key.
 */
const sealManifest = async (pledge, destinationKey) => {
    const packageString = JSON.stringify(pledge);
    return Cryptographer.encryptData(packageString, destinationKey);
};

/**
 * Phase 3: Secure Audit Transmission.
 * Transmits the sealed package out-of-band.
 */
const transmitAuditReport = (destinationUrl, encryptedManifest) => {
    return Interface.transmitSecurely(destinationUrl, encryptedManifest);
};

/**
 * Attestation Workflow Orchestrator.
 * Executes the Secure Remote Attestation Pipeline (SRAA) as a compositional flow.
 * @param {object} failureStateData - Data describing the system failure state.
 * @returns {Promise<boolean>} True if the transmission pipeline completed successfully.
 */
async function runAttestation(failureStateData) {
    try {
        // Abstract Stage 1: Pre-flight and Configuration
        validateSecureContext();
        const config = getAttestationConfig();

        // Abstract Stage 2: Evidence Collection and Packaging (Pledge)
        const pledge = await generateImmutablePledge(failureStateData);

        // Abstract Stage 3: Computation and Sealing (Manifest)
        const encryptedManifest = await sealManifest(pledge, config.key);

        // Abstract Stage 4: Secure Transmission (Audit)
        return await transmitAuditReport(config.url, encryptedManifest);

    } catch (e) {
        // Optimization: Fail fast if preconditions or async operations fail.
        return false;
    }
}

module.exports = {
    runAttestation
};