/**
 * @file ConfigServiceKernel.js
 * @role Centralized Configuration and Environment Management Kernel
 * This kernel manages environment variables and provides standardized path 
 * resolution by strictly delegating external operations to injected services, 
 * eliminating direct coupling to global state (path, process.env).
 */

class ConfigServiceKernel {
    #environmentAccessor;
    #pathResolver;
    #typeDecoder;

    #NODE_ENV;
    #IS_PRODUCTION;
    #IS_DEVELOPMENT;
    #ROOT_DIR;
    #CONFIG_DIR;

    /**
     * @param {object} dependencies
     * @param {EnvironmentAccessInterfaceKernel} dependencies.environmentAccessor - Abstraction for reading process.env and cwd.
     * @param {SystemPathResolverKernel} dependencies.pathResolver - Abstraction for path joining and resolving.
     * @param {EnvironmentTypeDecoderInterfaceKernel} dependencies.typeDecoder - Utility for parsing environment variable types.
     */
    constructor({ environmentAccessor, pathResolver, typeDecoder }) {
        this.#environmentAccessor = environmentAccessor;
        this.#pathResolver = pathResolver;
        this.#typeDecoder = typeDecoder;
        
        this.#setupDependencies();
    }

    /**
     * Rigorously extracts synchronous dependency setup and initial path resolution.
     * @private
     */
    #setupDependencies() {
        if (!this.#environmentAccessor || !this.#pathResolver || !this.#typeDecoder) {
            throw new Error('ConfigServiceKernel initialization failed: Missing required dependencies.');
        }

        // 1. Resolve Environment
        this.#NODE_ENV = this.#delegateToEnvironmentGet('NODE_ENV') || 'development';
        this.#IS_PRODUCTION = this.#NODE_ENV === 'production';
        this.#IS_DEVELOPMENT = this.#NODE_ENV === 'development';

        // 2. Resolve Base Paths
        const cwd = this.#delegateToEnvironmentGetCwd();
        
        // Resolve the root directory using the injected path service
        this.#ROOT_DIR = this.#delegateToPathResolve(cwd);
        const SRC_DIR = this.#delegateToPathJoin(this.#ROOT_DIR, 'src');
        
        // Store the configuration directory path
        this.#CONFIG_DIR = this.#delegateToPathJoin(SRC_DIR, 'config');
    }
    
    // --- I/O Proxy Methods: Encapsulating External Interactions ---

    #delegateToEnvironmentGet(key) {
        return this.#environmentAccessor.getEnvironmentVariable(key);
    }
    
    #delegateToEnvironmentGetCwd() {
        // Delegates the potentially environment-dependent call for current working directory.
        return this.#environmentAccessor.getCurrentWorkingDirectory();
    }
    
    #delegateToPathResolve(pathA) {
        // Delegates path resolution to the injected path service.
        return this.#pathResolver.resolve(pathA);
    }

    #delegateToPathJoin(...segments) {
        // Delegates path concatenation to the injected path service.
        return this.#pathResolver.join(...segments);
    }

    #delegateToTypeDecoder(value) {
        // Delegates type decoding to the injected utility.
        return this.#typeDecoder.execute(value);
    }

    // --- Public Interface ---

    /**
     * Retrieves the current environment string.
     */
    getEnvironment() {
        return this.#NODE_ENV;
    }

    /**
     * Returns the determined application root directory path.
     */
    getRootDir() {
        return this.#ROOT_DIR;
    }

    /**
     * Standardizes critical application paths.
     * @param {string} filename The name of the config file (e.g., 'governance').
     * @param {string} [extension='.yaml'] The expected file extension.
     * @returns {string} The full path to the configuration file.
     */
    getConfigPath(filename, extension = '.yaml') {
        return this.#delegateToPathJoin(this.#CONFIG_DIR, `${filename}${extension}`);
    }

    /**
     * Gets a variable based on environment preference or default, with type parsing.
     * @param {string} key The environment variable key.
     * @param {any} defaultValue The fallback value.
     * @returns {any} The retrieved and parsed value.
     */
    getEnv(key, defaultValue) {
        const envValue = this.#delegateToEnvironmentGet(key);

        if (envValue !== undefined) {
            return this.#delegateToTypeDecoder(envValue);
        }

        // If default value is provided, ensure it is parsed if it's a string, mirroring original behavior.
        if (typeof defaultValue === 'string') {
             return this.#delegateToTypeDecoder(defaultValue);
        }

        return defaultValue;
    }

    /**
     * Helper to get a strictly typed boolean environment variable.
     */
    getBool(key, defaultValue = false) {
        return this.getEnv(key, defaultValue) === true;
    }

    /**
     * Check if the environment is set to production.
     */
    isProduction() {
        return this.#IS_PRODUCTION;
    }

    /**
     * Check if the environment is set to development.
     */
    isDevelopment() {
        return this.#IS_DEVELOPMENT;
    }
}

// Export the class, removing the anti-pattern singleton export.
export default ConfigServiceKernel;