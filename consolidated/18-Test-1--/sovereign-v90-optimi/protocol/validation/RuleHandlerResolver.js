class RuleHandlerResolverKernel {
    #ruleMap;
    #logger;

    /**
     * @param {{rules: Map<string, Function>, logger?: console}} config 
     */
    constructor(config = {}) {
        this.#setupDependencies(config);
    }

    /**
     * Goal: Synchronous Setup Extraction.
     * Extracts synchronous dependency validation and assignment.
     * @param {{rules: Map<string, Function>, logger?: console}} config 
     */
    #setupDependencies(config) {
        const ruleMap = config.rules;
        this.#logger = config.logger || console;

        if (!(ruleMap instanceof Map)) {
            this.#throwSetupError("RuleHandlerResolver requires 'rules' property to be a Map.");
        }
        this.#ruleMap = ruleMap;
    }

    /**
     * Goal: I/O Proxy - Error Handling.
     * Proxies setup errors.
     */
    #throwSetupError(message) {
        throw new Error(`RuleHandlerResolverKernel Setup Error: ${message}`);
    }

    /**
     * Goal: I/O Proxy - Logging.
     */
    #logWarning(message) {
        if (this.#logger && typeof this.#logger.warn === 'function') {
            this.#logger.warn(message);
        }
    }

    /**
     * Goal: I/O Proxy - Logging.
     */
    #logError(message) {
        if (this.#logger && typeof this.#logger.error === 'function') {
            this.#logger.error(message);
        }
    }

    /**
     * Goal: I/O Proxy - External Interaction (Map Lookup).
     */
    #delegateToMapLookup(ruleId) {
        return this.#ruleMap.get(ruleId);
    }

    /**
     * Goal: I/O Proxy - Control Flow/Logging.
     * Handles logging and returns null if the rule is missing or the ID is invalid.
     */
    #handleMissingRule(ruleId) {
        if (!ruleId) {
            this.#logWarning("Attempted to resolve rule with null or undefined ID.");
            return null;
        }
        this.#logError(`Rule handler not found for ID: ${ruleId}`);
        return null;
    }
    
    /**
     * Goal: I/O Proxy - Validation Logic.
     * Checks if the retrieved item is a valid function handler.
     */
    #validateHandlerType(handler, ruleId) {
        if (typeof handler !== 'function') {
            this.#logError(`Handler for ID ${ruleId} found but is not a function.`);
            return null;
        }
        return handler;
    }

    /**
     * Resolves the rule handler function by its unique ID.
     * @param {string} ruleId 
     * @returns {Function | null}
     */
    resolve(ruleId) {
        if (!ruleId) {
            return this.#handleMissingRule(ruleId);
        }

        const handler = this.#delegateToMapLookup(ruleId);

        if (!handler) {
            return this.#handleMissingRule(ruleId);
        }

        return this.#validateHandlerType(handler, ruleId);
    }
}