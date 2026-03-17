/**
 * @module DataSourceRouter
 * @description Centralized data access utility employing the Strategy pattern (Service Locator + Strategy).
 * It routes requests using definitions from configured primitives, enforcing caching,
 * transformation, and security constraints. Employs lazy loading for handler strategies.
 */

// Infrastructure and Utilities
import { DataSourcePrimitives } from '../../config/DataSourcePrimitives.json';
import CacheManager from './CacheManager.js';
import Logger from '../utility/Logger.js'; 
import DataTransformer from './DataTransformer.js';
import { RetrievalError, HandlerInstantiationError } from '../utility/DataError.js'; // Proposed Utility

// Strategy Configuration Map
import DataSourceHandlersMap from './DataSourceHandlersMap.js'; 

class DataSourceRouter {
    /**
     * Initializes the router with core dependencies, allowing for dependency injection (DI).
     * @param {object} dependencies - External utilities for routing operations.
     */
    constructor(dependencies = {}) {
        this.primitives = DataSourcePrimitives;
        this.logger = dependencies.Logger || Logger.module('DataSourceRouter');
        this.cacheManager = dependencies.CacheManager || CacheManager;
        this.dataTransformer = dependencies.DataTransformer || DataTransformer;
        
        // Strategy Cache: Stores instantiated handler objects (Singleton strategy per type).
        this.handlerInstances = {};
    }

    /**
     * Retrieves or lazily instantiates a Handler based on its key, ensuring singleton behavior per type.
     * @param {string} handlerKey - The key defined in DataSourceHandlersMap.
     * @returns {object} The instantiated Handler object.
     * @private
     */
    _getHandler(handlerKey) {
        if (this.handlerInstances[handlerKey]) {
            return this.handlerInstances[handlerKey];
        }
        
        const HandlerClass = DataSourceHandlersMap[handlerKey];

        if (!HandlerClass) {
            this.logger.error(`Unsupported strategy specified: ${handlerKey}`);
            throw new RetrievalError(
                `Unsupported retrieval method: ${handlerKey}. Check DataSourceHandlersMap.`,
                'CONFIGURATION_MISSING'
            );
        }
        
        try {
            // Lazy instantiation
            const handlerInstance = new HandlerClass();
            this.handlerInstances[handlerKey] = handlerInstance;
            return handlerInstance;
        } catch (e) {
            this.logger.error(`Failed to instantiate handler ${handlerKey}:`, e);
            throw new HandlerInstantiationError(`Handler configuration error for ${handlerKey}. Details: ${e.message}`);
        }
    }

    /**
     * Retrieves data for a specified primitive key, enforcing defined constraints.
     * @param {string} key - The data source key (e.g., 'RCM').
     * @returns {Promise<any>} The retrieved and decoded data.
     */
    async retrieve(key) {
        const sourceConfig = this.primitives[key];
        
        if (!sourceConfig) {
            this.logger.warn(`Attempted retrieval for unknown data primitive: ${key}`);
            throw new RetrievalError(`Unknown data source primitive: ${key}`, 'PRIMITIVE_NOT_FOUND');
        }

        // Destructure necessary parameters for clarity
        const { caching_policy, retrieval_method } = sourceConfig;

        // 1. Check Cache Policy
        const cachedData = this.cacheManager.get(key, caching_policy);
        if (cachedData) {
            this.logger.silly(`Cache HIT for ${key}. Policy: ${caching_policy}`);
            return cachedData;
        }

        // 2. Determine and Instantiate Retrieval Strategy (Handler)
        const handler = this._getHandler(retrieval_method);

        this.logger.info(`Fetching data for ${key} using strategy: ${retrieval_method}`);

        // 3. Execute Handler Retrieval
        let rawData;
        try {
            // Handlers must implement a consistent interface: handle(key, source_config)
            rawData = await handler.handle(key, sourceConfig); 
        } catch (error) {
            this.logger.error(`Handler execution failed for ${key} (${retrieval_method}):`, error);
            throw new RetrievalError(`Data retrieval failed for ${key}. Source Handler Error: ${error.message}`, 'HANDLER_EXECUTION_FAILED');
        }

        // 4. Apply Security and Transformation Logic
        const transformedData = this.dataTransformer.transform(rawData, sourceConfig);

        // 5. Update Cache
        this.cacheManager.set(key, transformedData, caching_policy);
        this.logger.silly(`Result for ${key} written to cache.`);

        return transformedData;
    }
}

// Instantiate using default infrastructure, providing a clean singleton.
export default new DataSourceRouter({});