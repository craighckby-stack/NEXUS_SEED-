/**
 * Component ID: C-00
 * Configuration Manager: Provides centralized, initialized configuration data.
 * Essential for managing environment-specific settings, file paths, and decoupling
 * components like the DecisionAuditLogger from hardcoded filesystem locations.
 */

const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..', '..');

const DEFAULTS = {
    // Core paths
    root: ROOT_DIR,
    logsDirName: 'logs',

    // Logging configuration
    logging: {
        // Default file name for OGT decisions
        auditFileName: 'ogt_decisions.jsonl'
    }
};

class ConfigManager {
    static config = {};

    /**
     * Loads defaults, environment variables, and calculates derived configuration values.
     */
    static initialize() {
        // Load defaults
        this.config = JSON.parse(JSON.stringify(DEFAULTS));

        // Step 1: Apply Environment Overrides (Placeholder for process.env parsing)
        // ... logic for overriding defaults via process.env

        // Step 2: Calculate Derived Paths
        const logsDirPath = path.join(this.config.root, this.config.logsDirName);

        // Calculate full audit log path
        this.config.logging.auditPath = path.join(
            logsDirPath,
            this.config.logging.auditFileName
        );
        
        // console.log('[C-00] Configuration initialized.');
    }

    /**
     * Retrieves a configuration value by dot notation key (e.g., 'logging.auditPath')
     * @param {string} key - Dot-separated path to the configuration value.
     * @returns {any}
     */
    static get(key) {
        if (Object.keys(this.config).length === 0) {
            // Auto-initialize if necessary, though explicit initialize is preferred
            ConfigManager.initialize();
        }
        
        return key.split('.').reduce((acc, part) => acc && acc[part], this.config);
    }
}

ConfigManager.initialize(); // Initialize immediately upon module load
module.exports = ConfigManager;
