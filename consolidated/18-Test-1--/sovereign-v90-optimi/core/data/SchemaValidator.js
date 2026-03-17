/**
 * @module SchemaValidator
 * @description Central utility for managing and executing type and schema validation 
 * against defined data primitives via the DataSchemaValidator plugin.
 */

interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

// Assuming the existence of a global/injected plugin mechanism (plugins)
declare var plugins: {
    DataSchemaValidator?: {
        execute(args: { data: any, primitiveType: string }): ValidationResult;
    }
};

class SchemaValidator {
    // Encapsulate the critical plugin dependency using a private field.
    #validator: typeof plugins.DataSchemaValidator | undefined;

    constructor() {
        this.#setupValidatorDependency();
    }

    /**
     * Resolves the DataSchemaValidator plugin dependency during initialization.
     * @private
     */
    #setupValidatorDependency(): void {
        // Resolve the dependency once during initialization, optimizing subsequent lookups
        // and enforcing structural encapsulation.
        if (typeof plugins !== 'undefined' && plugins.DataSchemaValidator) {
            this.#validator = plugins.DataSchemaValidator;
        } else {
            this.#validator = undefined;
        }
    }

    /**
     * Handles the direct delegation of validation logic to the external plugin,
     * including immediate error handling (I/O proxy).
     * @private
     */
    #delegateToValidator(validator: NonNullable<typeof plugins.DataSchemaValidator>, data: any, primitiveType: string): ValidationResult {
        try {
            // Delegate all complex validation logic to the dedicated plugin.
            return validator.execute({
                data: data,
                primitiveType: primitiveType
            });
        } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            // Ensure graceful handling of plugin execution errors
            return { isValid: false, errors: [`DataSchemaValidator execution failed: ${message}`] };
        }
    }

    /**
     * Retrieves a schema definition based on the primitive type identifier.
     * NOTE: Schemas are managed externally by the DataSchemaValidator plugin.
     * This method is deprecated internally but kept for potential external compatibility.
     * @param _primitiveType - The key identifier for the required schema (ignored).
     * @returns {null} Always returns null as schemas are externalized.
     */
    getSchema(_primitiveType: string): null {
        // Schema introspection is handled by the plugin layer, not the core class wrapper.
        return null;
    }

    /**
     * Specialized validation for the primary LLM Evolution output structure.
     * Alias for validate(data, 'EvolutionOutput'). (Crucial for Mission Step 1)
     * @param data - The parsed JSON data from the LLM.
     * @returns {ValidationResult}
     */
    validateEvolutionOutput(data: any): ValidationResult {
        return this.validate(data, 'EvolutionOutput');
    }

    /**
     * Validates a data payload against a known schema primitive using the DataSchemaValidator plugin.
     * @param data - The decoded data payload.
     * @param primitiveType - The expected schema type identifier.
     * @returns {ValidationResult} Validation result object, including detailed errors.
     */
    validate(data: any, primitiveType: string): ValidationResult {
        const validator = this.#validator;

        if (validator) {
            // Delegate execution to the isolated I/O proxy
            return this.#delegateToValidator(validator, data, primitiveType);
        }
        
        // Fallback if plugin infrastructure is missing
        return { isValid: false, errors: ["CRITICAL: DataSchemaValidator plugin is not loaded or accessible."] };
    }
}

export default new SchemaValidator();