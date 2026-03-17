/**
 * Abstract interface for fetching schema data from external sources.
 * This decouples the resolution logic (caching, immutability) from the I/O mechanism.
 */
interface ISchemaFetcher {
    /**
     * Fetches a schema definition based on its unique identifier.
     * @param schemaId The unique identifier (URI, path, etc.).
     * @returns A Promise resolving to the raw schema object.
     */
    fetch(schemaId: string): Promise<any>;
}

/**
 * Efficient service for resolving schemas, utilizing caching and promoting immutability.
 */
export class SchemaResolverService {
    // O(1) Cache Map for resolved schemas
    private readonly #schemaCache = new Map<string, Readonly<any>>();
    
    // Dependency Injection of the abstracted I/O mechanism
    private readonly #fetcher: ISchemaFetcher;

    constructor(fetcher: ISchemaFetcher) {
        this.#fetcher = fetcher;
    }

    // --- Private I/O Proxy Functions ---

    /** Delegates asynchronous schema fetching to the external fetcher dependency. */
    async #delegateToFetcherExecution(schemaId: string): Promise<any> {
        return this.#fetcher.fetch(schemaId);
    }

    /** Checks the cache for a schema ID. O(1) */
    #checkCache(schemaId: string): Readonly<any> | undefined {
        return this.#schemaCache.get(schemaId);
    }

    /** Updates the cache with an immutable schema. O(1) */
    #updateCache(schemaId: string, schema: Readonly<any>): void {
        this.#schemaCache.set(schemaId, schema);
    }

    /** Enforces shallow immutability on the raw schema object. */
    #freezeSchema(rawSchema: any): Readonly<any> {
        // Isolating interaction with system-level immutability enforcement
        return Object.freeze(rawSchema);
    }

    /** Logs the resolution error to the system console. */
    #logResolutionError(schemaId: string, error: unknown): void {
        // Isolating console I/O
        console.error(`[SchemaResolver] Fatal error resolving schema ${schemaId}:`, error);
    }

    /** Throws a standardized error type. */
    #throwResolutionError(schemaId: string): never {
        // Isolating error throwing
        throw new SchemaResolutionError(`Failed to resolve schema ID: ${schemaId}`);
    }

    /** Removes a specific schema from the cache. O(1) */
    #invalidateCacheEntry(schemaId: string): boolean {
        return this.#schemaCache.delete(schemaId);
    }

    /** Clears all entries in the cache. */
    #clearAllCache(): void {
        this.#schemaCache.clear();
    }

    // --- Public API ---

    /**
     * Resolves and retrieves an immutable schema, prioritizing the cache.
     * Computational Efficiency: O(1) if cached; O(Fetch Time) otherwise.
     *
     * @param schemaId The unique ID/URI of the schema to resolve.
     * @returns A promise resolving to the immutable schema object.
     */
    public async resolveSchema(schemaId: string): Promise<Readonly<any>> {
        const cachedSchema = this.#checkCache(schemaId);
        
        // 1. Cache Hit Check
        if (cachedSchema) {
            return cachedSchema;
        }

        // 2. Fetch and Cache
        try {
            const rawSchema = await this.#delegateToFetcherExecution(schemaId);

            // 3. Enforce Immutability
            const immutableSchema = this.#freezeSchema(rawSchema);
            
            // 4. Cache Miss Update
            this.#updateCache(schemaId, immutableSchema);
            
            return immutableSchema;
        } catch (error) {
            this.#logResolutionError(schemaId, error);
            this.#throwResolutionError(schemaId);
        }
    }

    /**
     * Clears a specific schema from the cache, forcing a re-fetch.
     * O(1) removal efficiency.
     */
    public invalidate(schemaId: string): boolean {
        return this.#invalidateCacheEntry(schemaId);
    }

    /**
     * Clears the entire cache. Optimized for high-throughput environment resets.
     */
    public clearCache(): void {
        this.#clearAllCache();
    }
}

// Placeholder error type for abstraction
class SchemaResolutionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'SchemaResolutionError';
    }
}