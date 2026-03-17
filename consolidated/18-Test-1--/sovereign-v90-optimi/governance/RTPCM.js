// Risk/Trust Policy Dynamic Configuration Manager (RTPCM)
// ID: RTPCM
// Scope: Governance Policy Input Layer
// Mandate: Provides a verified, versioned API for setting and reading the constants and weighting factors that underpin the P-01 Trust Calculus (S-01 and S-02 calculations).

/**
 * RTPCM: Manages verified, versioned, deeply immutable policy configurations for the Trust Calculus (P-01).
 * Implements strict versioning via content hashing, internal timeline tracking, and atomic configuration updates.
 */
class RTPCM {
    #ledger;
    #validator;
    #registry;

    /**
     * @param {Object} deps - Explicit dependencies for governance operations.
     * @param {LedgerService} deps.ledger - D-01/MCR dependency for audited transaction logging.
     * @param {ConfigValidator} deps.validator - The Governance Rule Configuration Module (GRCM) validation utility.
     * @param {HashUtility} deps.hasher - Utility for generating cryptographic hashes of configuration states.
     * @param {Object} deps.integrityServiceTool - Utility providing canonicalStringify and deepFreeze.
     * @param {ImmutableConfigRegistry} [deps.registry] - Optional dependency injection of the registry plugin for testing/override.
     * @param {Object} [initialConfig={}] - Optional initial configuration settings.
     */
    constructor(deps, initialConfig = {}) {
        this.#setupDependencies(deps);

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
     * Extracts synchronous dependency resolution and initialization.
     * @param {Object} deps
     */
    #setupDependencies(deps) {
        const { ledger, validator, hasher, integrityServiceTool, registry } = deps;
        
        if (!ledger || !validator || !hasher || !integrityServiceTool) {
            throw new Error("RTPCM Initialization Error: Required dependencies (ledger, validator, hasher, integrityServiceTool) must be provided.");
        }

        this.#ledger = ledger;
        this.#validator = validator;
        
        // Configuration Registry Plugin (Abstracting storage, hashing, and immutability logic)
        this.#registry = registry || this.#delegateToRegistryInstantiation({ hasher, integrityServiceTool });
    }

    // --- I/O Proxies for Setup ---

    /**
     * Delegates instantiation of the ImmutableConfigRegistry.
     * @param {Object} deps
     */
    #delegateToRegistryInstantiation(deps) {
        // Assuming ImmutableConfigRegistry is available in scope (as per original code structure).
        // If not provided via DI, instantiate the required tool.
        return new ImmutableConfigRegistry(deps);
    }

    // --- Core Policy Methods ---

    /**
     * Internal validation against established GRS stability policies and schema.
     * @param {Object} config 
     * @returns {boolean}
     */
    validateNewConfig(config) {
        return this.#delegateToValidationExecution(config);
    }

    /**
     * Registers a new configuration version, locking it (deep freeze), storing it historically, and logging.
     * @param {Object} newConfig - The proposed policy configuration.
     * @param {string} [source='API_CALL'] - Context/source of the update.
     * @returns {{versionId: string, config: Object, isNew: boolean}}
     * @throws {Error} If configuration validation fails.
     */
    registerNewVersion(newConfig, source = 'API_CALL') {
        if (!this.validateNewConfig(newConfig)) {
            throw new Error("RTPCM_GOV_ERROR: Configuration validation failed against Governance Rules Schema.");
        }

        // Delegate version registration, immutability, and history tracking to the registry plugin via proxy.
        const result = this.#delegateToRegistryRegistration(
            newConfig, 
            source, 
            this.#auditActivation.bind(this) // Pass the internal auditing function as a hook
        );
        
        return result;
    }

    /**
     * Retrieves the currently active configuration, packaged with its version identifier.
     * @returns {{versionId: string|null, config: Object|null}}
     */
    getActiveConfig() {
        return this.#delegateToRegistryGetActive();
    }

    /**
     * Retrieves a specific historical configuration version by its hash ID.
     * @param {string} versionId - The hash of the desired configuration.
     * @returns {Object|null} The immutable configuration object, or null if not found locally.
     */
    getHistoricalConfig(versionId) {
        return this.#delegateToRegistryGetHistorical(versionId);
    }

    /**
     * Retrieves the chronological timeline of configuration activations.
     * @returns {ReadonlyArray<Object>} Returns a deeply frozen timeline array.
     */
    getActivationTimeline() {
        return this.#delegateToRegistryGetTimeline();
    }

    /**
     * Exposed accessor for the ID of the currently active configuration.
     * @returns {string|null}
     */
    getActiveVersionId() {
        return this.#delegateToRegistryGetVersionId();
    }

    /**
     * Exposed accessor for calculating a hash for external verification (e.g., API response).
     * @param {Object} config
     * @returns {string}
     */
    calculateHash(config) {
        return this.#delegateToRegistryCalculateHash(config);
    }

    // --- Internal Helpers & I/O Proxies ---

    /**
     * Logs the activation event to the Auditing Ledger (D-01/MCR).
     * @param {string} versionId
     * @param {Object} record
     */
    #auditActivation(versionId, record) {
        this.#delegateToAuditLog('RTPCM_CONFIG_ACTIVATION', {
            ...record,
            details: `P-01 Trust Calculus parameters version ${versionId.substring(0, 8)} activated.`,
        });
    }

    // I/O Proxy: Executes validation using the ConfigValidator dependency.
    #delegateToValidationExecution(config) {
        return this.#validator.validate(config);
    }

    // I/O Proxy: Executes transaction logging via the LedgerService dependency.
    #delegateToAuditLog(type, data) {
        this.#ledger.logTransaction(type, data);
    }

    // I/O Proxy: Delegates configuration registration to the ImmutableConfigRegistry.
    #delegateToRegistryRegistration(config, source, auditHook) {
        return this.#registry.register(config, source, auditHook);
    }

    // I/O Proxy: Delegates retrieval of the active configuration.
    #delegateToRegistryGetActive() {
        return this.#registry.getActiveConfig();
    }

    // I/O Proxy: Delegates retrieval of a historical configuration.
    #delegateToRegistryGetHistorical(versionId) {
        return this.#registry.getHistoricalConfig(versionId);
    }

    // I/O Proxy: Delegates retrieval of the activation timeline.
    #delegateToRegistryGetTimeline() {
        return this.#registry.getActivationTimeline();
    }

    // I/O Proxy: Delegates retrieval of the active version ID.
    #delegateToRegistryGetVersionId() {
        return this.#registry.getActiveVersionId();
    }

    // I/O Proxy: Delegates hash calculation.
    #delegateToRegistryCalculateHash(config) {
        return this.#registry.calculateHash(config);
    }
}

module.exports = RTPCM;