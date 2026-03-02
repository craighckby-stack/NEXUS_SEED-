/**
 * Component ID: C-01
 * Configuration Service: Centralized manager for application settings.
 * Fetches settings from environment variables, defaults, or a runtime store.
 * This component allows for proper Dependency Injection, decoupling hardcoded constants from components like D-01.
 */
const path = require('path');

const LOG_ROOT = path.resolve(process.env.LOG_ROOT || './logs');

const DEFAULT_CONFIG = {
    // --- System Identifiers ---
    SYSTEM_NAME: 'Sovereign-AGI-v94.1',
    ENVIRONMENT: process.env.NODE_ENV || 'development',
    
    // --- D-01 (Decision Audit Logger) Configuration ---
    AUDIT_LOG: {
        dir: LOG_ROOT,
        fileName: 'ogt_decisions.jsonl',
        batchSize: parseInt(process.env.AUDIT_BATCH_SIZE || '50', 10),
        flushIntervalMs: parseInt(process.env.AUDIT_FLUSH_MS || '5000', 10),
        maxRetries: 3,
    },

    // --- R-01 (Runtime State Manager) Configuration (Placeholder) ---
    STATE_CACHE_TTL_MS: 60000,
};

class ConfigurationService {
    constructor() {
        this.config = DEFAULT_CONFIG;
    }

    /**
     * Retrieves the entire configuration object.
     * @returns {object}
     */
    getAll() {
        return this.config;
    }

    /**
     * Retrieves a specific configuration value using dot notation (e.g., 'AUDIT_LOG.batchSize').
     * @param {string} key - Configuration key.
     * @param {*} [defaultValue] - Value to return if key is not found.
     * @returns {*}
     */
    get(key, defaultValue = undefined) {
        // Simple dot notation accessor
        return key.split('.').reduce((o, i) => (o ? o[i] : undefined), this.config) || defaultValue;
    }
}

// Export as a singleton for easy global access (optional, can be replaced by explicit DI)
module.exports = new ConfigurationService();
