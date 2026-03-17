/**
 * @module DataSourceRouter
 * @description Centralized data access utility employing the Strategy pattern (Service Locator + Strategy).
 * It routes requests using definitions from configured primitives, enforcing caching,
 * transformation, and security constraints. Employs a dedicated StrategyResolver for handler management.
 */

// Infrastructure and Utilities
import { DataSourcePrimitives } from '../../config/DataSourcePrimitives.json';
import CacheManager from './CacheManager.js';
import Logger from '../utility/Logger.js'; 
import DataTransformer from './DataTransformer.js';
import { RetrievalError, HandlerInstantiationError } from '../utility/DataError.js';
import StrategyResolver from '../utility/StrategyResolver.js';

// Strategy Configuration Map
import DataSourceHandlersMap from './DataSourceHandlersMap.js'; 

class DataSourceRouter {
    #primitives;
    #logger;
    #cacheManager;
    #dataTransformer;
    #strategyResolver;

    /**
     * Initializes the router with core dependencies, allowing for dependency injection (DI).
     * @param {object} dependencies - External utilities for routing operations.
     */
    constructor(dependencies = {}) {
        this.#primitives = this.#setupPrimitives(); 
        this.#resolveCoreDependencies(dependencies);
        this.#setupStrategyResolver();
    }

    /**
     * Defines and guarantees immutability for the core configuration primitives.
     * @private
     * @returns {object}
     */
    #setupPrimitives() {
        return Object.freeze(DataSourcePrimitives); 
    }

    /**
     * Resolves and encapsulates core dependencies (Logger, CacheManager, DataTransformer).
     * @private
     * @param {object} dependencies - External dependencies.
     */
    #resolveCoreDependencies(dependencies) {
        this.#logger = dependencies.Logger || Logger.module('DataSourceRouter');
        this.#cacheManager = dependencies.CacheManager || CacheManager;
        this.#dataTransformer = dependencies.DataTransformer || DataTransformer;
    }

    /**
     * Initializes the Strategy Resolver dependency.
     * @private
     */
    #setupStrategyResolver() {
        const resolverDependencies = { Logger: this.#logger };
        this.#strategyResolver = new StrategyResolver(DataSourceHandlersMap, resolverDependencies);
    }

    /**
     * Delegates to the StrategyResolver and handles specific error mapping for handler setup failures.
     * @private
     * @param {string} retrieval_method - The handler name.
     * @returns {object} The instantiated handler object.
     */
    #resolveHandlerStrategy(retrieval_method) {
        try {
            return this.#strategyResolver.resolve(retrieval_method);
        } catch (e) {
            // Map generic StrategyResolver errors to specific domain errors
            this.#logger.error(`Strategy resolution failed for ${retrieval_method}:`, e);
            
            if (e.message.includes('Unsupported strategy')) {
                throw new RetrievalError(
                    `Unsupported retrieval method: ${retrieval_method}. Check DataSourceHandlersMap.`,
                    'CONFIGURATION_MISSING'
                );
            } else if (e.message.includes('instantiation error')) {
                throw new HandlerInstantiationError(`Handler configuration error for ${retrieval_method}. Details: ${e.message}`);
            } else {
                 // Re-throw unexpected errors
                throw e;
            }
        }
    }

    /**
     * Executes the external data handler (I/O proxy) and encapsulates error handling.
     * @private
     * @param {object} handler - The instantiated data handler strategy.
     * @param {string} key - The data source key.
     * @param {object} sourceConfig - The configuration for the data source.
     * @param {string} retrieval_method - The handler name (for logging).
     * @returns {Promise<any>} Raw data retrieved from the source.
     */
    async #executeRetrievalHandler(handler, key, sourceConfig, retrieval_method) {
        try {
            // Handlers must implement a consistent interface: handle(key, source_config)
            return await handler.handle(key, sourceConfig); 
        } catch (error) {
            this.#logger.error(`Handler execution failed for ${key} (${retrieval_method}):`, error);
            throw new RetrievalError(`Data retrieval failed for ${key}. Source Handler Error: ${error.message}`, 'HANDLER_EXECUTION_FAILED');
        }
    }

    /**
     * Retrieves data for a specified primitive key, enforcing defined constraints.
     * @param {string} key - The data source key (e.g., 'RCM').
     * @returns {Promise<any>} The retrieved and decoded data.
     */
    async retrieve(key) {
        const sourceConfig = this.#primitives[key];
        
        if (!sourceConfig) {
            this.#logger.warn(`Attempted retrieval for unknown data primitive: ${key}`);
            throw new RetrievalError(`Unknown data source primitive: ${key}`, 'PRIMITIVE_NOT_FOUND');
        }

        // Destructure necessary parameters for clarity
        const { caching_policy, retrieval_method } = sourceConfig;

        // 1. Check Cache Policy
        const cachedData = this.#cacheManager.get(key, caching_policy);
        if (cachedData) {
            this.#logger.silly(`Cache HIT for ${key}. Policy: ${caching_policy}`);
            return cachedData;
        }

        // 2. Determine and Instantiate Retrieval Strategy (Handler)
        const handler = this.#resolveHandlerStrategy(retrieval_method);

        this.#logger.info(`Fetching data for ${key} using strategy: ${retrieval_method}`);

        // 3. Execute Handler Retrieval (via I/O proxy)
        const rawData = await this.#executeRetrievalHandler(handler, key, sourceConfig, retrieval_method); 

        // 4. Apply Security and Transformation Logic
        const transformedData = this.#dataTransformer.transform(rawData, sourceConfig);

        // 5. Update Cache
        this.#cacheManager.set(key, transformedData, caching_policy);
        this.#logger.silly(`Result for ${key} written to cache.`);

        return transformedData;
    }
}

// Instantiate using default infrastructure, providing a clean singleton.
export default new DataSourceRouter({});