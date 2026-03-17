/**
 * Enumeration of standardized data interaction primitives (data source types).
 * These constants are used as keys in DataSourceHandlersMap.js 
 * and dictate which specific handler strategy is executed by the system.
 */
export const DataSourcePrimitives = Object.freeze({
    // Core interaction types
    API_PULL_SYNC: 'API_PULL_SYNC',
    MESSAGE_BUS_ASYNC: 'MESSAGE_BUS_ASYNC',
    DATABASE_QUERY: 'DATABASE_QUERY',
    
    // Reserved keys for future architectural expansion
    CACHE_READ: 'CACHE_READ',
    SUBSCRIPTION_STREAM: 'SUBSCRIPTION_STREAM',
    EXTERNAL_SERVICE_INVOKE: 'EXTERNAL_SERVICE_INVOKE',
});

/**
 * Provides access to the array of valid primitive keys.
 * @type {ReadonlyArray<string>}
 */
export const PRIMITIVE_KEYS = Object.keys(DataSourcePrimitives);