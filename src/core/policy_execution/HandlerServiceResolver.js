/**
 * HandlerServiceResolver (HSR)
 * Mission: Dynamically resolves and instantiates handler services defined in the configuration,
 * associating them with necessary execution metadata (e.g., timeouts, retries).
 *
 * Refactoring Note: Dependency loading logic has been abstracted out and injected
 * via the 'serviceLoader' function to decouple HSR from specific module resolution methods (e.g., synchronous 'require').
 */

class HandlerServiceResolver {
    /**
     * @param {Object} handlerRegistryConfig - Configuration mapping handler IDs to paths and metadata.
     * @param {function(string): Object} serviceLoader - Function to load a module/service instance by name (e.g., using a DI container).
     */
    constructor(handlerRegistryConfig, serviceLoader) {
        if (typeof serviceLoader !== 'function') {
            throw new TypeError("HSR requires a callable serviceLoader function for dependency resolution.");
        }
        this.registry = handlerRegistryConfig;
        this.loadService = serviceLoader;
        this.cache = new Map();
        this.isInitialized = false;
    }

    /**
     * Initializes all handlers specified in the registry, resolving and caching their dependencies.
     */
    async initialize() {
        if (this.isInitialized) return; 
        console.log("HSR: Initializing execution handlers...");
        
        const resolutions = Object.entries(this.registry).map(([id, definition]) => 
            this._resolveAndRegister(id, definition)
        );

        // Resolve all concurrently to speed up startup
        await Promise.all(resolutions);
        this.isInitialized = true;
    }

    /**
     * Retrieves a prepared execution handler object by its ID.
     * @param {string} handlerId - The symbolic ID from the handler configuration.
     * @returns {{handler: Function, metadata: Object}} The callable handler function wrapped with execution metadata.
     */
    getHandler(handlerId) {
        const handler = this.cache.get(handlerId);
        if (!handler) {
            throw new Error(`Handler ID not found or not initialized: ${handlerId}`);
        }
        return handler;
    }

    /**
     * Internal function to load the service, bind execution metadata, and cache the result.
     */
    async _resolveAndRegister(id, definition) {
        const path = definition.path;
        const [serviceName, methodName] = path.split('.');

        if (!serviceName || !methodName) {
             throw new Error(`Invalid handler definition for ${id}: Path '${path}' must be in 'Service.Method' format.`);
        }

        // Use the injected loader for dependency resolution
        const ServiceModule = this.loadService(serviceName);
        
        if (!ServiceModule) {
             throw new Error(`Service module not resolvable for handler ${id}: ${serviceName}`);
        }

        const handlerFunction = ServiceModule[methodName];

        if (typeof handlerFunction !== 'function') {
            throw new Error(`Invalid handler definition for ${id}: Path ${path} does not point to a callable function.`);
        }

        // Wrap the handler function with metadata 
        // Ensure 'this' context is preserved (ServiceModule might be a class instance or plain object)
        const executableWrapper = {
            handler: handlerFunction.bind(ServiceModule), 
            metadata: definition.execution_metadata || {}
        };
        
        this.cache.set(id, executableWrapper);
        console.log(`HSR: Registered handler ${id} -> ${path}`);
    }
}

module.exports = HandlerServiceResolver;
