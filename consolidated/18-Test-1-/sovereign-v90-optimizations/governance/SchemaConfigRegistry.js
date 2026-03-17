/**
 * Manages configuration schemas, utilizing the AsyncResourceCacheManager for 
 * optimized caching, load barriers, and parallelized promise handling.
 */
class SchemaConfigRegistry {
    #cacheManager;
    #schemaLoaderFn;

    /**
     * @param {AsyncResourceCacheManager} cacheManager - Instance of the centralized cache manager (emergent plugin).
     * @param {function(string): Promise<object>} schemaLoaderFn - Function responsible for fetching raw schemas from source.
     */
    constructor(cacheManager, schemaLoaderFn) {
        this.#setupDependencies(cacheManager, schemaLoaderFn);
    }

    /**
     * Extracts synchronous dependency resolution and initialization.
     * Satisfies the synchronous setup extraction goal.
     * @private
     */
    #setupDependencies(cacheManager, schemaLoaderFn) {
        if (!cacheManager || !schemaLoaderFn) {
            this.#logSetupError('SchemaConfigRegistry requires a cacheManager and a schemaLoaderFn.');
        }
        this.#cacheManager = cacheManager;
        this.#schemaLoaderFn = schemaLoaderFn;
    }

    /**
     * I/O Proxy: Delegates error logging and throws during setup.
     * @private
     */
    #logSetupError(message) {
        throw new Error(message);
    }

    /**
     * I/O Proxy: Executes the external schema loader function.
     * @private
     */
    #delegateToSchemaLoaderFn(schemaKey) {
        return this.#schemaLoaderFn(schemaKey);
    }

    /**
     * I/O Proxy: Delegates resource fetching and concurrency management to the cache manager.
     * @private
     */
    #delegateToCacheManagerGetResource(uniqueKey, loader) {
        return this.#cacheManager.getResource(uniqueKey, loader);
    }

    /**
     * I/O Proxy: Delegates cache invalidation to the cache manager.
     * @private
     */
    #delegateToCacheManagerInvalidate(key) {
        this.#cacheManager.invalidate(key);
    }
    
    /**
     * I/O Proxy: Delegates cache clearing to the cache manager.
     * @private
     */
    #delegateToCacheManagerClear() {
        this.#cacheManager.clear();
    }


    /**
     * Retrieves a configuration schema by key. 
     * Automatically handles caching and prevents concurrent loading for the same key.
     * @param {string} schemaKey - The identifier for the schema.
     * @returns {Promise<object>} The configuration schema.
     */
    async getSchema(schemaKey) {
        // Use a unique prefix to namespace resources if cacheManager is shared
        const uniqueKey = `schema:${schemaKey}`;
        
        // Define the specific loader function for this key, using the isolated schema loader proxy
        const loader = () => this.#delegateToSchemaLoaderFn(schemaKey);

        // Delegate caching and concurrency management to the plugin via proxy
        return this.#delegateToCacheManagerGetResource(uniqueKey, loader);
    }

    /**
     * Invalidates a specific cached schema, forcing a reload on the next access.
     * @param {string} schemaKey
     */
    invalidateSchema(schemaKey) {
        const key = `schema:${schemaKey}`;
        this.#delegateToCacheManagerInvalidate(key);
    }

    /**
     * Clears the entire schema registry cache.
     */
    clearCache() {
        this.#delegateToCacheManagerClear();
    }
}