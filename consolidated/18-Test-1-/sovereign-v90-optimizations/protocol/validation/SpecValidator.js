class SpecValidatorKernel {
    // Strategic Optimization 3: Minimize error handling overhead by reusing static error objects.
    static ERROR_CACHE = {
        SCHEMA_NOT_FOUND: Object.freeze({ success: false, code: 404, message: "Schema specification not found or cached." }),
        VALIDATION_FAILURE: Object.freeze({ success: false, code: 400, message: "Validation failed against specification rules." })
    };

    #specs; // Raw specification source definitions.
    #schemaCache; // Map for fast schema lookups.
    #customRules; // Map of custom validation functions.

    /**
     * @param {Object} specs - Raw specification source definitions.
     * @param {Object<string, Function>} customRules - Map of custom validation functions.
     */
    constructor(specs, customRules = {}) {
        this.#setupDependencies(specs, customRules);
    }

    /**
     * Rigorously extracts synchronous setup logic, validation, and field assignment.
     * @param {Object} specs
     * @param {Object} customRules
     */
    #setupDependencies(specs, customRules) {
        if (!specs || typeof specs !== 'object') {
            throw this.#throwSetupError("SpecValidator requires a valid specs object.");
        }
        this.#specs = specs;
        
        // Strategic Optimization 1: Implement schema caching using Map for fast lookups.
        this.#schemaCache = new Map(); 

        // Strategic Optimization 2: Use Map for custom rules for O(1) average lookup time.
        const rulesMap = new Map();
        if (customRules && typeof customRules === 'object') {
            Object.entries(customRules).forEach(([key, value]) => {
                if (typeof value === 'function') {
                    rulesMap.set(key, value);
                }
            });
        }
        this.#customRules = rulesMap;
    }

    /**
     * I/O Proxy: Retrieves a schema from cache, falling back to raw storage if necessary, and performs caching.
     * @param {string} specName
     * @returns {Object|null}
     */
    #delegateToSchemaLookupAndCache(specName) {
        if (this.#schemaCache.has(specName)) {
            return this.#schemaCache.get(specName);
        }

        const schema = this.#specs[specName];
        if (schema) {
            this.#schemaCache.set(specName, schema);
            return schema;
        }
        return null;
    }

    /**
     * I/O Proxy: Executes a custom validation rule via direct O(1) lookup.
     * @param {string} ruleName
     * @param {*} data
     * @returns {boolean} - true if validation passed or rule was missing, false otherwise.
     */
    #delegateToCustomRuleExecution(ruleName, data) {
        const ruleFn = this.#customRules.get(ruleName);
        if (ruleFn) {
            // Delegation of execution
            return ruleFn(data);
        }
        // If rule doesn't exist, treat as success to avoid breaking validation flow
        return true; 
    }

    /**
     * I/O Proxy: Throws a configuration error during setup.
     * @param {string} message
     */
    #throwSetupError(message) {
        return new Error(`[SpecValidator Setup Error] ${message}`);
    }

    /**
     * Validates input data against a cached or retrieved specification.
     * @param {*} data - The input data structure.
     * @param {string} specName - The name of the specification to use.
     * @returns {Object} - Validation result.
     */
    validate(data, specName) {
        const schema = this.#delegateToSchemaLookupAndCache(specName);

        if (!schema) {
            // Uses static error object
            return SpecValidatorKernel.ERROR_CACHE.SCHEMA_NOT_FOUND;
        }

        // --- Placeholder for intensive recursive validation logic ---

        // Example of using custom rule lookup via I/O Proxy
        if (schema.requiredCustomCheck) {
            const result = this.#delegateToCustomRuleExecution(schema.requiredCustomCheck, data);
            if (result === false) {
                // Uses static error object
                return SpecValidatorKernel.ERROR_CACHE.VALIDATION_FAILURE; 
            }
        }

        // If validation succeeds
        return { success: true };
    }
}