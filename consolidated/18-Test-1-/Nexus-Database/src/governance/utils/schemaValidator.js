/**
 * SchemaValidator Utility (Ajv Wrapper)
 * V97.0.0: High-performance JSON Schema compiler.
 */
const Ajv = require('ajv').default;

class SchemaValidator {
    constructor() {
        // Configure Ajv for strict, production-ready schema validation
        this.ajv = new Ajv({
            allErrors: true,
            strict: true,
            coerceTypes: false,
            removeAdditional: 'failing',
            // Add format implementations if complex types like 'uuid' or 'date-time' are expected
        });
    }

    /**
     * Compiles a JSON Schema into a reusable, high-performance validation function.
     * @param {object} schema - The JSON Schema definition.
     * @returns {Ajv.ValidateFunction} The compiled validation function.
     * @throws {Error} If schema compilation fails.
     */
    compile(schema) {
        if (!schema || typeof schema !== 'object') {
            throw new Error('Invalid schema provided for compilation.');
        }
        return this.ajv.compile(schema);
    }

    /**
     * Helper method to directly validate data against a raw schema (less efficient than using compiled function).
     * Primarily for testing or single-use cases.
     */
    validate(schema, data) {
        const validateFn = this.compile(schema);
        const isValid = validateFn(data);
        return { isValid, errors: validateFn.errors };
    }
}

module.exports = SchemaValidator;
