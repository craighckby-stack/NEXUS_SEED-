/**
 * @typedef {object} CacheEntry
 * @property {number} score - The calculated trust score.
 * @property {number} expiry - Unix timestamp in milliseconds when the entry expires.
 */

/**
 * Trust Cache Manager Configuration structure.
 * @typedef {object} TrustCacheManagerConfig
 * @property {number} [ttlSeconds=300] - Time-to-live for cache entries.
 * @property {number} [cleanupIntervalSeconds=60] - How often the background cleanup runs.
 */

const DEFAULT_TTL_SECONDS = 300; // 5 minutes
const DEFAULT_CLEANUP_INTERVAL_SECONDS = 60; // 1 minute

/**
 * Trust Cache Manager (TCM) v94.1
 * Manages the persistence and retrieval of calculated agent trust scores, implementing
 * active garbage collection for bounded memory usage and configurable lifetime.
 */
class TrustCacheManager {
    /**
     * @param {TrustCacheManagerConfig} [config={}] - Configuration object.
     */
    constructor(config = {}) {
        /** @type {Map<string, CacheEntry>} */
        this.cache = new Map();

        // Resolve configuration with defaults
        const resolvedConfig = {
            ttlSeconds: DEFAULT_TTL_SECONDS,
            cleanupIntervalSeconds: DEFAULT_CLEANUP_INTERVAL_SECONDS,
            ...config
        };

        this._ttlMs = resolvedConfig.ttlSeconds * 1000;
        this._cleanupIntervalMs = resolvedConfig.cleanupIntervalSeconds * 1000;
        
        this._cleanupTimer = null; 

        this._startCleanupTask();
    }

    /**
     * Initializes the periodic background task for cache cleanup.
     * Prevents unbounded memory growth from unread, expired entries.
     * @private
     */
    _startCleanupTask() {
        if (this._cleanupIntervalMs > 0) {
            // Use .bind(this) to ensure the execution context for _runCleanup is correct
            this._cleanupTimer = setInterval(this._runCleanup.bind(this), this._cleanupIntervalMs);
            
            // Optimization: Allow Node process to exit cleanly if this is the only active timer.
            if (typeof this._cleanupTimer.unref === 'function') {
                this._cleanupTimer.unref(); 
            }
        }
    }

    /**
     * Clears all expired entries from the cache in one pass.
     * @private
     * @returns {number} The number of items cleaned.
     */
    _runCleanup() {
        const now = Date.now();
        let cleanedCount = 0;
        
        for (const [key, entry] of this.cache.entries()) {
            // Use <= now for strict expiration handling
            if (entry.expiry <= now) {
                this.cache.delete(key);
                cleanedCount++;
            }
        }
        return cleanedCount;
    }

    /**
     * Generates a standardized cache key based on Agent ID and Context.
     * Normalizes the context to ensure consistent key usage (trimmed, uppercase).
     * @param {string} agentId 
     * @param {string} [currentContext='GLOBAL'] 
     * @returns {string}
     */
    _generateKey(agentId, currentContext = 'GLOBAL') {
        if (!agentId || typeof agentId !== 'string') {
            throw new Error("TCM Error: Agent ID must be a non-empty string.");
        }
        
        const context = (currentContext || 'GLOBAL').trim().toUpperCase();
        return `${agentId}:${context}`;
    }

    /**
     * Stores a calculated trust score with an expiration time.
     * @param {string} agentId 
     * @param {string} [currentContext='GLOBAL'] 
     * @param {number} score - The calculated PME score.
     */
    setScore(agentId, currentContext = 'GLOBAL', score) {
        if (typeof score !== 'number' || isNaN(score) || !isFinite(score)) {
            throw new TypeError("TCM Error: Score must be a valid, finite number.");
        }

        const key = this._generateKey(agentId, currentContext);
        const expiry = Date.now() + this._ttlMs;
        
        /** @type {CacheEntry} */
        const entry = { score, expiry };

        this.cache.set(key, entry);
    }

    /**
     * Retrieves a score from the cache if it is valid (not expired).
     * Implements lazy expiration check/cleanup.
     * @param {string} agentId 
     * @param {string} [currentContext='GLOBAL'] 
     * @returns {number|null} The cached score, or null if missing/expired.
     */
    getScore(agentId, currentContext = 'GLOBAL') {
        try {
            const key = this._generateKey(agentId, currentContext);
            const entry = this.cache.get(key);

            if (!entry) {
                return null;
            }

            const now = Date.now();
            if (entry.expiry <= now) {
                // Lazy expiration: delete expired item immediately
                this.cache.delete(key);
                return null;
            }

            return entry.score;
        } catch (e) {
            // Gracefully handle errors from _generateKey (e.g., invalid Agent ID)
            return null; 
        }
    }

    /**
     * Forces the invalidation of a specific score entry.
     * @param {string} agentId 
     * @param {string} [currentContext='GLOBAL'] 
     */
    invalidate(agentId, currentContext = 'GLOBAL') {
        try {
            const key = this._generateKey(agentId, currentContext);
            this.cache.delete(key);
        } catch (e) {
            // Ignore invalidation attempts based on bad input keys
        }
    }

    /**
     * Returns the current size of the cache (including potentially expired items).
     */
    size() {
        return this.cache.size;
    }

    /**
     * Stops the background cleanup interval task. Essential for clean system shutdown.
     */
    stop() {
        if (this._cleanupTimer) {
            clearInterval(this._cleanupTimer);
            this._cleanupTimer = null;
        }
    }
}

module.exports = TrustCacheManager;