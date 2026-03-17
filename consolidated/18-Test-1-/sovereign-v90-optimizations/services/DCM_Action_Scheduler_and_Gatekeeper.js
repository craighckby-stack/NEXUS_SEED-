/**
 * Define minimal interfaces for required plugins based on usage
 */
interface IRateLimiter {
    check(key: string): boolean;
}

interface ISchemaValidator {
    validate(schema: object, payload: object): boolean;
    getErrors?(): string[]; 
}

interface ITaskQueue {
    enqueue(task: object): Promise<void>;
}

/**
 * Type definition for the Action Registry configuration structure.
 */
interface ActionConfig {
    rate_limit_key?: string;
    schema: {
        input: object;
        output?: object;
    };
    execution_type: 'SYNCHRONOUS' | 'ASYNCHRONOUS' | 'ASYNCHRONOUS_EXTERNAL';
    handler_path: string;
    retry_policy?: object;
}

interface ActionRegistry {
    actions: { [key: string]: ActionConfig };
}

/**
 * Kernel responsible for action governance (rate limiting, validation) and execution routing.
 * This component decouples the core DCM decision engine from execution logic details.
 */
class DCMActionSchedulerGatekeeperKernel {
    #registry: { [key: string]: ActionConfig };
    #rateLimiter: IRateLimiter;
    #taskQueue: ITaskQueue;
    #schemaValidator: ISchemaValidator;

    #SetupError = class SetupError extends Error {
        constructor(message: string) {
            super(`[DCMActionSchedulerGatekeeperKernel Setup Error] ${message}`);
            this.name = 'SetupError';
        }
    };

    /**
     * @param {ActionRegistry} actionRegistry - The loaded DCM_Action_Registry configuration.
     * @param {IRateLimiter} rateLimiter - Instance of RateLimitingService.
     * @param {ISchemaValidator} schemaValidator - Instance of SchemaValidationService.
     * @param {ITaskQueue} taskQueue - Instance provided by ResilientQueueFactory.
     */
    constructor(
        actionRegistry: ActionRegistry,
        rateLimiter: IRateLimiter,
        schemaValidator: ISchemaValidator,
        taskQueue: ITaskQueue
    ) {
        this.#setupDependencies(actionRegistry, rateLimiter, schemaValidator, taskQueue);
    }

    // --- Private Setup Methods ---

    #throwSetupError(message: string): never {
        throw new this.#SetupError(message);
    }

    /**
     * Rigorously validates and assigns all synchronous dependencies.
     */
    #setupDependencies(
        actionRegistry: ActionRegistry,
        rateLimiter: IRateLimiter,
        schemaValidator: ISchemaValidator,
        taskQueue: ITaskQueue
    ): void {
        if (!actionRegistry || typeof actionRegistry.actions !== 'object') {
            this.#throwSetupError("Action Registry must be provided and contain an 'actions' map.");
        }
        if (!rateLimiter || typeof rateLimiter.check !== 'function') {
            this.#throwSetupError("Rate Limiter must be provided and implement a 'check' method.");
        }
        if (!schemaValidator || typeof schemaValidator.validate !== 'function') {
            this.#throwSetupError("Schema Validator must be provided and implement a 'validate' method.");
        }
        if (!taskQueue || typeof taskQueue.enqueue !== 'function') {
            this.#throwSetupError("Task Queue must be provided and implement an 'enqueue' method.");
        }

        this.#registry = actionRegistry.actions;
        this.#rateLimiter = rateLimiter;
        this.#schemaValidator = schemaValidator;
        this.#taskQueue = taskQueue;
    }

    // --- Private I/O Proxy Methods ---

    #getConfiguration(actionKey: string): ActionConfig {
        const config = this.#registry[actionKey];
        if (!config) {
            // I/O: Throwing error
            throw new Error(`[DCMActionSchedulerGatekeeperKernel] Action ${actionKey} not found in registry.`);
        }
        return config;
    }

    /**
     * Executes rate limit check using the external tool and throws if exceeded.
     */
    #enforceRateLimitAndThrow(actionKey: string, config: ActionConfig): void {
        if (config.rate_limit_key) {
            // Delegation to external tool
            if (!this.#rateLimiter.check(config.rate_limit_key)) {
                // I/O: Throwing error
                throw new Error(`[DCMActionSchedulerGatekeeperKernel] Rate limit exceeded for action: ${actionKey}`);
            }
        }
    }

    /**
     * Executes schema validation using the external tool and throws if invalid.
     */
    #validatePayloadAndThrow(actionKey: string, config: ActionConfig, payload: any): void {
        if (config.schema?.input) {
            // Delegation to external tool
            if (!this.#schemaValidator.validate(config.schema.input, payload)) {
                let errorDetails = '';
                // Conditional delegation and error detail assembly (I/O preparation)
                if (this.#schemaValidator.getErrors) {
                    errorDetails = `. Details: ${this.#schemaValidator.getErrors().join('; ')}`;
                }
                // I/O: Throwing error
                throw new Error(`[DCMActionSchedulerGatekeeperKernel] Validation failed for payload of action: ${actionKey}${errorDetails}`);
            }
        }
    }

    /**
     * Handles file system I/O (require) and synchronous handler execution.
     */
    async #executeSynchronousHandler(actionKey: string, config: ActionConfig, payload: any, context: any): Promise<any> {
        // Complex Flow Control/I/O: Require dynamic handler
        const Handler = require(config.handler_path);
        
        if (typeof Handler.execute !== 'function') {
            // I/O: Throwing error
            throw new Error(`[DCMActionSchedulerGatekeeperKernel] Synchronous handler at path ${config.handler_path} does not export an 'execute' function.`);
        }

        // Delegation to external execution (async)
        return await Handler.execute(payload, context);
    }

    /**
     * Enqueues the task using the external Task Queue tool.
     */
    async #enqueueAsynchronousTask(actionKey: string, config: ActionConfig, payload: any, context: any): Promise<object> {
        // Delegation to external queue tool
        await this.#taskQueue.enqueue({
            actionKey: actionKey,
            handlerPath: config.handler_path,
            payload: payload,
            context: context,
            retryPolicy: config.retry_policy
        });
        // I/O: Return scheduling confirmation
        return { success: true, status: 202, message: `Action ${actionKey} scheduled asynchronously` };
    }

    /**
     * Handles final control flow errors by throwing.
     */
    #throwUnknownExecutionTypeError(executionType: string): never {
        throw new Error(`[DCMActionSchedulerGatekeeperKernel] Unknown execution type: ${executionType}`);
    }

    // --- Public Execution Method ---

    /**
     * Performs governance checks and routes the action for execution.
     * @param {string} actionKey - Key identifying the action configuration.
     * @param {any} payload - Input data for the action.
     * @param {any} context - Runtime context information.
     * @returns {Promise<any>} Execution result or scheduling confirmation.
     */
    async scheduleExecution(actionKey: string, payload: any, context: any): Promise<any> {
        const config = this.#getConfiguration(actionKey);

        // 1. Governance Check (Rate Limiting Enforcement)
        this.#enforceRateLimitAndThrow(actionKey, config);
        
        // 2. Schema Validation (Input)
        this.#validatePayloadAndThrow(actionKey, config, payload);

        // 3. Execution Routing
        switch (config.execution_type) {
            case 'SYNCHRONOUS':
                return await this.#executeSynchronousHandler(actionKey, config, payload, context);
            
            case 'ASYNCHRONOUS':
            case 'ASYNCHRONOUS_EXTERNAL':
                return await this.#enqueueAsynchronousTask(actionKey, config, payload, context);
            
            default:
                this.#throwUnknownExecutionTypeError(config.execution_type);
        }
    }
}

export = DCMActionSchedulerGatekeeperKernel;