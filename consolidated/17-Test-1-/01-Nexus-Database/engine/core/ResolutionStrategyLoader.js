/**
 * @typedef {object} IResolutionStrategy
 * @property {function(object, object): object} resolve - The core method to execute the resolution logic.
 * @property {function(): Promise<void>} [initialize] - Optional asynchronous setup method.
 */

/**
 * ResolutionStrategyLoader
 * 
 * Utility responsible for dynamically loading, validating, and caching resolution strategy modules 
 * defined in the ConstraintResolutionEngine definition schema.
 * Strategies must implement the IResolutionStrategy interface.
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

    /**
     * @param {object} definitionConfig - Configuration object containing resolution strategies.
     * @param {object} definitionConfig.resolutionStrategies - Map of strategy IDs to their definitions.
     * @param {object} dependencies - Core dependencies.
     * @param {function(string): Promise<object>} [dependencies.moduleResolver] - Custom module loading function (defaults to standard dynamic `import`).
     * @param {object} [dependencies.logger=console] - Logging utility (e.g., an instance of engine/utilities/Logger).
     */
    constructor(definitionConfig, dependencies = {}) {
        if (!definitionConfig || typeof definitionConfig.resolutionStrategies !== 'object') {
            throw new Error('ResolutionStrategyLoader requires a valid definitionConfig with resolutionStrategies defined.');
        }
        
        const { moduleResolver, logger = console } = dependencies;

        this.#strategies = definitionConfig.resolutionStrategies;
        this.#strategyCache = new Map();
        this.#loadingPromises = new Map();
        
        // Use an injected logger for production resilience and standardized logging.
        this.#logger = logger;
        
        // Inject or default the module loading function for improved testability and flexibility.
        this.#resolveModule = moduleResolver || ((path) => import(path));
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
        // 1. Cache hit (fast path)
        if (this.#strategyCache.has(strategyId)) {
            return this.#strategyCache.get(strategyId);
        }

        // 2. Loading in progress (concurrency protection)
        if (this.#loadingPromises.has(strategyId)) {
            return this.#loadingPromises.get(strategyId);
        }

        // 3. Define the actual loading task
        const loadingTask = this._executeLoadingTask(strategyId);

        // 4. Store the promise before awaiting
        this.#loadingPromises.set(strategyId, loadingTask);

        try {
            const strategyInstance = await loadingTask;
            
            // 5. Cache strategy instance on success
            this.#strategyCache.set(strategyId, strategyInstance);
            return strategyInstance;
        } catch (e) {
            // Error handling/logging is detailed inside _executeLoadingTask
            throw e; 
        } finally {
            // 6. Ensure the loading promise is removed regardless of success or failure
            this.#loadingPromises.delete(strategyId);
        }
    }

    /**
     * Internal method to handle dynamic load, instantiation, validation, and initialization.
     * Handles specific error logging internally.
     * 
     * @param {string} strategyId
     * @returns {Promise<IResolutionStrategy>}
     * @private
     */
    async _executeLoadingTask(strategyId) {
        const def = this.#strategies[strategyId];
        if (!def) {
            throw new Error(`Strategy ID '${strategyId}' not found in the resolution strategies definition.`);
        }
        
        const { implementationPath, defaultParameters = {} } = def;

        if (!implementationPath) {
             throw new Error(`Strategy definition for '${strategyId}' is missing 'implementationPath'.`);
        }

        try {
            // Use the injected resolver
            const StrategyModule = await this.#resolveModule(implementationPath);
            
            // Handle ES Module 'default' export or named export matching the ID.
            const StrategyClass = StrategyModule.default || StrategyModule[strategyId];
            
            if (typeof StrategyClass !== 'function') {
                 throw new Error(`Module loaded from ${implementationPath} did not export a constructable class or constructor.`);
            }

            const instance = new StrategyClass(defaultParameters);
            
            this._validateStrategyInstance(strategyId, instance, implementationPath);
            
            // Optional async initialization hook
            if (typeof instance.initialize === 'function') {
                await instance.initialize();
            }
            
            return instance;
            
        } catch (e) {
            // Log detailed failure using the injected logger for centralized core diagnostics
            this.#logger.error(`Failed loading or initializing strategy '${strategyId}'. Path: ${implementationPath}. Error:`, e);
            
            // Re-throw a standardized public error
            const baseError = e instanceof Error ? e.message : String(e);
            throw new Error(`Strategy initialization failure [${strategyId}]: ${baseError}`);
        }
    }
    
    /**
     * Runtime check to ensure the instance adheres to the IResolutionStrategy interface contract.
     * Enforces the required 'resolve' method.
     * 
     * @param {string} strategyId
     * @param {IResolutionStrategy} instance
     * @param {string} path
     * @private
     */
    _validateStrategyInstance(strategyId, instance, path) {
        if (typeof instance.resolve !== 'function') {
            throw new Error(`Strategy '${strategyId}' instantiated from ${path} does not implement the required 'resolve()' method (IResolutionStrategy contract).`);
        }
    }
}

export default ResolutionStrategyLoader;