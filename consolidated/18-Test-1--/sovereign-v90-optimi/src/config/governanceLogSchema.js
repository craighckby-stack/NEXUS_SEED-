/**
 * Governance Log Schema Registry Kernel
 * 
 * Encapsulates the immutable Log Governance Schema (GSEP Standard v2.1),
 * replacing the static configuration file src/config/governanceLogSchema.js.
 * Ensures immutability and isolates synchronous constant definition.
 */

class GovernanceLogSchemaRegistryKernel {
    // Assuming deepFreeze utility is accessible in the environment
    // or is handled by a standard utility kernel.
    #deepFreeze = (obj) => { 
        if (typeof obj !== 'object' || obj === null) return obj;
        Object.freeze(obj);
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                this.#deepFreeze(obj[key]);
            }
        }
        return obj;
    };

    /**
     * @private
     * @type {object}
     */
    #schema;

    constructor() {
        this.#schema = this.#setupDependencies();
        this.#deepFreeze(this.#schema);
    }

    /**
     * Defines and returns the core schema configuration.
     * All logic previously sourced from SchemaFieldValidatorUtility (SDFU) 
     * is encapsulated here as required constant functions.
     * @private
     * @returns {object}
     */
    #setupDependencies() {
        // --- Encapsulated Utility Definitions (derived from original SDFU usage) ---
        
        const coerceToISOString = (val) => {
            try {
                if (val instanceof Date) return val.toISOString();
                const date = new Date(val);
                if (isNaN(date.getTime())) return val;
                return date.toISOString();
            } catch (e) {
                return val;
            }
        };

        const validateISOString = (val) => {
            if (typeof val !== 'string') return false;
            // Basic ISO 8601 validation check for system logs
            return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(val);
        };

        const coerceToFlooredInteger = (val) => Math.floor(Number(val));

        const validateHexadecimal = (val, minLength) => {
            if (typeof val !== 'string' || val.length < minLength) return false;
            return /^[0-9A-Fa-f]+$/.test(val);
        };

        const safeJSONCoercer = (val) => {
            if (typeof val === 'object' && val !== null) return val;
            if (typeof val !== 'string') return val;
            try {
                return JSON.parse(val);
            } catch (e) {
                return val;
            }
        };
        // --------------------------------------------------------------------------

        return {
            timestamp: {
                required: true,
                coercer: coerceToISOString,
                validator: validateISOString,
                error_code: 'LNM_401'
            },
            component_id: {
                required: true,
                coercer: (val) => String(val).toUpperCase(),
                validator: (val) => typeof val === 'string' && val.length > 0,
                error_code: 'LNM_402'
            },
            status_code: {
                required: true,
                coercer: Number,
                validator: Number.isInteger,
                error_code: 'LNM_403'
            }, 
            gsep_stage: {
                required: true, 
                coercer: coerceToFlooredInteger, 
                validator: (val) => typeof val === 'number' && val >= 1 && val <= 5, 
                error_code: 'LNM_404', 
                error: 'GSEP stage index out of bounds (1-5)'
            },
            input_hash: {
                required: true, 
                coercer: String, 
                // Requires minimum 10 characters, as per original specification
                validator: (val) => validateHexadecimal(val, 10),
                error_code: 'LNM_405',
                error: 'Input hash must be a minimum 10-character hexadecimal string.'
            },
            metadata: {
                required: false,
                coercer: safeJSONCoercer,
                validator: (val) => typeof val === 'object' && val !== null,
                error_code: 'LNM_406'
            }
        };
    }

    /**
     * Retrieves the frozen Governance Log Schema.
     * @returns {object} The immutable governance log schema definition.
     */
    getSchema() {
        return this.#schema;
    }
}

module.exports = GovernanceLogSchemaRegistryKernel;