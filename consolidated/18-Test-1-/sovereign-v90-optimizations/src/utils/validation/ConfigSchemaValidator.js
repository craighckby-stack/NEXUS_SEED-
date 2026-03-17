/**
 * Configuration Schema Validator Utility (v94.3)
 * Required for advanced configuration governance, ensuring deeply parsed JSON
 * structures conform to defined operational schemas.
 * 
 * NOTE: This utility now leverages the BasicConfigSchemaValidator tool for rapid
 * structural and required field checks, substituting for a full JSON Schema
 * implementation (like 'ajv') in non-critical paths.
 */

// @ts-ignore: Assume global access to AGI_KERNEL_PLUGINS
const BasicConfigSchemaValidator = AGI_KERNEL_PLUGINS.BasicConfigSchemaValidator;

/**
 * Validates a configuration object against a JSON schema using basic structural checks.
 * 
 * @param {object|array} configObject - The configuration structure to validate.
 * @param {object} schema - The predefined JSON schema (draft-07 or newer).
 * @param {string} configName - Descriptive name for logging context (e.g., 'CRITICALITY_WEIGHTS').
 * @returns {object} { isValid: boolean, errors: Array<string> }
 */
const validateConfig = (configObject, schema, configName) => {
    if (!BasicConfigSchemaValidator || typeof BasicConfigSchemaValidator.execute !== 'function') {
        console.error("FATAL: BasicConfigSchemaValidator tool not available. Skipping validation.");
        return { isValid: false, errors: ["Validator tool not initialized or accessible."] };
    }
    
    /** @type {{ isValid: boolean, errors: Array<string> }} */
    const validationResult = BasicConfigSchemaValidator.execute({
        configObject,
        schema,
        configName
    });

    // Separate errors into critical failures (Fatal/Schema errors) and warnings (Type warnings)
    const criticalErrors = validationResult.errors.filter(e => !e.startsWith('[Type Warning]'));
    const warnings = validationResult.errors.filter(e => e.startsWith('[Type Warning]'));

    if (!validationResult.isValid) {
        console.error(`[Validation Failed] Configuration ${configName} failed governance checks. Total critical errors: ${criticalErrors.length}`);
        criticalErrors.forEach(err => console.error(err));
        // Log warnings even if validation failed critically
        warnings.forEach(w => console.warn(w)); 
        
        // Return only critical errors in the error array
        return { isValid: false, errors: criticalErrors };
    }

    // Success path (isValid is true)
    if (warnings.length > 0) {
        console.log(`[Validation Success] Config ${configName} passed structural integrity check with ${warnings.length} warnings.`);
        warnings.forEach(w => console.warn(w));
    } else {
        console.log(`[Validation Success] Config ${configName} passed structural integrity check.`);
    }
    
    return { isValid: true, errors: [] };
};

module.exports = { validateConfig };
