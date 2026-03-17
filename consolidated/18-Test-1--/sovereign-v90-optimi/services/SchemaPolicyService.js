class SchemaPolicyKernel {
    #policyStore;
    #schemas = new Map();

    /**
     * @param {object} dependencies - Must contain a PolicyStore instance.
     * @param {PolicyStore} dependencies.policyStoreInstance - Instance of the PolicyStore plugin.
     */
    constructor({ policyStoreInstance }) {
        this.#validateDependencies(policyStoreInstance);
        this.#policyStore = policyStoreInstance;
    }

    /**
     * Validates that the PolicyStore has required methods.
     * @param {PolicyStore} policyStoreInstance
     * @private
     */
    #validateDependencies(policyStoreInstance) {
        if (!policyStoreInstance || 
            typeof policyStoreInstance.get !== 'function' || 
            typeof policyStoreInstance.define !== 'function') {
            throw new Error("SchemaPolicyKernel requires a valid PolicyStore instance with 'get' and 'define' methods.");
        }
    }

    /**
     * Defines a policy for a resource action.
     * @param {string} resourceAction - The policy key (e.g., 'users:read', 'products:update')
     * @param {Array<Function>} rules - Array of synchronous policy functions (ctx) => boolean
     */
    definePolicy(resourceAction, rules) {
        if (!Array.isArray(rules)) {
            throw new TypeError('Rules must be provided as an array of functions');
        }
        
        this.#policyStore.define(resourceAction, rules);
    }

    /**
     * Registers a schema definition for a resource.
     * @param {string} resourceName
     * @param {any} schemaDefinition - The schema definition object.
     */
    defineSchema(resourceName, schemaDefinition) {
        this.#schemas.set(resourceName, schemaDefinition);
    }

    /**
     * Enforces policy rules for a given action and context.
     * @param {string} resourceAction - The policy key (e.g., 'users:create')
     * @param {object} [context={}] - Execution context (user info, request data, etc.)
     * @returns {boolean} True if all policies pass.
     * @throws {Error} If any policy rule returns false or throws.
     */
    enforce(resourceAction, context = {}) {
        const rules = this.#policyStore.get(resourceAction);

        if (!rules?.length) {
            return true; // Default to ALLOW if no explicit policy is defined
        }

        for (const rule of rules) {
            if (typeof rule !== 'function') {
                throw new TypeError(`Policy rule for '${resourceAction}' must be a function`);
            }

            try {
                if (rule(context) === false) {
                    throw new Error(`Policy violation: Operation '${resourceAction}' failed policy check.`);
                }
            } catch (error) {
                throw new Error(`Policy evaluation error for '${resourceAction}': ${error.message}`);
            }
        }

        return true;
    }

    /**
     * Performs schema validation on data for a given resource.
     * @param {string} resourceName
     * @param {any} data - The data payload to validate.
     * @returns {any} The validated/coerced data.
     * @throws {Error} If validation fails.
     */
    validate(resourceName, data) {
        const schema = this.#schemas.get(resourceName);
        if (!schema) {
            return data; // No schema defined, validation skipped
        }

        // NOTE: This is the integration point for external validation libraries (Joi/Zod).
        // Since no external validator is dependency-injected, we currently return the data.

        return data;
    }
}

module.exports = SchemaPolicyKernel;
