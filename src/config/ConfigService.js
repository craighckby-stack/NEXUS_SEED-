import path from 'path';

/**
 * ConfigService: Centralized Configuration and Environment Management
 * Role: Defines global application constants, manages environment variables,
 * and provides standardized path resolution using the native 'path' module.
 */
class ConfigService {
    constructor() {
        // Environment initialization
        this.NODE_ENV = process.env.NODE_ENV || 'development';
        this.IS_PRODUCTION = this.NODE_ENV === 'production';
        this.IS_DEVELOPMENT = this.NODE_ENV === 'development';

        // Path initialization (using path.resolve for robustness)
        this.ROOT_DIR = path.resolve(process.cwd());
        this.SRC_DIR = path.join(this.ROOT_DIR, 'src');
        this.CONFIG_DIR = path.join(this.SRC_DIR, 'config');
        this.LOGS_DIR = path.join(this.ROOT_DIR, 'logs');
    }

    /**
     * Retrieves the current environment string.
     */
    getEnvironment() {
        return this.NODE_ENV;
    }

    /**
     * Standardizes critical application paths.
     * @param {string} filename The name of the config file (e.g., 'governance').
     * @param {string} [extension='.yaml'] The expected file extension.
     * @returns {string} The full path to the configuration file.
     */
    getConfigPath(filename, extension = '.yaml') {
        // Note: Assumes config files are within src/config/ for AGI standard configuration
        return path.join(this.CONFIG_DIR, `${filename}${extension}`);
    }

    /**
     * Converts a string value from process.env into its native type (boolean, number, string).
     * @param {string} value The environment variable string value.
     * @returns {*} The parsed value.
     */
    _parseEnvValue(value) {
        if (typeof value !== 'string') return value;
        if (value.toLowerCase() === 'true') return true;
        if (value.toLowerCase() === 'false') return false;
        
        // Check if numeric, avoiding parsing empty strings as 0
        if (!isNaN(Number(value)) && value.trim() !== '') return Number(value);
        return value;
    }

    /**
     * Gets a variable based on environment preference or default, with type parsing.
     * @param {string} key The environment variable key.
     * @param {*} defaultValue The fallback value.
     * @returns {string|number|boolean|*} The retrieved and parsed value.
     */
    getEnv(key, defaultValue) {
        const envValue = process.env[key];

        if (envValue !== undefined) {
            return this._parseEnvValue(envValue);
        }

        // Ensure the default value is also run through parsing if it is a string representation
        if (typeof defaultValue === 'string') {
             return this._parseEnvValue(defaultValue);
        }

        return defaultValue;
    }

    /**
     * Helper to get a strictly typed boolean environment variable.
     */
    getBool(key, defaultValue = false) {
        return this.getEnv(key, defaultValue) === true;
    }
}

// Export a singleton instance
export default new ConfigService();
