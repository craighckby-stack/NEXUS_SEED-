/**
 * SCR (Schema and Configuration Registry) - Refactored for Abstract Recursion and Efficiency
 * Mission: Centralized Governance, unified item management, and maximized caching efficiency (L1).
 * Optimization Directive: Combine schema/config management into unified abstract methods (computational efficiency through reduced complexity).
 */
class SchemaConfigRegistry {
    /**
     * @param {object} dependencies - Required dependencies.
     * @param {object} dependencies.persistenceLayer - Responsible for immutable storage.
     * @param {object} dependencies.authorizationService - Enforces governance mandates (P-01).
     * @param {object} dependencies.integrityUtils - Utility for cryptographic hashing.
     */
    constructor({ persistenceLayer, authorizationService, integrityUtils }) {
        if (!persistenceLayer || !authorizationService || !integrityUtils) {
            throw new Error("SCR requires PersistenceLayer, GovernanceAuthorizationService, and IntegrityUtils initialization.");
        }
        
        // Unified Operational Cache (L1): Stores records keyed by 'type:id'
        this._cache = new Map(); 
        
        // Thundering Herd Prevention/Load Barrier: Stores Promises for items currently being fetched.
        this._pendingLoads = new Map(); 

        this._persistenceLayer = persistenceLayer;
        this._authorizationService = authorizationService;
        this._integrityUtils = integrityUtils; 
    }

    /**
     * Internal handler to check authorization against required AOC security policy.
     * @param {string} operation - The registry operation (e.g., 'REGISTER_SCHEMA').
     * @param {object} [context={}] - Authorization context or token.
     */
    async _checkAuthorization(operation, context = {}) {
        // Elevated security clearance required for any write operation
        const requiredLevel = (operation.startsWith('REGISTER_')) ? 'L4_P01_PASS' : 'READ_ACCESS';
        const isAuthorized = await this._authorizationService.validate(requiredLevel, context);
        
        if (!isAuthorized) {
            throw new SchemaConfigRegistry.AuthorizationError(
                `Operation forbidden (${operation}): Required clearance ${requiredLevel}.`
            );
        }
    }

    /**
     * Generates a unique, content-integrity aware version identifier.
     * @param {object} content - The content being versioned.
     * @returns {Promise<string>} The version identifier.
     */
    async _generateVersion(content) {
        const contentString = JSON.stringify(content);
        const integrityHash = await this._integrityUtils.calculateContentHash(contentString);
        const hashPrefix = integrityHash.substring(0, 12);
        const epochIndex = Math.floor(Date.now() / 10000); 
        return `V${epochIndex}-${hashPrefix}`;
    }

    // --- Core Abstract Management Methods ---

    /**
     * Abstract method for fetching items from cache or persistence, using Load Barrier.
     * Max computational efficiency achieved by unifying schema and config retrieval logic.
     * @param {'schema' | 'config'} type - Item type.
     * @param {string} id - The unique identifier.
     * @returns {Promise<object>} The item payload (definition for schema, data for config).
     */
    async _processItem(type, id) {
        const key = `${type}:${id}`;
        const contentKey = type === 'schema' ? 'definition' : 'data';

        // 1. L1 Cache Hit
        if (this._cache.has(key)) {
            return this._cache.get(key)[contentKey];
        }

        // Helper to extract the payload from a resolved record promise
        const extractPayload = (record) => record[contentKey];

        // 2. Load Barrier Check (Thundering Herd Prevention)
        if (this._pendingLoads.has(key)) {
            return this._pendingLoads.get(key).then(extractPayload);
        }
        
        // 3. New Persistence Load Operation
        const loadPromise = (async () => {
            try {
                const persistenceLoadMethod = 
                    type === 'schema' ? this._persistenceLayer.loadSchema : this._persistenceLayer.loadConfig;
                
                const record = await persistenceLoadMethod.call(this._persistenceLayer, id);
                
                if (!record) {
                    throw new SchemaConfigRegistry.RegistryError(`${type} ${id} not found.`);
                }
                
                this._cache.set(key, record);
                return record;
            } finally {
                this._pendingLoads.delete(key);
            }
        })();

        this._pendingLoads.set(key, loadPromise);
        
        const record = await loadPromise;
        return extractPayload(record);
    }

    /**
     * Abstract method for registering and persisting configuration or schema items.
     * @param {'schema' | 'config'} type - Item type.
     * @param {string} id - Unique identifier.
     * @param {object} content - The schema definition or configuration data.
     * @param {object} [authContext={}] - Authorization context.
     * @returns {Promise<string>} The new version identifier.
     */
    async _registerItem(type, id, content, authContext = {}) {
        const operation = `REGISTER_${type.toUpperCase()}`;
        await this._checkAuthorization(operation, authContext);
        
        const version = await this._generateVersion(content);
        const key = `${type}:${id}`;
        const contentKey = type === 'schema' ? 'definition' : 'data';
        
        const record = {
            id: id,
            [contentKey]: content, 
            version: version,
            timestamp: Date.now()
        };
        
        const persistenceSaveMethod = 
            type === 'schema' ? this._persistenceLayer.saveSchema : this._persistenceLayer.saveConfig;
            
        await persistenceSaveMethod.call(this._persistenceLayer, id, record);
        
        // Update unified cache
        this._cache.set(key, record);

        return version;
    }

    // --- Public Interface (Recursive Abstraction Layer) ---

    async registerSchema(schemaId, schemaDefinition, authContext = {}) {
        return this._registerItem('schema', schemaId, schemaDefinition, authContext);
    }

    async getLatestSchema(schemaId) {
        return this._processItem('schema', schemaId);
    }
    
    async registerConfig(configId, configData, authContext = {}) {
        return this._registerItem('config', configId, configData, authContext);
    }

    async getConfig(configId) {
        return this._processItem('config', configId);
    }

    // --- Static Error Handlers ---
    static AuthorizationError = class extends Error { constructor(message) { super(message); this.name = 'SCR_AuthorizationError'; } };
    static RegistryError = class extends Error { constructor(message) { super(message); this.name = 'SCR_RegistryError'; } };
}

module.exports = SchemaConfigRegistry;