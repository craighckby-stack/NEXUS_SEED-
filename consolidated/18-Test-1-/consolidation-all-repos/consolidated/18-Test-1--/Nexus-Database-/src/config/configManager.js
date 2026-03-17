const path = require('path');

/**
 * Determine the absolute root directory of the project based on relative path from configManager.js
 */
const ROOT_DIR = path.resolve(__dirname, '..', '..');

const DEFAULTS = {
    // Core identification and paths
    app: {
        id: 'sovereign-agi',
        root: ROOT_DIR,
    },
    // Directory names
    dirs: {
        logs: 'logs',
        temp: 'temp',
    },
    // Logging configuration defaults and env mapping
    logging: {
        logLevel: 'info', // Can be overridden via ENV
        auditFileName: 'ogt_decisions.jsonl',
        envMap: {
            // Map environment variable keys to config object keys (dot notation)
            LOG_LEVEL: 'logging.logLevel',
            LOGS_DIR_NAME: 'dirs.logs',
            AUDIT_FILE_NAME: 'logging.auditFileName'
        }
    }
};

/**
 * Utility function to recursively merge two objects (deep merge).
 */
function deepMerge(target, source) {
    for (const key in source) {
        if (source[key] instanceof Object && !Array.isArray(source[key])) {
            target[key] = deepMerge(target[key] || {}, source[key]);
        } else {
            target[key] = source[key];
        }
    }
    return target;
}

class ConfigManager {
    static #config = {}; // Use private field for encapsulation

    /**
     * Loads defaults, environment variables, and calculates derived configuration values.
     */
    static initialize() {
        if (Object.keys(ConfigManager.#config).length > 0) {
            // Already initialized
            return;
        }

        // 1. Start with defaults (deep clone for safe mutation)
        let configData = JSON.parse(JSON.stringify(DEFAULTS));

        // 2. Apply Environment Overrides
        const envOverrides = {};
        for (const [envKey, configKey] of Object.entries(configData.logging.envMap)) {
            const envValue = process.env[envKey];
            if (envValue !== undefined) {
                // Traverse the config key path and set the value in the envOverrides structure
                const parts = configKey.split('.');
                let temp = envOverrides;
                for (let i = 0; i < parts.length - 1; i++) {
                    temp[parts[i]] = temp[parts[i]] || {};
                    temp = temp[parts[i]];
                }
                temp[parts[parts.length - 1]] = envValue;
            }
        }

        // Merge environment overrides onto defaults
        configData = deepMerge(configData, envOverrides);
        delete configData.logging.envMap; // Clean up the map after use

        // 3. Calculate Derived Paths
        const logsDirPath = path.join(configData.app.root, configData.dirs.logs);

        // Calculate full audit log path
        configData.logging.auditPath = path.join(
            logsDirPath,
            configData.logging.auditFileName
        );
        
        ConfigManager.#config = configData;
        // console.log('[C-00] Configuration initialized.');
    }

    /**
     * Retrieves a configuration value by dot notation key (e.g., 'logging.auditPath')
     * @param {string} key - Dot-separated path to the configuration value.
     * @returns {any | undefined}
     */
    static get(key) {
        if (Object.keys(ConfigManager.#config).length === 0) {
            // Auto-initialize if necessary, though explicit initialize is preferred
            ConfigManager.initialize();
        }

        // Use short-circuiting reducer to safely navigate the object path
        return key.split('.').reduce((acc, part) => (acc === undefined || acc === null) ? undefined : acc[part], ConfigManager.#config);
    }
}

ConfigManager.initialize(); // Initialize immediately upon module load
module.exports = ConfigManager;
