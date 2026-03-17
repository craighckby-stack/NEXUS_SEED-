/**
 * OVERSIGHT PARAMETER REGISTRY (OPR)
 * Manages the canonical set of governance parameters tied to a specific system state hash.
 * Parameters loaded are treated as immutable for the operational context derived from the hash.
 */
class OversightParameterRegistry {
    /**
     * @param {MutationChainRegistrar} mcr - Source of truth for parameter histories and commitment proofs.
     * @param {SystemStateVerifier} ssv - Ensures data integrity using cryptographic checks.
     * @param {Object} config - Configuration object containing governance constraints.
     * @param {string[]} config.criticalKeys - List of governance keys that require GSEP validation.
     */
    constructor(mcr, ssv, config) {
        this.mcr = mcr;
        this.ssv = ssv;

        // Use a Set for highly efficient lookups (O(1)) of critical keys.
        this.criticalKeys = new Set(config.criticalKeys || []);
        this.parameters = new Map();
        this.currentStateHash = null;
    }

    /**
     * Loads, verifies, and applies the parameter set corresponding to the provided system state hash.
     * This state is treated as immutable for the current operational cycle.
     * @param {string} versionHash - The cryptographic hash identifying the system state.
     * @returns {Promise<Map<string, *>>} The loaded parameters map.
     */
    async loadState(versionHash) {
        if (!versionHash || typeof versionHash !== 'string') {
             throw new Error("OPR_LOAD_ERROR: Invalid version hash provided.");
        }

        // 1. Fetch data payload from the MCR storage backend.
        const rawData = await this._fetchPayload(versionHash);

        // 2. Integrity Verification (SSV confirms data matches hash proof).
        this.ssv.verifyIntegrity(versionHash, rawData);

        // 3. Application
        this.parameters = new Map(Object.entries(rawData));
        this.currentStateHash = versionHash;

        return this.parameters;
    }

    /**
     * Retrieves a parameter value.
     * @param {string} key - The parameter identifier.
     * @param {*} [defaultValue=undefined] - Value returned if the key is not found.
     */
    get(key, defaultValue = undefined) {
        if (!this.parameters.has(key)) {
            if (this.criticalKeys.has(key)) {
                // Critical key requested but missing in the loaded state. High alert.
                console.error(`OPR_INTEGRITY_ALERT: Critical key '${key}' missing in state ${this.currentStateHash}.
                                This indicates a potentially corrupted or incomplete state load. Falling back to default.`);
            }
            return defaultValue;
        }
        return this.parameters.get(key);
    }

    /**
     * Proposes a new parameter set change.
     * This method does NOT mutate the currently loaded state but delegates the mutation and consensus
     * process (GSEP Stage 1/2) to the MCR, resulting in a new immutable state/hash.
     * @param {string} key - Parameter key.
     * @param {*} value - Proposed new value.
     */
    proposeUpdate(key, value) {
        if (!this.criticalKeys.has(key)) {
            throw new Error(`OPR_PROPOSAL_ERROR: Key ${key} is not registered as a governance-critical parameter requiring GSEP validation.`);
        }

        // MCR handles GSEP consensus and subsequent chain commitment.
        this.mcr.proposeParameterChange(this.currentStateHash, key, value);
        console.log(`Update proposal registered for ${key}. Awaiting MCR/GSEP resolution.`);
    }

    /**
     * Placeholder for secure data fetching logic (from MCR or associated storage layer).
     * @param {string} hash
     * @returns {Promise<Object>} Raw parameter object.
     */
    async _fetchPayload(hash) {
        // Simulated MCR interaction involving secure deserialization and verification.
        // In reality, this requires I/O.
        await new Promise(resolve => setTimeout(resolve, 5)); // Simulate minimal network latency
        return {
            'P01_RISK_FLOOR': 0.75, // Critical
            'MAX_ENTROPY_DEBT': 100, // Critical
            'SANDBOX_TIMEOUT_MS': 5000, // Critical
            'L03_LOGGING_LEVEL': 'INFO' // Example of a non-critical parameter (ignored by proposeUpdate)
        };
    }
}

module.exports = OversightParameterRegistry;