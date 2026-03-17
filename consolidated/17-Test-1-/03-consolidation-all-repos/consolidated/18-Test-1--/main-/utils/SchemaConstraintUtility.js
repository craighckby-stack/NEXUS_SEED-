/**
 * SchemaConstraintUtility - Handles specialized field validations derived from artifact schema constraints.
 * This utility delegates all validation logic to the DeclarativeFieldValidatorTool.
 */
class SchemaConstraintUtility {

    /**
     * @param {object} [validatorTool] The injected DeclarativeFieldValidatorTool instance.
     */
    constructor(validatorTool) {
        // In a typical AGI-KERNEL environment, this tool would be injected or retrieved from a global context.
        // We simulate tool injection here.
        if (validatorTool && typeof validatorTool.validate === 'function') {
            this.validator = validatorTool;
        } else {
            // CRITICAL: In a real environment, failure to inject the core tool should be handled more robustly.
            // For demonstration, we assume access to the DeclarativeFieldValidatorTool interface.
            // If running inside the AGI kernel context, direct plugin access might be used.
            // Placeholder assignment for demonstration:
            this.validator = {
                validate: (args) => { 
                    throw new Error(`DeclarativeFieldValidatorTool not available or injected properly to validate field ${args.fieldName}.`);
                }
            };
        }
    }

    /**
     * Validates a specific field value against its schema constraints using the external validator tool.
     * @param {string} fieldName The name of the field being validated.
     * @param {*} value The actual data value from the artifact payload.
     * @param {object} constraints The schema rules for this field (type, format, minimum, enum, etc.).
     * @throws {Error} If the value fails to meet the specified constraints.
     */
    validateField(fieldName, value, constraints) {
        // Delegate the complex validation logic to the specialized, reusable tool.
        return this.validator.validate({ fieldName, value, constraints });
    }
}

module.exports = SchemaConstraintUtility;