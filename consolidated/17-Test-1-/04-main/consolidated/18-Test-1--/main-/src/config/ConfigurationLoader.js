/**
 * Configuration Loader for Sovereign AGI v94.1
 * Provides standardized, centralized access to global configuration parameters.
 * This utility ensures governance parameters, like default schema versions, are managed flexibly.
 */
class ConfigurationLoader {
    constructor() {
        // Load configuration from all sources (e.g., environment variables, static files, defaults)
        this.config = this._loadDefaultConfig(); 
    }

    _loadDefaultConfig() {
        // Defines critical governance defaults for module initialization.
        return {
            governance: {
                // Default schema key for the Mutation Payload Specification Engine (MPSE)
                mpseSchemaVersion: 'MPSE_SCHEMA_V1'
            },
            // System logging default settings
            logger: {
                level: 'info',
                retentionDays: 30
            }
        };
    }

    /**
     * Retrieves a configuration value using a dot-notated path (e.g., 'governance.mpseSchemaVersion').
     * @param {string} path - The configuration key path.
     * @param {*} [defaultValue=undefined] - The value to return if the path is not found.
     * @returns {*} The configuration value.
     */
    get(path, defaultValue) {
        const parts = path.split('.');
        let current = this.config;

        for (const part of parts) {
            if (current && typeof current === 'object' && part in current) {
                current = current[part];
            } else {
                return defaultValue;
            }
        }
        return current;
    }
}

// Export a singleton instance for global access
module.exports = new ConfigurationLoader();