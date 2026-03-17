/**
 * Interface placeholders based on strategic architecture goals.
 * NOTE: These modules are assumed to be implemented externally and injected.
 */

class ConfigManagerKernel {
    #config = {};

    #defaultsRegistry;
    #mergeUtility;
    #pathResolver;
    #systemPathResolver;
    #envAccess;
    #moduleDirContext;

    /**
     * @param {object} dependencies
     * @param {Object} dependencies.defaultsRegistry - ConfigDefaultsRegistryKernel instance.
     * @param {Object} dependencies.mergeUtility - IMergeUtilityToolKernel instance.
     * @param {Object} dependencies.pathResolver - IObjectPathResolverToolKernel instance.
     * @param {Object} dependencies.systemPathResolver - ISystemPathResolverKernel instance.
     * @param {Object} dependencies.envAccess - IEnvironmentAccessKernel instance.
     * @param {string} dependencies.moduleDirContext - The __dirname context of the configuration module.
     */
    constructor({ defaultsRegistry, mergeUtility, pathResolver, systemPathResolver, envAccess, moduleDirContext }) {
        this.#defaultsRegistry = defaultsRegistry;
        this.#mergeUtility = mergeUtility;
        this.#pathResolver = pathResolver;
        this.#systemPathResolver = systemPathResolver;
        this.#envAccess = envAccess;
        this.#moduleDirContext = moduleDirContext;
        
        // Synchronous setup must be isolated
        this.#setupDependencies();
    }

    /**
     * Loads defaults, environment variables, calculates derived configuration,
     * and ensures final configuration immutability.
     */
    #setupDependencies() {
        // Note: Dependency validation omitted for focused refactoring output.

        if (Object.keys(this.#config).length > 0) {
            return; // Already initialized
        }

        // 1. Start with defaults (deep clone using the merge utility for safety)
        const rawDefaults = this.#delegateToDefaultsRegistryGetDefaults();
        // Use an empty object as target to ensure cloning
        let configData = this.#delegateToMergeUtilityDeepMerge({}, rawDefaults);

        // Calculate ROOT_DIR immediately using the injected context and system path resolver
        // Original: path.resolve(__dirname, '..', '..');
        const rootDir = this.#delegateToSystemPathResolverResolve(
            this.#moduleDirContext, 
            '..', 
            '..'
        );
        this.#delegateToPathResolverSet(configData, 'app.root', rootDir);

        // 2. Apply Environment Overrides
        const envOverrides = {};
        const envMap = this.#delegateToPathResolverGet(configData, 'logging.envMap') || {};
        
        for (const [envKey, configKey] of Object.entries(envMap)) {
            const envValue = this.#delegateToEnvironmentGet(envKey);
            if (envValue !== undefined) {
                this.#delegateToPathResolverSet(envOverrides, configKey, envValue);
            }
        }

        // Merge environment overrides onto defaults
        configData = this.#delegateToMergeUtilityDeepMerge(configData, envOverrides);
        
        // Clean up the map after use
        this.#delegateToPathResolverDelete(configData, 'logging.envMap');

        // 3. Calculate Derived Paths
        const appRoot = this.#delegateToPathResolverGet(configData, 'app.root');
        const logsDirName = this.#delegateToPathResolverGet(configData, 'dirs.logs');

        // Original: path.join(configData.app.root, configData.dirs.logs);
        const logsDirPath = this.#delegateToSystemPathResolverJoin(appRoot, logsDirName);

        // Store the calculated logs directory path
        this.#delegateToPathResolverSet(configData, 'dirs.logsPath', logsDirPath);

        // Calculate full audit log path
        const auditFileName = this.#delegateToPathResolverGet(configData, 'logging.auditFileName');
        // Original: path.join(logsDirPath, configData.logging.auditFileName);
        const auditPath = this.#delegateToSystemPathResolverJoin(logsDirPath, auditFileName);

        this.#delegateToPathResolverSet(configData, 'logging.auditPath', auditPath);
        
        // Ensure final configuration is immutable
        this.#config = Object.freeze(configData); 
    }
    
    // --- I/O and Utility Proxy Methods ---

    #delegateToDefaultsRegistryGetDefaults() {
        return this.#defaultsRegistry.getDefaults();
    }

    #delegateToMergeUtilityDeepMerge(target, source) {
        // Assuming the merge utility exposes a 'deepMerge' method
        return this.#mergeUtility.deepMerge(target, source); 
    }

    #delegateToPathResolverSet(target, key, value) {
        // Assuming IObjectPathResolverToolKernel supports 'set'
        return this.#pathResolver.set(target, key, value);
    }
    
    #delegateToPathResolverGet(target, key) {
        // Assuming IObjectPathResolverToolKernel supports 'get'
        return this.#pathResolver.get(target, key);
    }
    
    #delegateToPathResolverDelete(target, key) {
        // Assuming IObjectPathResolverToolKernel supports 'delete'
        return this.#pathResolver.delete(target, key);
    }

    #delegateToSystemPathResolverResolve(...parts) {
        // Assuming ISystemPathResolverKernel supports 'resolve'
        return this.#systemPathResolver.resolve(...parts);
    }

    #delegateToSystemPathResolverJoin(...parts) {
        // Assuming ISystemPathResolverKernel supports 'join'
        return this.#systemPathResolver.join(...parts);
    }

    #delegateToEnvironmentGet(key) {
        // Assuming IEnvironmentAccessKernel supports 'get'
        return this.#envAccess.get(key);
    }

    /**
     * Retrieves a configuration value by dot notation key (e.g., 'logging.auditPath')
     * @param {string} key - Dot-separated path to the configuration value.
     * @returns {any | undefined}
     */
    get(key) {
        if (Object.keys(this.#config).length === 0) {
             throw new Error("ConfigManagerKernel accessed before instantiation or initialization failed.");
        }

        return this.#delegateToPathResolverGet(this.#config, key);
    }
}

module.exports = ConfigManagerKernel;