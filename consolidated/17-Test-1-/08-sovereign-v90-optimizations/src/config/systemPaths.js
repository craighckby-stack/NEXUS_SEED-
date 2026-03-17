/**
 * AGI-KERNEL v7.11.3 [SystemAuditPathsConfigRegistryKernel]
 * 
 * Encapsulates immutable configuration constants related to default system paths 
 * (like log and cache directory names) and audit configuration settings.
 * Eliminates synchronous dependency on 'path' module and '__dirname' context 
 * by storing only environment-agnostic constants (relative names and settings).
 */
class SystemAuditPathsConfigRegistryKernel {
    #config;

    constructor() {
        this.#setupDependencies();
        Object.freeze(this);
    }

    /**
     * @private
     * Defines and initializes all configuration constants synchronously.
     * This isolates raw constant definition logic and guarantees immutability.
     */
    #setupDependencies() {
        // Extracted Audit Configuration (formerly AUDIT_CONFIG)
        const AUDIT_CONFIG = {
            FILE_NAME: 'ogt_decisions.jsonl',
            BATCH_SIZE: 50,
            FLUSH_INTERVAL_MS: 5000
        };

        // Extracted default path segment names (formerly derived via path.join)
        const PATH_SEGMENTS = {
            LOG_DIR_NAME: 'logs',
            CACHE_DIR_NAME: 'cache'
        };

        this.#config = {
            AUDIT: AUDIT_CONFIG,
            PATH_SEGMENTS: PATH_SEGMENTS,
        };

        this.#deepFreeze(this.#config);
    }

    /**
     * Recursively freezes an object to ensure immutability.
     * @param {object} obj 
     */
    #deepFreeze(obj) {
        if (typeof obj !== 'object' || obj === null) return obj;

        Object.freeze(obj);

        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                const prop = obj[key];
                if (typeof prop === 'object' && prop !== null && !Object.isFrozen(prop)) {
                    this.#deepFreeze(prop);
                }
            }
        }
        return obj;
    }

    /**
     * Retrieves the configuration settings for the Audit Logger.
     * @returns {{FILE_NAME: string, BATCH_SIZE: number, FLUSH_INTERVAL_MS: number}}
     */
    getAuditConfig() {
        return this.#config.AUDIT;
    }

    /**
     * Retrieves the default path segment names.
     * These require an external path resolver to be joined with the application root path.
     * @returns {{LOG_DIR_NAME: string, CACHE_DIR_NAME: string}}
     */
    getPathSegments() {
        return this.#config.PATH_SEGMENTS;
    }
}

module.exports = SystemAuditPathsConfigRegistryKernel;