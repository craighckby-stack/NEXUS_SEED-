class DCM_Action_Scheduler_and_Gatekeeper {
    /**
     * Manages action governance (rate limiting, queues) and determines execution routing.
     * This component decouples the core DCM decision engine from execution logic details.
     * @param {object} actionRegistry - The loaded DCM_Action_Registry configuration.
     */
    constructor(actionRegistry) {
        this.registry = actionRegistry.actions;
        this.rateLimiter = global.SystemUtilities.RateLimiter; 
        this.taskQueue = global.SystemUtilities.TaskQueue; // Assumed task queue utility
    }

    async scheduleExecution(actionKey, payload, context) {
        const config = this.registry[actionKey];
        if (!config) {
            throw new Error(`[DCM_Scheduler] Action ${actionKey} not found in registry.`);
        }

        // 1. Governance Check (Rate Limiting Enforcement)
        if (config.rate_limit_key && !this.rateLimiter.check(config.rate_limit_key)) {
            // Implement dynamic response based on retry_policy or rejection
            throw new Error(`[DCM_Scheduler] Rate limit exceeded for action: ${actionKey}`); 
        }

        // 2. Schema Validation (Input)
        if (!global.SystemUtilities.SchemaValidator.validate(config.schema.input, payload)) {
             throw new Error(`[DCM_Scheduler] Validation failed for payload of action: ${actionKey}`);
        }

        // 3. Execution Routing
        switch (config.execution_type) {
            case 'SYNCHRONOUS':
                // Local direct handler invocation (blocking operation)
                const Handler = require(config.handler_path);
                return await Handler.execute(payload, context);
            
            case 'ASYNCHRONOUS':
            case 'ASYNCHRONOUS_EXTERNAL':
                // Queue the task for background worker consumption
                await this.taskQueue.enqueue({
                    actionKey: actionKey,
                    handlerPath: config.handler_path,
                    payload: payload,
                    context: context,
                    retryPolicy: config.retry_policy
                });
                return { success: true, status: 202, message: "Action scheduled asynchronously" };
            
            default:
                throw new Error(`[DCM_Scheduler] Unknown execution type: ${config.execution_type}`);
        }
    }
}

module.exports = DCM_Action_Scheduler_and_Gatekeeper;