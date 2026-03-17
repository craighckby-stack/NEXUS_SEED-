/**
 * G-03 Rule Execution Registry Kernel
 *
 * Role: A centralized registry kernel responsible for storing, managing, and executing all specific
 * GSEP compliance and invariant checks. It decouples higher-level processes (like the M-02 Mutation Pre-Processor)
 * from the implementation details of any single check. It enforces strict structured results,
 * supports sync/async rule execution, and utilizes dependency injection for logging.
 */

/**
 * @typedef {object} IRuleResult
 * @property {boolean} compliant - True if the rule passed.
 * @property {string} message - A human-readable description of the outcome.
 * @property {string} code - The unique identifier of the rule that was executed.
 * @property {('NORMAL'|'FATAL_INTERNAL')} [severity='NORMAL'] - Indication of operational status.
 * @property {object} [details] - Optional context or debug information.
 */

class RuleExecutionRegistryKernel {
    
    /** @type {Map<string, function(payload: object, config: object, context: object): (Promise<IRuleResult>|IRuleResult)>} */
    #executors;

    /** @type {ILoggerToolKernel} */
    #logger;

    /**
     * Initializes the registry kernel, injecting required strategic tools.
     * Dependency assignment and validation must be strictly synchronous in the constructor.
     * 
     * @param {ILoggerToolKernel} logger - The strategic structured logging utility.
     */
    constructor(logger) {
        this.#logger = logger;
        this.#executors = new Map();
        this.#setupDependencies();
    }

    /**
     * Ensures all required dependencies are present and valid, strictly synchronous.
     * @private
     */
    #setupDependencies() {
        if (!this.#logger || typeof this.#logger.warn !== 'function' || typeof this.#logger.error !== 'function') {
            throw new Error("Dependency Error: ILoggerToolKernel dependency must be provided to RuleExecutionRegistryKernel.");
        }
    }

    /**
     * Asynchronously loads initial rule definitions from a configuration source.
     * This method fulfills the mandate for asynchronous configuration loading.
     * 
     * @param {Array<{code: string, handler: function}>} [initialRules=[]] - Rules definition array (typically loaded from a Registry Kernel).
     * @returns {Promise<void>}
     */
    async initialize(initialRules = []) {
        if (Array.isArray(initialRules)) {
             await this._loadInitialRules(initialRules);
        } else {
             this.#logger.warn("RuleExecutionRegistryKernel received non-array input for initialization rules.", { input: initialRules });
        }
    }


    /**
     * Loads rules from a definition array.
     * @param {Array<{code: string, handler: function}>} rules 
     * @returns {Promise<void>}
     */
    async _loadInitialRules(rules) {
        for (const { code, handler } of rules) {
            this.register(code, handler);
        }
    }

    /**
     * Registers a specific check handler function.
     * @param {string} checkCode - Unique identifier for the rule (e.g., 'DEPENDENCY_INTEGRITY').
     * @param {function(payload: object, config: object, context: object): (Promise<IRuleResult>|IRuleResult)} handler - The function that returns a structured RuleResult.
     */
    register(checkCode, handler) {
        if (typeof handler !== 'function') {
            const errorMsg = `Rule handler registration error: Handler for ${checkCode} must be a function.`;
            this.#logger.error(errorMsg, { checkCode, typeReceived: typeof handler });
            throw new Error(errorMsg);
        }
        this.#executors.set(checkCode, handler);
    }

    /**
     * Executes the specific check identified by checkCode.
     *
     * @param {string} checkCode
     * @param {object} payload - Mutation payload.
     * @param {object} config - Rule-specific configuration (from invariants).
     * @param {object} context - Current operational context.
     * @returns {Promise<IRuleResult>} Structured, immutable Rule Result.
     */
    async execute(checkCode, payload, config = {}, context = {}) {
        const handler = this.#executors.get(checkCode);
        
        // Create detailed logging context for traceability
        // Note: Payload is excluded from the high-level log context to prevent size overflow.
        const logContext = { checkCode, config, context: context }; 

        if (!handler) {
            this.#logger.warn(
                `[REGISTRY] Operational Fault: Missing mandatory handler for check code: ${checkCode}.`,
                logContext
            );
            return this._createFaultResult(
                checkCode,
                `Operational fault: No registered handler found for ${checkCode}. Evaluation aborted.`,
                logContext
            );
        }

        try {
            // Use Promise.resolve() to wrap both synchronous and asynchronous handlers seamlessly.
            /** @type {IRuleResult} */
            let result = await Promise.resolve(handler(payload, config, context));

            // --- Strict Validation: Enforce the required RuleResult structure. ---
            if (
                typeof result !== 'object' || result === null ||
                typeof result.compliant !== 'boolean' || typeof result.message !== 'string'
            ) {
                const receivedType = result === null ? 'null' : (typeof result);
                // Fault if the handler returns an unrecognizable object structure.
                throw new Error(`Handler returned an invalid structure. Must strictly contain { compliant: boolean, message: string }. Received type: ${receivedType}`);
            }
            
            // Ensure the 'code' is attached/overwritten and freeze the result for immutability.
            return Object.freeze({ ...result, code: checkCode });
            
        } catch (error) {
            this.#logger.error(`[REGISTRY] Rule Execution Exception (${checkCode}) - Handler Failed: ${error.message}`, 
                { errorStack: error.stack, details: logContext }
            );
            return this._createFaultResult(
                checkCode,
                `Internal handler error: ${error.message}`,
                { error: error.stack, context: logContext }
            );
        }
    }

    /**
     * Helper to create a consistent, immutable failure result template for internal errors or missing handlers.
     * @private
     * @param {string} code 
     * @param {string} message 
     * @param {object} details 
     * @returns {IRuleResult}
     */
    _createFaultResult(code, message, details) {
        // Fault results are frozen to ensure system stability against mutation.
        return Object.freeze({
            compliant: false,
            message: message,
            code: code,
            severity: 'FATAL_INTERNAL',
            details: details
        });
    }
}

module.exports = RuleExecutionRegistryKernel;