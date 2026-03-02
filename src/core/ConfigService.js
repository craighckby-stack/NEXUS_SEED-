/**
 * Sovereign AGI v95.0 - ConfigService
 * Function: Centralized service for loading, parsing, and providing runtime configuration parameters.
 * Ensures type safety and consistent defaults across all modules.
 */

class ConfigService {
    constructor() {
        // Load configuration from ENV variables, defaults, or external files
        this._config = this._loadConfiguration();
    }

    _loadConfiguration() {
        return {
            // Core System Settings
            AGI_VERSION: 'v95.0',
            ENVIRONMENT: process.env.NODE_ENV || 'development',
            
            // Logging Settings (Used by AgiLogger)
            LOG_LEVEL: process.env.AGI_LOG_LEVEL || 'INFO',
            LOG_DESTINATION: process.env.AGI_LOG_DESTINATION || 'stdout',

            // Default ports/resources
            API_PORT: parseInt(process.env.API_PORT) || 3000,
            // ... other system settings (SRM limits, Memory capacity, etc.)
        };
    }

    /**
     * Gets a configuration value by key.
     * @param {string} key - The configuration key (e.g., 'LOG_LEVEL').
     * @returns {any} The configuration value.
     */
    get(key) {
        if (!this._config.hasOwnProperty(key)) {
            console.error(`Configuration key not found: ${key}`);
            return null; // Return null or throw error depending on strictness
        }
        return this._config[key];
    }
}

// Enforce Singleton Pattern
const instance = new ConfigService();
Object.freeze(instance);

module.exports = instance;
