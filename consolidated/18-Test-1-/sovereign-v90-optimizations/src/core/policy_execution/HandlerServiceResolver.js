/**
 * HandlerServiceResolverKernel (HSRK)
 * Mission: Dynamically resolves and instantiates handler services defined in the configuration,
 * associating them with necessary execution metadata (e.g., timeouts, retries).
 *
 * Refactoring Note: Decoupled dependency loading and configuration access using
 * IServiceResolutionToolKernel and IHandlerServiceConfigRegistryKernel.
 */

const KernelSymbols = {
    Logger: 'ILoggerToolKernel',
    ConfigRegistry: 'IHandlerServiceConfigRegistryKernel',
    ServiceResolver: 'IServiceResolutionToolKernel'
};

class HandlerServiceResolverKernel {
    /**
     * @param {object} dependencies - Injected dependencies map.
     * @param {ILoggerToolKernel} dependencies.ILoggerToolKernel
     * @param {IHandlerServiceConfigRegistryKernel} dependencies.IHandlerServiceConfigRegistryKernel
     * @param {IServiceResolutionToolKernel} dependencies.IServiceResolutionToolKernel
     */
    constructor(dependencies) {
        this.#setupDependencies(dependencies);
        this.cache = new Map();
        this.isInitialized = false;
    }

    #setupDependencies(dependencies) {
        const {
            [KernelSymbols.Logger]: logger,
            [KernelSymbols.ConfigRegistry]: configRegistry,
            [KernelSymbols.ServiceResolver]: serviceResolver
        } = dependencies;

        if (!logger || !configRegistry || !serviceResolver) {
            throw new Error("HandlerServiceResolverKernel requires ILoggerToolKernel, IHandlerServiceConfigRegistryKernel, and IServiceResolutionToolKernel.");
        }

        /** @type {ILoggerToolKernel} */
        this.logger = logger;
        /** @type {IHandlerServiceConfigRegistryKernel} */
        this.configRegistry = configRegistry;
        /** @type {IServiceResolutionToolKernel} */
        this.serviceResolver = serviceResolver;
    }

    /**
     * Initializes all handlers specified in the registry, resolving and caching their dependencies.
     */
    async initialize() {
        if (this.isInitialized) return; 
        
        const handlerRegistryConfig = await this.configRegistry.getHandlerRegistryConfig();

        const handlerCount = Object.keys(handlerRegistryConfig).length;
        this.logger.info(`[HSRK] Starting initialization of ${handlerCount} execution handlers...`);
        
        const resolutions = Object.entries(handlerRegistryConfig).map(([id, definition]) => 
            this.#resolveAndRegister(id, definition)
        );

        // Resolve all concurrently to speed up startup
        await Promise.all(resolutions);
        this.isInitialized = true;
        this.logger.info("[HSRK] Initialization complete.");
    }

    /**
     * Retrieves a prepared execution handler object by its ID.
     * @param {string} handlerId - The symbolic ID from the handler configuration.
     * @returns {Promise<{handler: Function, metadata: Object}>} The callable handler function wrapped with execution metadata.
     */
    async getHandler(handlerId) {
        if (!this.isInitialized) {
             throw new Error("HandlerServiceResolverKernel is not initialized. Call initialize() first.");
        }
        
        const handler = this.cache.get(handlerId);
        if (!handler) {
            this.logger.error(`Handler ID not found or not initialized: ${handlerId}`);
            throw new Error(`Handler ID not found or not initialized: ${handlerId}`);
        }
        return handler;
    }

    /**
     * Internal function to load the service, bind execution metadata, and cache the result.
     * @private
     */
    async #resolveAndRegister(id, definition) {
        // Destructure definition, providing a default empty object for metadata
        const { path, execution_metadata = {} } = definition; 
        
        const [serviceName, methodName] = path.split('.');

        if (!serviceName || !methodName) {
             const errorMsg = `Invalid definition for handler '${id}': Path '${path}' must be in 'Service.Method' format.`;
             this.logger.error(`[HSRK Error] ${errorMsg}`);
             throw new Error(errorMsg);
        }

        // Use the injected asynchronous service resolver
        const ServiceModule = await this.serviceResolver.resolveService(serviceName);
        
        if (!ServiceModule) {
             const errorMsg = `Service module not resolvable for handler '${id}': Service '${serviceName}' not found.`;
             this.logger.error(`[HSRK Error] ${errorMsg}`);
             throw new Error(errorMsg);
        }

        const handlerFunction = ServiceModule[methodName];

        if (typeof handlerFunction !== 'function') {
            const errorMsg = `Invalid handler definition for '${id}': Path ${path} does not point to a callable function.`;
            this.logger.error(`[HSRK Error] ${errorMsg}`);
            throw new Error(errorMsg);
        }

        // Wrap the handler function with metadata 
        const executableWrapper = {
            handler: handlerFunction.bind(ServiceModule), 
            metadata: execution_metadata
        };
        
        this.cache.set(id, executableWrapper);
        this.logger.info(`[HSRK] Registered handler: ${id} (Path: ${path})`);
    }
}

module.exports = HandlerServiceResolverKernel;