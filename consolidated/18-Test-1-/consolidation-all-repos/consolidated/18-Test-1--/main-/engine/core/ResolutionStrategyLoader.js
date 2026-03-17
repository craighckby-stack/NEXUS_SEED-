/**
 * ResolutionStrategyLoader
 * 
 * Utility responsible for dynamically loading, validating, and caching resolution strategy modules 
 * defined in the ConstraintResolutionEngine definition schema.
 * Strategies must implement the IResolutionStrategy interface (requiring a 'resolve' method).
 */
class ResolutionStrategyLoader {
    /** @type {object} - The raw strategy definitions loaded from configuration. */
    #strategies;
    /** @type {Map<string, object>} - Cache for fully instantiated and initialized strategy objects. */
    #strategyCache;
    /** @type {Map<string, Promise<object>>} - Map storing promises for strategies currently being loaded, preventing race conditions. */
    #loadingPromises;
    /** @type {function(string): Promise<object>} - Dynamic module resolver function. */
    _resolveModule; 

    /**
     * @param {object} definitionConfig - Configuration object containing resolution strategies.
     * @param {object} definitionConfig.resolutionStrategies - Map of strategy IDs to their definitions.
     * @param {function(string): Promise<object>} [moduleResolver] - Custom module loading function (defaults to environment's standard dynamic `import`).
     */
    constructor(definitionConfig, moduleResolver) {
        if (!definitionConfig || typeof definitionConfig.resolutionStrategies !== 'object') {
            throw new Error('ResolutionStrategyLoader requires a valid definitionConfig with resolutionStrategies defined.');
        }
        
        this.#strategies = definitionConfig.resolutionStrategies;
        this.#strategyCache = new Map();
        this.#loadingPromises = new Map();
        
        // Inject or default the module loading function for improved testability and flexibility.
        this._resolveModule = moduleResolver || ((path) => import(path));
    }

    /**
     * Retrieves a loaded strategy instance, or dynamically loads and caches it.
     * Implements concurrency control.
     * 
     * @param {string} strategyId - The unique ID of the strategy.
     * @returns {Promise<object>} The instantiated strategy object (IResolutionStrategy).
     * @throws {Error} If the strategy ID is not defined or loading fails.
     */
    async getStrategy(strategyId) {
        // 1. Check cache (fast path)
        if (this.#strategyCache.has(strategyId)) {
            return this.#strategyCache.get(strategyId);
        }

        // 2. Check ongoing loading promises (concurrency protection)
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
            // Re-throw handled errors
            throw e; 
        } finally {
            // 6. Ensure the loading promise is removed regardless of success or failure
            this.#loadingPromises.delete(strategyId);
        }
    }

    /**
     * Internal method to handle dynamic load, instantiation, validation, and initialization.
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
            const StrategyModule = await this._resolveModule(implementationPath);
            
            // Handle ES Module 'default' export or named export matching the ID.
            const StrategyClass = StrategyModule.default || StrategyModule[strategyId];
            
            if (typeof StrategyClass !== 'function') {
                 throw new Error(`Module loaded from ${implementationPath} did not export a constructable class or constructor.`);
            }

            const instance = new StrategyClass(defaultParameters);
            
            this._validateStrategyInstance(strategyId, instance, implementationPath);
            
            // Optional: Call initialize() if required for async setup
            if (typeof instance.initialize === 'function') {
                await instance.initialize();
            }
            
            return instance;
            
        } catch (e) {
            // Enhance the error message for clarity on failure point
            const baseError = e instanceof Error ? e.message : String(e);
            // Logging detailed failure for internal diagnostics
            console.error(`[StrategyLoader] Failed loading or initializing strategy '${strategyId}'. Path: ${implementationPath}.`, e);
            throw new Error(`Strategy initialization failure [${strategyId}]: ${baseError}`);
        }
    }
    
    /**
     * Runtime check to ensure the instance adheres to the IResolutionStrategy interface contract.
     * @private
     */
    _validateStrategyInstance(strategyId, instance, path) {
        if (typeof instance.resolve !== 'function') {
            throw new Error(`Strategy '${strategyId}' instantiated from ${path} does not implement the required 'resolve()' method (IResolutionStrategy contract).`);
        }
    }
}

export default ResolutionStrategyLoader;