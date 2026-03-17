/**
 * @interface ITrustCacheConfigRegistryKernel
 * @method getDefaultTTLSeconds
 * @method getDefaultCleanupIntervalSeconds
 * @method getDefaultContext
 */

/**
 * Interface definition for a cache factory that produces instances of the TTL Map Cache.
 * @interface ITTLMapCacheFactoryKernel
 * @method create(ttlMs, cleanupIntervalMs)
 */

/**
 * Interface definition for the underlying TTL Map Cache utility instance.
 * @interface ITTLMapCacheToolKernel
 * @method set(key, value)
 * @method get(key)
 * @method delete(key)
 * @method size()
 * @method stopCleanup()
 */

/**
 * Trust Cache Manager Kernel (TCM) v94.2
 * Manages the persistence and retrieval of calculated agent trust scores, implementing
 * active garbage collection via the underlying ITTLMapCacheToolKernel utility.
 */
class TrustCacheManagerKernel {
    /**
     * @param {ITrustCacheConfigRegistryKernel} configRegistry - Registry holding default configuration constants.
     * @param {ITTLMapCacheFactoryKernel} ttlMapCacheFactory - Factory used to instantiate the cache tool.
     * @param {object} [runtimeConfig={}] - Configuration object override.
     * @param {number} [runtimeConfig.ttlSeconds] - Time-to-live for cache entries.
     * @param {number} [runtimeConfig.cleanupIntervalSeconds] - How often the background cleanup runs.
     */
    constructor(configRegistry, ttlMapCacheFactory, runtimeConfig = {}) {
        if (!configRegistry || !ttlMapCacheFactory) {
            throw new Error("TrustCacheManagerKernel requires configRegistry and ttlMapCacheFactory dependencies.");
        }

        this._configRegistry = configRegistry;
        this._ttlMapCacheFactory = ttlMapCacheFactory;
        this._runtimeConfig = runtimeConfig;
        
        this.#setupDependencies();
    }

    /**
     * Isolates dependency initialization and configuration resolution, adding robustness checks.
     * @private
     */
    #setupDependencies() {
        const defaultTTL = this._configRegistry.getDefaultTTLSeconds();
        const defaultCleanup = this._configRegistry.getDefaultCleanupIntervalSeconds();

        // Resolve configuration with defaults from the registry
        const resolvedConfig = {
            ttlSeconds: defaultTTL,
            cleanupIntervalSeconds: defaultCleanup,
            ...this._runtimeConfig
        };

        let { ttlSeconds, cleanupIntervalSeconds } = resolvedConfig;

        // Robustness check: Ensure TTL and Cleanup intervals are positive, finite numbers.
        // Fallback to defaults if runtime overrides are invalid.
        if (typeof ttlSeconds !== 'number' || !isFinite(ttlSeconds) || ttlSeconds <= 0) {
            ttlSeconds = defaultTTL;
        }
        if (typeof cleanupIntervalSeconds !== 'number' || !isFinite(cleanupIntervalSeconds) || cleanupIntervalSeconds <= 0) {
            cleanupIntervalSeconds = defaultCleanup;
        }

        const ttlMs = ttlSeconds * 1000;
        const cleanupIntervalMs = cleanupIntervalSeconds * 1000;
        
        /** @type {ITTLMapCacheToolKernel<string, number>} */
        this._cache = this._ttlMapCacheFactory.create(ttlMs, cleanupIntervalMs);
    }

    /**
     * Generates a standardized cache key based on Agent ID and Context.
     * Normalizes the context to ensure consistent key usage (trimmed, uppercase).
     * @param {string} agentId 
     * @param {string} [currentContext] 
     * @returns {string}
     */
    _generateKey(agentId, currentContext) {
        const defaultContext = this._configRegistry.getDefaultContext();

        if (!agentId || typeof agentId !== 'string') {
            // Standardized input validation error type
            throw new TypeError("TCM Error: Agent ID must be a non-empty string.");
        }
        
        // Uses defaultContext if currentContext is falsy (null, undefined, '')
        const context = (currentContext || defaultContext).trim().toUpperCase();
        return `${agentId}:${context}`;
    }

    /**
     * Stores a calculated trust score with an expiration time.
     * @param {string} agentId 
     * @param {string} [currentContext] 
     * @param {number} score - The calculated PME score.
     */
    setScore(agentId, currentContext, score) {
        if (typeof score !== 'number' || isNaN(score) || !isFinite(score)) {
            throw new TypeError("TCM Error: Score must be a valid, finite number.");
        }

        const key = this._generateKey(agentId, currentContext);
        
        this._cache.set(key, score);
    }

    /**
     * Retrieves a score from the cache if it is valid (not expired).
     * @param {string} agentId 
     * @param {string} [currentContext] 
     * @returns {number|null} The cached score, or null if missing/expired.
     */
    getScore(agentId, currentContext) {
        try {
            const key = this._generateKey(agentId, currentContext);
            const score = this._cache.get(key);

            // Cache returns undefined if missing/expired, map back to null for API consistency
            return score !== undefined ? score : null;
            
        } catch (e) {
            // Gracefully handle input errors (e.g., invalid Agent ID from _generateKey)
            return null; 
        }
    }

    /**
     * Forces the invalidation of a specific score entry.
     * @param {string} agentId 
     * @param {string} [currentContext] 
     */
    invalidate(agentId, currentContext) {
        try {
            const key = this._generateKey(agentId, currentContext);
            this._cache.delete(key);
        } catch (e) {
            // Ignore invalidation attempts based on bad input keys
        }
    }

    /**
     * Returns the current size of the cache (including potentially expired items).
     */
    size() {
        return this._cache.size();
    }

    /**
     * Stops the background cleanup interval task. Essential for clean system shutdown.
     */
    stop() {
        this._cache.stopCleanup();
    }
}

module.exports = TrustCacheManagerKernel;