/**
 * Schema Guard Utility (Sovereign AGI v94.1)
 * Provides structural and advanced type validation for complex configuration objects and arrays.
 * This utility now delegates complex schema validation to the StructuralSchemaValidatorTool plugin.
 */

/**
 * Defines accepted structure types for schema checking.
 * 'number', 'string', 'boolean', 'array', 'object', 'any'
 */

// NOTE: StructuralSchemaValidatorTool is assumed to be available via plugin injection.
// The exported 'validate' function delegates the core logic to this high-performance tool.

const SchemaGuard = {

    /**
     * Executes structural validation against a predefined schema.
     * @param {object} data The object to validate.
     * @param {object} schema The validation schema definition.
     * @returns {Array<string>} An array of validation errors. Empty array means valid.
     */
    validate(data, schema) {
        // We check for the availability of the injected tool
        if (typeof StructuralSchemaValidatorTool === 'object' && StructuralSchemaValidatorTool !== null && typeof StructuralSchemaValidatorTool.validate === 'function') {
            return StructuralSchemaValidatorTool.validate(data, schema);
        }
        
        // Fallback/Error state if the plugin is not loaded
        console.error("FATAL: StructuralSchemaValidatorTool plugin not available for SchemaGuard.");
        return ["Kernel integrity failure: Required validation utility missing."];
    }
};

module.exports = SchemaGuard;
