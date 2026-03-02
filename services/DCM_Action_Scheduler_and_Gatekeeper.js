const RateLimiter = global.SystemUtilities?.RateLimiter;
const SchemaValidator = global.SystemUtilities?.SchemaValidator;
const TaskQueue = global.SystemUtilities?.TaskQueue;

class DCM_Action_Scheduler_and_Gatekeeper {
    // Use private fields for encapsulation and potential engine optimizations
    #registry;
    #gatekeeperPipeline;

    /**
     * Manages action governance and execution routing.
     * Pre-computes the gatekeeper pipeline in the constructor for maximum efficiency.
     * @param {object} actionRegistry - The loaded DCM_Action_Registry configuration.
     */
    constructor(actionRegistry) {
        if (!RateLimiter || !SchemaValidator || !TaskQueue) {
            // Fail fast if critical dependencies are missing
            throw new Error("[DCM_Scheduler] Required SystemUtilities (RateLimiter, Validator, Queue) not available.");
        }
        this.#registry = actionRegistry.actions || {};
        
        // Abstraction: Pre-compose the entire execution flow into a single callable function.
        this.#gatekeeperPipeline = this._buildGatekeeperPipeline();
    }

    /**
     * Builds and returns the optimized, abstract execution pipeline.
     * This logic is moved from the runtime execution path to the constructor.
     */
    _buildGatekeeperPipeline() {
        
        // Helper for rate limit enforcement
        const enforceRateLimit = (config, actionKey) => {
            if (config.rate_limit_key && !RateLimiter.check(config.rate_limit_key)) {
                throw new Error(`[DCM_Scheduler] Rate limit exceeded for action: ${actionKey}`); 
            }
            return config;
        };

        // Helper for input validation
        const validatePayload = (config, payload, actionKey) => {
            if (config.schema?.input && !SchemaValidator.validate(config.schema.input, payload)) {
                 throw new Error(`[DCM_Scheduler] Validation failed for payload of action: ${actionKey}`);
            }
            return { config, payload };
        };

        // Core Execution Router (Unified function for sync/async routing)
        const routeExecution = async ({ config, payload, context, actionKey }) => {
            const { execution_type, handler_path, retry_policy } = config;

            if (execution_type === 'SYNCHRONOUS') {
                // Direct local invocation
                try {
                    // require is highly cached, making subsequent calls fast.
                    const Handler = require(handler_path);
                    return await Handler.execute(payload, context);
                } catch (e) {
                    throw new Error(`[DCM_Scheduler] Sync execution failed for ${actionKey}: ${e.message}`);
                }
            }
            
            // Treat all non-synchronous types as asynchronous queuing operations
            if (execution_type.startsWith('ASYNCHRONOUS')) {
                await TaskQueue.enqueue({
                    actionKey,
                    handlerPath: handler_path,
                    payload,
                    context,
                    retryPolicy
                });
                return { success: true, status: 202, message: "Action scheduled asynchronously" };
            }

            throw new Error(`[DCM_Scheduler] Unknown execution type: ${execution_type}`);
        };

        // Return the final, highly abstracted function (the gatekeeper)
        return async (actionKey, payload, context) => {
            const config = this.#registry[actionKey];
            if (!config) {
                throw new Error(`[DCM_Scheduler] Action ${actionKey} not found in registry.`);
            }

            // Step 1: Governance checks (sequential application)
            const rateLimitedConfig = enforceRateLimit(config, actionKey);
            const { payload: validatedPayload } = validatePayload(rateLimitedConfig, payload, actionKey);
            
            // Step 2: Routing and Execution
            return routeExecution({ 
                config: rateLimitedConfig, 
                payload: validatedPayload, 
                context, 
                actionKey 
            });
        };
    }

    /**
     * Schedules and executes an action.
     * This method is now a maximally thin wrapper around the pre-built, optimized pipeline.
     */
    async scheduleExecution(actionKey, payload, context) {
        return this.#gatekeeperPipeline(actionKey, payload, context);
    }
}

module.exports = DCM_Action_Scheduler_and_Gatekeeper;