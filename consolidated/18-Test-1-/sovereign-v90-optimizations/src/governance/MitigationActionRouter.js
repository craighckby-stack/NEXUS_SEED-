/**
 * MitigationActionRouterKernel: 
 * Manages the intake, validation, and specialized routing of standardized 
 * governance mitigation action payloads based on the specified 'executor'.
 */

// Note: Assuming ILoggerToolKernel, ISpecValidatorKernel, 
//       IMitigationExecutorResolverToolKernel, and 
//       IGovernanceMitigationSchemaRegistryKernel are injected strategic interfaces.

// Custom error handling for governance domain failures (Imported/Injected externally)
// const { ActionValidationError, ExecutorNotFoundError } = require('./errors/GovernanceErrors'); 

class MitigationActionRouterKernel {
    #executorResolver;
    #specValidator;
    #schemaRegistry;
    #logger;
    #actionSchema;

    /**
     * @param {object} dependencies - Injected dependencies
     * @param {IMitigationExecutorResolverToolKernel} dependencies.executorResolver - Resolver for mitigation execution services.
     * @param {ISpecValidatorKernel} dependencies.specValidator - Tool for high-integrity schema validation.
     * @param {IGovernanceMitigationSchemaRegistryKernel} dependencies.schemaRegistry - Registry for loading the action schema.
     * @param {ILoggerToolKernel} dependencies.logger - Standardized logging interface.
     */
    constructor(dependencies) {
        this.#setupDependencies(dependencies);
        this.#logger.debug(`${this.constructor.name} initialized, awaiting configuration.`);
    }

    #setupDependencies(dependencies) {
        if (!dependencies) {
            throw new Error("Dependencies object is required for MitigationActionRouterKernel.");
        }
        
        const { executorResolver, specValidator, schemaRegistry, logger } = dependencies;

        // Validation mandated by architectural standards
        if (!executorResolver || typeof executorResolver.resolve !== 'function') {
            throw new TypeError("executorResolver must conform to IMitigationExecutorResolverToolKernel and expose 'resolve(executorId)'.");
        }
        if (!specValidator || typeof specValidator.validateAsync !== 'function') {
            throw new TypeError("specValidator must conform to ISpecValidatorKernel and expose 'validateAsync'.");
        }
        if (!schemaRegistry || typeof schemaRegistry.getActionSchema !== 'function') {
            throw new TypeError("schemaRegistry must conform to IGovernanceMitigationSchemaRegistryKernel and expose 'getActionSchema'.");
        }
        if (!logger || typeof logger.info !== 'function') {
            throw new TypeError("logger must conform to ILoggerToolKernel.");
        }

        this.#executorResolver = executorResolver;
        this.#specValidator = specValidator;
        this.#schemaRegistry = schemaRegistry;
        this.#logger = logger;
    }

    /**
     * Loads the required configuration (action schema) asynchronously.
     */
    async initialize() {
        this.#actionSchema = await this.#schemaRegistry.getActionSchema();
        if (!this.#actionSchema) {
            this.#logger.fatal("Initialization failure: Failed to retrieve mitigation action schema.");
            throw new Error("MitigationActionRouterKernel failed to initialize configuration.");
        }
        this.#logger.info(`${this.constructor.name} configuration loaded successfully.`);
    }

    /**
     * Validates and routes the action payload to the designated specialized executor.
     * @param {Object} actionPayload - The payload describing the mitigation action.
     * @returns {Promise<{status: string, actionId: string, executorUsed: string}>}
     */
    async routeAction(actionPayload) {
        if (!this.#actionSchema) {
            this.#logger.error("Attempted to route action before initialization was complete.");
            throw new Error("Router not initialized.");
        }

        // 1. Validation using ISpecValidatorKernel (Asynchronous)
        // Note: Assume ActionValidationError and ExecutorNotFoundError are available via context or imports.
        
        const validationResult = await this.#specValidator.validateAsync({
            schema: this.#actionSchema,
            payload: actionPayload,
            // Configuration to ensure standardization and default population
            options: { useDefaults: true, allErrors: true } 
        });

        if (!validationResult.isValid) {
            const errors = validationResult.errors;
            this.#logger.error('Mitigation action validation failed.', { errors, payload: actionPayload });
            // Throw specialized error (assuming ActionValidationError is defined/in scope)
            throw new Error('ActionValidationError: Invalid mitigation action payload provided.'); 
        }
        
        const validatedPayload = validationResult.validatedPayload; 
        
        const { executor, actionId, actionType, priority } = validatedPayload;

        // 2. Executor Resolution via Resolver Tool
        // The IMitigationExecutorResolverToolKernel abstracts the map lookup.
        const service = await this.#executorResolver.resolve(executor); 
        
        if (!service) {
            this.#logger.warn(`Attempted to route action ${actionId} to unknown executor: ${executor}`);
            // Throw specialized error (assuming ExecutorNotFoundError is defined/in scope)
            throw new Error(`ExecutorNotFoundError: Mitigation executor service not found for identifier: ${executor}`);
        }

        // 3. Execution/Routing
        this.#logger.info(`Routing Action ${actionId} [P:${priority}, T:${actionType}] to Executor: ${executor}`);
        
        try {
            // Execute the action using the validated payload.
            // Assuming the executor service implements an async execute method.
            await service.execute(validatedPayload);
        } catch (error) {
            this.#logger.error(`Failed to execute action ${actionId} via ${executor}. Propagating failure.`, { error, actionId });
            throw error; 
        }

        return { 
            status: 'ActionRoutedAndInitiated', 
            actionId: actionId,
            executorUsed: executor
        };
    }
}

module.exports = MitigationActionRouterKernel;