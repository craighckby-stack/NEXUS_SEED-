// config/AxiomManager.js

// Private configuration constraints
const AM_CONSTRAINTS = {
    KEY_LATEST_CERTIFIED: 'ACVD_latest_certified',
    MIN_UFRM_HARD_FLOOR: 0.1, // Unforeseen Risk Mitigation floor (Absolute minimum)
    MAX_CFTM_CEILING: 0.95,   // Constraint Fulfillment Threshold Maximum (Absolute maximum)
};

/**
 * Axiom Manager (AM)
 * Responsible for lifecycle management and integrity of system policies,
 * specifically the Axiomatic Constraint Vector Definition (ACVD).
 * 
 * Prerequisites: Requires Logger, StorageProvider, and a dedicated ACVD Schema Validator.
 */
class AxiomManager {
    // Private fields for strict encapsulation and state management
    #storage;
    #logger;
    #ACVD = null; 

    /**
     * @param {Object} storageProvider - Handles persistence (must support fetch, write, updateAlias)
     * @param {Object} logger - Dedicated logging utility.
     * @param {Object} acvdSchemaValidator - The required utility for structure enforcement (ACVDSchema).
     */
    constructor(storageProvider, logger, acvdSchemaValidator) {
        if (!storageProvider) throw new Error("[AM] AxiomManager requires a storage provider.");
        if (!acvdSchemaValidator || typeof acvdSchemaValidator.validateStructure !== 'function') {
            throw new Error("[AM] AxiomManager requires a valid ACVD Schema Validator utility.");
        }

        this.#storage = storageProvider; 
        this.#logger = logger || console; 
        this.validator = acvdSchemaValidator; // Dependency Injection for Validation Logic
    }

    _isInitialized() {
        return this.#ACVD !== null;
    }

    /**
     * Initializes the manager by loading the latest certified ACVD.
     */
    async initialize() {
        try {
            this.#ACVD = await this._loadLatestACVD();
            this.#logger.info(`[AM] Initialized successfully with ACVD v${this.#ACVD.metadata.version}.`);
        } catch (error) {
            // Critical policy failure prevents system operation
            this.#logger.error(`[AM] Initialization failed: ${error.message}`);
            throw new Error("CRITICAL_POLICY_LOAD_FAILURE: Cannot establish foundational ACVD policy.");
        }
    }

    async _loadLatestACVD() {
        this.#logger.info("[AM] Attempting to load latest certified ACVD configuration.");
        
        const key = AM_CONSTRAINTS.KEY_LATEST_CERTIFIED;
        let rawConfig = null;

        try {
            rawConfig = await this.#storage.fetch(key); 
            
            if (!rawConfig) {
                this.#logger.warn("[AM] ACVD not found in storage. Initializing system defaults.");
                const defaultConfig = this._getDefaultACVD();
                // Validate defaults to ensure internal consistency
                this.validator.validateStructure(defaultConfig, true); 
                return defaultConfig;
            }
            
            // Critical Step: Validate the retrieved structure against the schema
            this.validator.validateStructure(rawConfig);
            
            return rawConfig;

        } catch (error) {
            this.#logger.error(`[AM] Failed to process or validate ACVD from storage (${key}): ${error.message}`);
            throw error; // Re-throw for handling in initialize()
        }
    }

    /**
     * Generates a minimal, robust default ACVD.
     * @private
     */
    _getDefaultACVD() {
        return {
            metadata: { 
                version: 0, 
                creationDate: new Date().toISOString(),
                source: 'SYSTEM_DEFAULT',
                // A bypass signature is required for defaults to pass validation checks
                signature: 'NONE_GOVERNANCE_BYPASS' 
            },
            parameters: { 
                UFRM: AM_CONSTRAINTS.MIN_UFRM_HARD_FLOOR, 
                CFTM: AM_CONSTRAINTS.MAX_CFTM_CEILING 
            } 
        };
    }

    /**
     * Core validation logic for candidate ACVD.
     * @param {Object} candidateACVD - The proposed new configuration.
     * @throws {Error} If any validation rule fails.
     */
    validateACVD(candidateACVD) {
        if (!this._isInitialized()) {
             throw new Error("[AM] AxiomManager not initialized. Call initialize() first.");
        }
        
        // 1. Structural/Schema Validation (Delegated)
        this.validator.validateStructure(candidateACVD); 
        
        const currentVersion = this.#ACVD.metadata.version;
        const candidateVersion = candidateACVD.metadata.version;

        // 2. Version Check
        if (typeof candidateVersion !== 'number' || candidateVersion <= currentVersion) {
            throw new Error(`Policy version mismatch: Candidate version (${candidateVersion}) must be strictly greater than current version (${currentVersion}).`);
        }
        
        // 3. Hard Limit Checks (Sanity Checks on Parameter values)
        if (candidateACVD.parameters.UFRM < AM_CONSTRAINTS.MIN_UFRM_HARD_FLOOR) {
            this.#logger.alert(`[AM] UFRM (${candidateACVD.parameters.UFRM}) below absolute hard floor limit. This is a critical parameter violation.`);
            throw new Error("Parameter violation: UFRM below hard policy floor limit.");
        }

        // Note: Integrity check for governance signature is handled by validateStructure
        
        return true;
    }

    /**
     * Applies a governance-approved ACVD delta and persists the new version.
     * @param {Object} verifiedPackage - The policy package approved by CGR, including the full ACVD object in ACVD_Delta.
     */
    async certifyAndPersistACVD(verifiedPackage) {
        if (!this._isInitialized()) {
             throw new Error("[AM] AxiomManager not initialized.");
        }
        
        // Assuming verifiedPackage.ACVD_Delta is the full new ACVD object
        const verifiedACVD = verifiedPackage.ACVD_Delta; 

        try {
            this.validateACVD(verifiedACVD); // Performs all structural and logical checks
        } catch (error) {
            this.#logger.error(`[AM] Certification failed: ${error.message}`);
            throw new Error(`Cannot certify ACVD: Validation failed. ${error.message}`);
        }
        
        this.#ACVD = verifiedACVD;
        const versionKey = `ACVD_v${this.#ACVD.metadata.version}`; // Immutable version key
        
        // 1. Persist new version immutably 
        await this.#storage.write(versionKey, this.#ACVD);
        
        // 2. Update the latest certified alias (pointer)
        await this.#storage.updateAlias(AM_CONSTRAINTS.KEY_LATEST_CERTIFIED, versionKey);
        
        this.#logger.info(`[AM] Successfully certified and applied ACVD v${this.#ACVD.metadata.version}. Persistent key: ${versionKey}.`);
        return this.getCurrentACVD();
    }

    /**
     * Retrieves the current active Axiomatic Constraint Vector Definition (ACVD).
     * @returns {Object} A frozen, immutable copy of the current ACVD.
     */
    getCurrentACVD() {
        if (!this._isInitialized()) {
             throw new Error("[AM] AxiomManager not initialized.");
        }
        // Return an immutable, frozen structure for read operations.
        return Object.freeze(JSON.parse(JSON.stringify(this.#ACVD))); 
    }
}

module.exports = AxiomManager;
