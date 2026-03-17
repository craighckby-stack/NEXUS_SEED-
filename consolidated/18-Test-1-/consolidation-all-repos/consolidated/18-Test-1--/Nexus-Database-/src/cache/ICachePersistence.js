/**
 * @typedef {object} PersistenceGetResult
 * @property {any} value - The data value stored.
 * @property {number} expiry - Unix timestamp in milliseconds for expiration.
 */

/**
 * ICachePersistence Interface (v94.1)
 * Defines the required structure for any pluggable cache backend (in-memory, Redis, DB).
 * Implementing this allows the TrustCacheManager to abstract storage details, making
 * the consensus module scalable and fault-tolerant in a cluster environment.
 * All methods must be asynchronous and return Promises.
 */
class ICachePersistence {
    
    /**
     * Retrieves a cache entry based on a key.
     * @param {string} key - The unique cache key.
     * @returns {Promise<PersistenceGetResult|null>} Returns the value and original expiration timestamp, or null if missing.
     */
    async get(key) {
        throw new Error('ICachePersistence method `get` must be implemented by subclass.');
    }

    /**
     * Stores a value with a specified Time-To-Live (TTL).
     * @param {string} key - The unique cache key.
     * @param {any} value - The data value to store (often serialized).
     * @param {number} ttlMs - Total lifespan in milliseconds.
     * @returns {Promise<void>}
     */
    async set(key, value, ttlMs) {
        throw new Error('ICachePersistence method `set` must be implemented by subclass.');
    }

    /**
     * Deletes an entry from the cache.
     * @param {string} key - The unique cache key.
     * @returns {Promise<boolean>} True if the key was deleted, false otherwise.
     */
    async delete(key) {
        throw new Error('ICachePersistence method `delete` must be implemented by subclass.');
    }
    
    /**
     * Connects and initializes the underlying persistence system.
     * @returns {Promise<void>}
     */
    async connect() {
         // Default no-op for systems that don't require explicit connection.
    }
    
    /**
     * Shuts down or disconnects resources cleanly.
     * @returns {Promise<void>}
     */
    async disconnect() {
         // Default no-op.
    }
}

module.exports = ICachePersistence;