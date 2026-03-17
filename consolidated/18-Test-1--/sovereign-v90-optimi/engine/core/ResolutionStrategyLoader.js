/**
 * @typedef {object} IResolutionStrategy
 * @property {function(object, object): object} resolve - The core method to execute the resolution logic.
 * @property {function(): Promise<void>} [initialize] - Optional asynchronous setup method.
 */

/**
 * @typedef {object} IAsyncCacheGuard
 * @property {function(string, Map<string, any>, Map<string, Promise<any>>, function(string): Promise<any>): Promise<any>} guard - Executes the guarded loading logic using provided maps.
 */

/**
 * @typedef {object} IDynamicModuleLoader
 * @property {function(string, object, function(string): Promise<object>, function(any, string, string): void, object): Promise<any>} loadInstance
 */

/**
 * ResolutionStrategyLoader
 * 
 * Utility responsible for dynamically loading, validating, and caching resolution strategy modules 
 * defined in the ConstraintResolutionEngine definition schema.
 * Strategies must implement the IResolutionStrategy interface.
 * 
 * This class delegates dynamic loading/instantiation logic to IDynamicModuleLoader and caching/concurrency
 * control to IAsyncCacheGuard.
 */
class ResolutionStrategyLoader {
    /** @type {object} - The raw strategy definitions loaded from configuration. */
    #strategies;
    /** @type {Map<string, IResolutionStrategy>} - Cache for fully instantiated and initialized strategy objects. */
    #strategyCache;
    /** @type {Map<string, Promise<IResolutionStrategy>>} - Map storing promises for strategies currently being loaded. */
    #loadingPromises;
    /** @type {function(string): Promise<object>} - Dynamic module resolver function. */
    #resolveModule; 
    /** @type {object} - Injected logging utility (must expose 'error'). */
    #logger;
    /** @type {IAsyncCacheGuard} - Plugin for guarded asynchronous loading. */
    #cacheGuard; 
    /** @type {IDynamicModuleLoader} - Plugin for dynamic module loading and instantiation. */
    #moduleLoader;

    /**
     * Utility function for default dynamic module loading (external I/O).
     * @type {function(string): Promise<object>}
     */
    #delegateToDefaultModuleResolution = (path) => import(path);

    /**
     * @param {object} definitionConfig - Configuration object containing resolution strategies.
     * @param {object} definitionConfig.resolutionStrategies - Map of strategy IDs to their definitions.
     * @param {object} dependencies - Core dependencies.
     * @param {function(string): Promise<object>} [dependencies.moduleResolver] - Custom module loading function (defaults to standard dynamic `import`).
     * @param {object} [dependencies.logger=console] - Logging utility (e.g., an instance of engine/utilities/Logger).
     * @param {IAsyncCacheGuard} dependencies.asyncCacheGuard - The asynchronous caching and guarding utility.
     * @param {IDynamicModuleLoader} dependencies.dynamicModuleLoader - Utility for loading and instantiating modules.
     */
    constructor(definitionConfig, dependencies = {}) {
        this.#setupDependencies(definitionConfig, dependencies);
    }

    /**
     * Extracts synchronous dependency resolution and configuration.
     * @param {object} definitionConfig
     * @param {object} dependencies
     */
    #setupDependencies(definitionConfig, dependencies) {
        if (!definitionConfig || typeof definitionConfig.resolutionStrategies !== 'object' || definitionConfig.resolutionStrategies === null) {
            throw new Error('ResolutionStrategyLoader requires a valid definitionConfig with resolutionStrategies defined.');
        }
        
        const { moduleResolver, logger = console, asyncCacheGuard, dynamicModuleLoader } = dependencies;

        if (!asyncCacheGuard || typeof asyncCacheGuard.guard !== 'function') {
            throw new Error('ResolutionStrategyLoader requires asyncCacheGuard utility in dependencies.');
        }
        
        if (!dynamicModuleLoader || typeof dynamicModuleLoader.loadInstance !== 'function') {
            throw new Error('ResolutionStrategyLoader requires dynamicModuleLoader utility in dependencies.');
        }

        this.#strategies = definitionConfig.resolutionStrategies;
        this.#strategyCache = new Map();
        this.#loadingPromises = new Map();
        
        // Use an injected logger for production resilience and standardized logging.
        this.#logger = logger;
        
        // Inject or default the module loading function, utilizing the proxy for default I/O.
        this.#resolveModule = moduleResolver || this.#delegateToDefaultModuleResolution;
        this.#cacheGuard = asyncCacheGuard;
        this.#moduleLoader = dynamicModuleLoader;
    }

    /**
     * Retrieves a loaded strategy instance, or dynamically loads and caches it.
     * Implements concurrency control via Promise caching.
     * 
     * @param {string} strategyId - The unique ID of the strategy.
     * @returns {Promise<IResolutionStrategy>} The instantiated strategy object.
     * @throws {Error} If the strategy ID is not defined or loading fails.
     */
    async getStrategy(strategyId) {
        // Delegate concurrency control, caching, and promise cleanup to the plugin via proxy.
        return this.#delegateToCacheGuard(strategyId);
    }

    /**
     * Isolates interaction with IAsyncCacheGuard for concurrency control (External I/O delegation).
     * @param {string} strategyId
     * @returns {Promise<IResolutionStrategy>}
     */
    #delegateToCacheGuard(strategyId) {
        return this.#cacheGuard.guard(
            strategyId,
            this.#strategyCache, 
            this.#loadingPromises, 
            this.#executeLoadingTask.bind(this) // Pass the actual loader logic
        );
    }

    /**
     * Internal method to handle definition lookup and delegate loading/initialization 
     * to the generalized DynamicModuleLoader plugin.
     * 
     * @param {string} strategyId
     * @returns {Promise<IResolutionStrategy>}
     * @private
     */
    async #executeLoadingTask(strategyId) {
        const def = this.#strategies[strategyId];
        if (!def) {
            throw new Error(`Strategy ID '${strategyId}' not found in the resolution strategies definition.`);
        }
        
        // Delegate dynamic import, instantiation, validation, and initialization 
        // using the injected module loader via proxy.
        return this.#delegateToModuleLoader(strategyId, def);
    }

    /**
     * Isolates interaction with IDynamicModuleLoader for instantiation and initialization (External I/O delegation).
     * @param {string} strategyId
     * @param {object} definition
     * @returns {Promise<any>}
     */
    #delegateToModuleLoader(strategyId, definition) {
        return this.#moduleLoader.loadInstance(
            strategyId,
            definition,
            this.#resolveModule,
            this.#validateStrategyInstance.bind(this), // Strategy-specific validation
            this.#logger
        );
    }
    
    /**
     * Runtime check to ensure the instance adheres to the IResolutionStrategy interface contract.
     * Enforces the required 'resolve' method.
     * 
     * @param {IResolutionStrategy} instance - The instance to validate.
     * @param {string} strategyId - The unique ID of the strategy.
     * @param {string} path - The implementation path.
     * @private
     */
    #validateStrategyInstance(instance, strategyId, path) {
        if (typeof instance.resolve !== 'function') {
            throw new Error(`Strategy '${strategyId}' instantiated from ${path} does not implement the required 'resolve()' method (IResolutionStrategy contract).`);
        }
    }
}

export default ResolutionStrategyLoader;