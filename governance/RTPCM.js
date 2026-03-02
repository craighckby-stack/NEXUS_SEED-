// Risk/Trust Policy Dynamic Configuration Manager (RTPCM)
// ID: RTPCM
// Scope: Governance Policy Input Layer
// Mandate: Provides a verified, versioned API for setting and reading the constants and weighting factors that underpin the P-01 Trust Calculus (S-01 and S-02 calculations).

/**
 * RTPCM: Manages verified, versioned, deeply immutable policy configurations for the Trust Calculus (P-01).
 * Implements strict versioning via content hashing, internal timeline tracking, and atomic configuration updates.
 */
class RTPCM {
    /**
     * @param {Object} deps - Explicit dependencies for governance operations.
     * @param {LedgerService} deps.ledger - D-01/MCR dependency for audited transaction logging.
     * @param {ConfigValidator} deps.validator - The Governance Rule Configuration Module (GRCM) validation utility.
     * @param {HashUtility} deps.hasher - Utility for generating cryptographic hashes of configuration states.
     * @param {Object} deps.integrityService - Utility providing canonicalStringify and deepFreeze (now mandatory).
     * @param {Object} [initialConfig={}] - Optional initial configuration settings.
     */
    constructor({ ledger, validator, hasher, integrityService }, initialConfig = {}) {
        if (!ledger || !validator || !hasher || !integrityService) {
            throw new Error("RTPCM Initialization Error: Required dependencies (ledger, validator, hasher, integrityService) must be provided.");
        }
        
        // Critical safety checks for structural fidelity utilities.
        if (typeof integrityService.canonicalStringify !== 'function' || typeof integrityService.deepFreeze !== 'function') {
             throw new Error("RTPCM Initialization Error: integrityService must implement canonicalStringify and deepFreeze methods.");
        }

        // Dependencies
        this._ledger = ledger;
        this._validator = validator;
        this._hasher = hasher;
        this._integrityService = integrityService; // Renamed from _objectUtils

        // Internal State Management for Version Control and History
        this._configRegistry = new Map();   // Stores { versionId: deepFrozenConfig }
        this._activationTimeline = [];     // Tracks activation sequence: [{ versionId, timestamp, source, changeIndex }]
        this._activeVersionId = null;

        // Bootstrap: Register initial configuration if provided.
        if (Object.keys(initialConfig).length > 0) {
            try {
                // Initial registration must be explicitly sourced as BOOTSTRAP_V0
                this.registerNewVersion(initialConfig, 'BOOTSTRAP_V0');
            } catch (e) {
                // Critical failure if initial config cannot be loaded or validated.
                throw new Error(`RTPCM Initialization Failed (CRITICAL): Initial configuration rejected. Details: ${e.message}`);
            }
        }
    }

    /**
     * Internal validation against established GRS stability policies and schema.
     * @param {Object} config 
     * @returns {boolean}
     */
    validateNewConfig(config) {
        return this._validator.validate(config);
    }

    /**
     * Generates a deterministic, version-specific hash using canonical serialization.
     * @param {Object} config 
     * @returns {string} The configuration hash (version ID).
     * @throws {Error} If canonical serialization fails, compromising hash integrity.
     */
    calculateHash(config) {
        try {
            const serializedConfig = this._integrityService.canonicalStringify(config);
            return this._hasher.digest(serializedConfig);
        } catch (error) {
            throw new Error(`RTPCM Hashing Integrity Failure: Cannot perform canonical serialization. Error: ${error.message}`);
        }
    }

    /**
     * Registers a new configuration version, locking it (deep freeze), storing it historically, and logging.
     * @param {Object} newConfig - The proposed policy configuration.
     * @param {string} [source='API_CALL'] - Context/source of the update.
     * @returns {{versionId: string, config: Object, isNew: boolean}}
     * @throws {Error} If configuration validation or canonicalization fails.
     */
    registerNewVersion(newConfig, source = 'API_CALL') {
        if (!this.validateNewConfig(newConfig)) {
            throw new Error("RTPCM_GOV_ERROR: Configuration validation failed against Governance Rules Schema.");
        }
        
        const configHash = this.calculateHash(newConfig);

        // Check for existing version (deduplication)
        const isNewVersion = !this._configRegistry.has(configHash);
        
        if (!isNewVersion) {
            // Skip registration if content is identical to an existing version.
            return { versionId: configHash, config: this._configRegistry.get(configHash), isNew: false };
        }

        // 1. Enforce Deep Immutability using the guaranteed service.
        const frozenConfig = this._integrityService.deepFreeze(newConfig);

        this._configRegistry.set(configHash, frozenConfig);
        
        // 2. Activation and Timeline Update
        this._activeVersionId = configHash;
        const activationRecord = {
            versionId: configHash,
            timestamp: Date.now(),
            source: source,
            changeIndex: this._activationTimeline.length + 1 // Use 1-based index for logging clarity
        };
        this._activationTimeline.push(activationRecord);
        
        // 3. Auditing via Ledger
        this._ledger.logTransaction('RTPCM_CONFIG_ACTIVATION', {
            ...activationRecord,
            details: `P-01 Trust Calculus parameters version ${configHash.substring(0, 8)} activated.`,
        });
        
        return { versionId: configHash, config: frozenConfig, isNew: true };
    }

    /**
     * Retrieves the currently active configuration, packaged with its version identifier.
     * @returns {{versionId: string|null, config: Object|null}}
     */
    getActiveConfig() {
        if (!this._activeVersionId) {
            // Return defined structure in zero-state
            return { versionId: null, config: null }; 
        }

        const config = this._configRegistry.get(this._activeVersionId);

        // Fail-safe check: configuration must exist if ID is set.
        if (!config) {
             throw new Error("RTPCM State Integrity Error: Active version ID exists but configuration is missing from registry.");
        }

        return { versionId: this._activeVersionId, config };
    }

    /**
     * Retrieves a specific historical configuration version by its hash ID.
     * @param {string} versionId - The hash of the desired configuration.
     * @returns {Object|null} The immutable configuration object, or null if not found locally.
     */
    getHistoricalConfig(versionId) {
        return this._configRegistry.get(versionId) || null;
    }

    /**
     * Retrieves the chronological timeline of configuration activations.
     * @returns {ReadonlyArray<Object>} Returns a deeply frozen timeline array.
     */
    getActivationTimeline() {
        // Deep freeze the array copy to prevent external mutation of the history records.
        return this._integrityService.deepFreeze([...this._activationTimeline]);
    }

    /**
     * Exposed accessor for the ID of the currently active configuration.
     * @returns {string|null}
     */
    getActiveVersionId() {
        return this._activeVersionId;
    }
}

module.exports = RTPCM;