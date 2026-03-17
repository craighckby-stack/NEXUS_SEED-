/**
 * Sovereign AGI v95.0 - High-Integrity Schema Validator
 * Function: Provides robust, declarative validation for internal data structures 
 *           (e.g., M01 Intents, Configuration Blocks) by delegating to the core constraint engine.
 */
interface SchemaDefinition {
    required?: boolean;
    type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
    min?: number;
    max?: number;
    integer?: boolean;
    minLength?: number;
    length?: number;
    values?: any[];
}

interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

// Conceptual interface for the extracted tool access
interface IConstraintValidatorTool {
    execute(args: { data: any, schema: Record<string, SchemaDefinition> }): ValidationResult;
}

/**
 * SchemaValidator class, now acting as a delegator for constraint validation.
 * The complex constraint logic has been moved to the DeclarativeConstraintValidator plugin.
 */
class SchemaValidator {

    /**
     * Validates a data object against a defined schema using the delegated constraint tool.
     * @param {Object} data - The object to validate.
     * @param {Object} schema - The declarative schema definition.
     * @returns {{ isValid: boolean, errors: string[] }}
     */
    validate(data: any, schema: Record<string, SchemaDefinition>): ValidationResult {
        
        // Simulate tool execution access via a conceptual global registry for demonstration.
        const validatorTool: IConstraintValidatorTool = globalThis.AGI_TOOL_REGISTRY?.DeclarativeConstraintValidator;

        if (validatorTool && typeof validatorTool.execute === 'function') {
            // Delegate core logic to the extracted plugin
            return validatorTool.execute({ data, schema });
        }

        // CRITICAL INTEGRITY POLICY CHANGE:
        // If the validation tool is missing, validation MUST NOT be bypassed (default pass).
        // This indicates a severe kernel initialization failure. We must Fail-Fast.
        const errorMsg = "CRITICAL KERNEL INTEGRITY FAILURE: Required tool 'DeclarativeConstraintValidator' not found. Validation bypassed, integrity cannot be guaranteed.";
        
        console.error(errorMsg);

        // Throw an exception to immediately halt processing and signal the unrecoverable configuration error.
        throw new Error(errorMsg);
    }
}

module.exports = SchemaValidator;