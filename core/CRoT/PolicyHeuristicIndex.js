const crypto = require('crypto');
const DeepNormalizer = require('../../utils/object/DeepNormalizer'); 
const GAXTelemetry = require('../../core/Telemetry/GAXTelemetryService.js');
const { ICRoTIndexClient } = require('./CRoTIndexClientInterface'); // Dependency Injection Type Enforcement

/**
 * PolicyHeuristicIndex
 * Manages the generation of stable, structure-based policy fingerprints (SHA-256)
 * and utilizes an injected CRoT Index Client (must conform to ICRoTIndexClient) 
 * for efficient historical lookups of Axiomatic Consistency Validation (ACV) anchors.
 */
class PolicyHeuristicIndex {

    static TELEMETRY_PREFIX = 'CRoT.PHI';

    /** @type {ICRoTIndexClient} */
    indexClient;

    /**
     * @param {ICRoTIndexClient} indexClient - An instance of a CRoT index client conforming to the interface.
     */
    constructor(indexClient) {
        // Enhanced validation leveraging knowledge of the proposed interface contract
        if (!indexClient || typeof indexClient.getAnchorsByFingerprint !== 'function' || typeof indexClient.indexCommit !== 'function') {
            throw new Error("PolicyHeuristicIndex requires a valid CRoT Index Client instance implementing getAnchorsByFingerprint and indexCommit.");
        }
        this.indexClient = indexClient;
        GAXTelemetry.system(`${PolicyHeuristicIndex.TELEMETRY_PREFIX}.INIT`, { component: 'PolicyHeuristicIndex' });
    }

    /**
     * Generates a stable cryptographic fingerprint for a proposed PolicyDelta.
     * This is a pure, static computation based on the content structure, independent of the index state.
     * 
     * @param {object} policyDelta - The PolicyDelta input object (must be serializable).
     * @returns {string} SHA-256 hash of the normalized JSON string (64 characters).
     */
    static generateFingerprint(policyDelta) {
        const normalizedData = DeepNormalizer.stableStringify(policyDelta);
        
        return crypto.createHash('sha256')
                     .update(normalizedData)
                     .digest('hex');
    }

    /**
     * Queries the CRoT index using the policy fingerprint to retrieve relevant 
     * historical ACV IDs (Anchors) using the injected client.
     * 
     * @param {string} fingerprint - Policy hash derived from generateFingerprint.
     * @returns {Promise<string[]>} List of high-relevance ACV transaction IDs.
     */
    async getRelevantAnchorIDs(fingerprint) {
        if (typeof fingerprint !== 'string' || fingerprint.length !== 64) {
             GAXTelemetry.warn(`${PolicyHeuristicIndex.TELEMETRY_PREFIX}.INVALID_FINGERPRINT_REQUEST`);
             return [];
        }
        
        const shortFingerprint = fingerprint.substring(0, 8);
        GAXTelemetry.debug(`${PolicyHeuristicIndex.TELEMETRY_PREFIX}.QUERY_START`, { hash: shortFingerprint });

        try {
            const anchors = await this.indexClient.getAnchorsByFingerprint(fingerprint);
            GAXTelemetry.debug(`${PolicyHeuristicIndex.TELEMETRY_PREFIX}.QUERY_SUCCESS`, { hash: shortFingerprint, count: anchors.length });
            return anchors;
        } catch (error) {
             GAXTelemetry.error(`${PolicyHeuristicIndex.TELEMETRY_PREFIX}.QUERY_FAILURE`, { hash: shortFingerprint, error: error.message });
             // Throwing ensures downstream logic handles the inability to fetch anchors.
             throw new Error(`CRoT Index Query failed for fingerprint ${shortFingerprint}: ${error.message}`);
        }
    }

    /**
     * Indexes a new successful ACV transaction after it is committed.
     * 
     * @param {string} txId - The successful ACV transaction ID.
     * @param {object} policyDelta - The PolicyDelta that was committed.
     * @returns {Promise<void>} 
     */
    async indexPolicyChange(txId, policyDelta) {
        const fingerprint = PolicyHeuristicIndex.generateFingerprint(policyDelta);
        const shortFingerprint = fingerprint.substring(0, 8);
        
        GAXTelemetry.publish(`${PolicyHeuristicIndex.TELEMETRY_PREFIX}.INDEX_COMMIT_REQUEST`, { 
            txId,
            hash: shortFingerprint
        });
        
        try {
            // Delegate persistence logic to the injected client.
            await this.indexClient.indexCommit(fingerprint, txId);
            GAXTelemetry.publish(`${PolicyHeuristicIndex.TELEMETRY_PREFIX}.INDEX_COMMIT_SUCCESS`, { hash: shortFingerprint });
        } catch (error) {
             GAXTelemetry.critical(`${PolicyHeuristicIndex.TELEMETRY_PREFIX}.INDEX_COMMIT_FAILURE`, { hash: shortFingerprint, txId, error: error.message });
             // Indexing failure is critical for CRoT, so re-throw.
             throw new Error(`CRoT Index Commit failed for TX ${txId}: ${error.message}`);
        }
    }
}

module.exports = { PolicyHeuristicIndex };
