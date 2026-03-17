/**
 * ConfigurationServiceKernel
 * Handles loading, merging, and retrieving application configuration using Dependency Injection.
 * Priorities: Defaults (Registry) -> Environment Variables (Decoder)
 */
class ConfigurationServiceKernel {
    #config;
    #defaultsRegistry;
    #envDecoder;
    #mergeTool;
    #logger;

    /**
     * @param {IConfigurationDefaultsRegistryKernel} defaultsRegistry
     * @param {IEnvironmentTypeDecoderInterfaceKernel} envDecoder
     * @param {IConfigurationDeepMergeToolKernel} mergeTool
     * @param {ILoggerToolKernel} logger
     */
    constructor(defaultsRegistry, envDecoder, mergeTool, logger) {
        this.#defaultsRegistry = defaultsRegistry;
        this.#envDecoder = envDecoder;
        this.#mergeTool = mergeTool;
        this.#logger = logger;

        // Rigorously enforce synchronous setup extraction
        this.#setupDependencies();
    }

    /**
     * Isolates configuration loading and merging logic.
     * @private
     */
    #setupDependencies() {
        const defaults = this.#defaultsRegistry.getDefaults();
        
        // Start configuration with defaults
        let baseConfig = { ...defaults }; 
        
        // Load environment overrides using the decoder
        const envOverrides = this.#loadEnvironmentVariables(defaults);

        // Merge environment overrides onto base config using the injected tool
        // We assume the merge tool handles cloning to maintain safety, but simple shallow copy is sufficient here.
        this.#config = this.#mergeTool.deepMerge(baseConfig, envOverrides); 
    }

    /**
     * Loads configuration overrides from the environment, using defaults for type guidance.
     * @private
     * @param {object} defaults - The registered defaults dictionary for type guidance.
     * @returns {object} The extracted and type-cast environment overrides.
     */
    #loadEnvironmentVariables(defaults) {
        // Access environment variables via the injected decoder tool
        const env = this.#envDecoder.getEnvironment(); 
        const overrides = {};
        
        // Helper for parsing integers
        const parseInteger = (key, fallback) => {
            const value = env[key];
            if (value === undefined) return undefined;
            const parsed = parseInt(String(value), 10);
            return isNaN(parsed) ? fallback : parsed;
        };

        // Numeric overrides
        ['PORT', 'MAX_CONTEXT_TOKENS', 'SERVICE_TIMEOUT_MS'].forEach(key => {
            const value = parseInteger(key, defaults[key]);
            // Only include the override if it differs from the default (and was successfully parsed)
            if (value !== undefined && value !== defaults[key]) {
                overrides[key] = value;
            }
        });

        // String overrides
        if (env.LOG_LEVEL !== undefined) {
            overrides.LOG_LEVEL = String(env.LOG_LEVEL).toLowerCase();
        }
        if (env.API_KEY_ENV_VAR !== undefined) {
            overrides.API_KEY_ENV_VAR = String(env.API_KEY_ENV_VAR);
        }

        // Boolean overrides
        if (env.ENABLE_TELEMETRY !== undefined) {
             overrides.ENABLE_TELEMETRY = String(env.ENABLE_TELEMETRY).toLowerCase() === 'true';
        }
        
        return overrides;
    }

    /**
     * Retrieves a configuration value by key.
     * @param {string} key
     * @returns {any}
     */
    get(key) {
        const value = this.#config[key];
        if (value === undefined) {
            // Use injected logger instead of console.warn
            this.#logger.warn(`[ConfigurationServiceKernel] Accessing unknown key: ${key}`);
        }
        return value;
    }

    /**
     * Sets a configuration value at runtime (maintaining original service capability).
     * @param {string} key
     * @param {any} value
     */
    set(key, value) {
        this.#config[key] = value;
    }
}

module.exports = ConfigurationServiceKernel;