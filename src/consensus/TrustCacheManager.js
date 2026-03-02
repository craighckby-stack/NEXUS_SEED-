/**
 * Trust Cache Manager (TCM) v1.0
 * Manages the persistence and retrieval of calculated agent trust scores
 * produced by the ProposalMetricsEngine (PME) for high-speed access by
 * ARCH-ATM components and decision routers.
 */
class TrustCacheManager {
    constructor(ttlSeconds = 300) {
        // Uses an in-memory Map simulation for high-speed, localized caching.
        this.cache = new Map();
        this.ttl = ttlSeconds * 1000; // Convert seconds to milliseconds
    }

    /**
     * Generates a standardized cache key based on Agent ID and Context.
     * The context is used primarily for future proofing/segmentation, though scores are currently global.
     * @param {string} agentId 
     * @param {string} currentContext 
     * @returns {string}
     */
    _generateKey(agentId, currentContext = 'GLOBAL') {
        return `${agentId}:${currentContext}`;
    }

    /**
     * Stores a calculated trust score with an expiration time.
     * @param {string} agentId 
     * @param {string} currentContext 
     * @param {number} score - The calculated PME score.
     */
    setScore(agentId, currentContext, score) {
        const key = this._generateKey(agentId, currentContext);
        const expiry = Date.now() + this.ttl;
        this.cache.set(key, { score, expiry });
        // console.log(`[TCM] Cached score for ${agentId}. Expires: ${new Date(expiry).toLocaleTimeString()}`);
    }

    /**
     * Retrieves a score from the cache if it is valid (not expired).
     * @param {string} agentId 
     * @param {string} currentContext 
     * @returns {number|null} The cached score, or null if missing/expired.
     */
    getScore(agentId, currentContext) {
        const key = this._generateKey(agentId, currentContext);
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        if (entry.expiry < Date.now()) {
            // Expired entry cleanup
            this.cache.delete(key);
            // console.log(`[TCM] Cache entry expired for ${agentId}.`)
            return null;
        }

        return entry.score;
    }

    /**
     * Forces the invalidation of a specific score entry.
     */
    invalidate(agentId, currentContext) {
        const key = this._generateKey(agentId, currentContext);
        this.cache.delete(key);
    }

    /**
     * Returns the current size of the cache.
     */
    size() {
        return this.cache.size;
    }
}

module.exports = TrustCacheManager;
