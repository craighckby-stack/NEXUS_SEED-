/**
 * Defines and freezes the core set of DataSource primitives used across the system.
 * @returns {Readonly<Record<string, string>>}
 */
const _defineDataSourcePrimitives = () => {
    // Enumeration of standardized data interaction primitives (data source types).
    // These constants are used as keys in DataSourceHandlersMap.js 
    // and dictate which specific handler strategy is executed by the system.
    const primitives = {
        // Core interaction types
        API_PULL_SYNC: 'API_PULL_SYNC',
        MESSAGE_BUS_ASYNC: 'MESSAGE_BUS_ASYNC',
        DATABASE_QUERY: 'DATABASE_QUERY',
        
        // Reserved keys for future architectural expansion
        CACHE_READ: 'CACHE_READ',
        SUBSCRIPTION_STREAM: 'SUBSCRIPTION_STREAM',
        EXTERNAL_SERVICE_INVOKE: 'EXTERNAL_SERVICE_INVOKE',
    };
    return Object.freeze(primitives);
};

/**
 * Derives and freezes the array of valid primitive keys from the defined map.
 * @param {Readonly<Record<string, string>>} primitivesMap
 * @returns {ReadonlyArray<string>}
 */
const _derivePrimitiveKeys = (primitivesMap) => {
    return Object.freeze(Object.keys(primitivesMap));
};

/**
 * Enumeration of standardized data interaction primitives (data source types).
 * These constants are used as keys in DataSourceHandlersMap.js 
 * and dictate which specific handler strategy is executed by the system.
 */
export const DataSourcePrimitives = _defineDataSourcePrimitives();

/**
 * Provides access to the array of valid primitive keys.
 * The array is frozen to prevent runtime modification.
 * @type {ReadonlyArray<string>}
 */
export const PRIMITIVE_KEYS = _derivePrimitiveKeys(DataSourcePrimitives);