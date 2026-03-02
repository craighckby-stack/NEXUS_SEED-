/**
 * G-03 Rule Executor Registry
 *
 * Role: A centralized registry responsible for storing, managing, and executing all specific
 * GSEP compliance and invariant checks. It decouples the M-02 Mutation Pre-Processor
 * from the implementation details of any single check, ensuring high scalability and maintainability.
 * It enforces strict structured results, supports sync/async rule execution, and utilizes dependency injection for logging.
 */

/**
 * @typedef {object} RuleResult
 * @property {boolean} compliant - True if the rule passed.
 * @property {string} message - A human-readable description of the outcome.
 * @property {string} code - The unique identifier of the rule that was executed.
 * @property {('NORMAL'|'FATAL_INTERNAL')} [severity='NORMAL'] - Indication of operational status (used primarily for internal errors).
 * @property {object} [details] - Optional context or debug information.
 */

class RuleExecutorRegistry {
    
    /** @type {Map<string, function(payload: object, config: object, context: object): (Promise<RuleResult>|RuleResult)>} */
    #executors;

    /** @type {object} */
    #logger;

    /**
     * Initializes the registry, injecting rules and system utilities (like the logger).
     * @param {Array<{code: string, handler: function}>} [initialRules=[]] - Rules to pre-load.
     * @param {object} [logger=console] - A structured logging utility (must support warn, error).
     */
    constructor(initialRules = [], logger = console) {
        this.#executors = new Map();
        this.#logger = logger;
        this._loadInitialRules(initialRules);
    }

    /**
     * Loads rules from a definition array using destructuring for clarity.
     * @param {Array<{code: string, handler: function}>} rules 
     */
    _loadInitialRules(rules) {
        for (const { code, handler } of rules) {
            this.register(code, handler);
        }
    }

    /**
     * Registers a specific check handler function.
     * @param {string} checkCode - Unique identifier for the rule (e.g., 'DEPENDENCY_INTEGRITY').
     * @param {function(payload: object, config: object, context: object): (Promise<RuleResult>|RuleResult)} handler - The function that returns a structured RuleResult.
     */
    register(checkCode, handler) {
        if (typeof handler !== 'function') {
            throw new Error(`Rule handler for ${checkCode} must be a function.`);
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
     * @returns {Promise<RuleResult>} Structured, immutable Rule Result.
     */
    async execute(checkCode, payload, config = {}, context = {}) {
        const handler = this.#executors.get(checkCode);
        
        // Create detailed logging context for traceability
        const logContext = { checkCode, payload, config, context }; 

        if (!handler) {
            this.#logger.warn(
                `[G-03] Operational Fault: Registry missing mandatory handler for check code: ${checkCode}.`,
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
            /** @type {RuleResult} */
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
            this.#logger.error(`[G-03] Rule Execution Exception (${checkCode}) - Handler Failed: ${error.message}`, 
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
     * @returns {RuleResult}
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

module.exports = RuleExecutorRegistry;