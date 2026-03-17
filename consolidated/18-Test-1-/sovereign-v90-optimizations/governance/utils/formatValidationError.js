class SchemaErrorFormatter {
    #formatterTool;

    /**
     * Initializes the formatter with the required dependency.
     * @private
     */
    constructor() {
        this.#initializeFormatterTool();
    }

    /**
     * Initializes the formatter tool from the dependency.
     * @private
     */
    #initializeFormatterTool() {
        try {
            const { format } = require('SchemaErrorFormatterTool');
            this.#formatterTool = format;
        } catch (error) {
            throw new Error(`Failed to initialize SchemaErrorFormatterTool: ${error.message}`);
        }
    }

    /**
     * Formats validation errors using the initialized formatter tool.
     * @private
     * @param {Array<object>} rawErrors - Array of validation errors.
     * @returns {Array<object>} Formatted errors.
     */
    #formatErrors(rawErrors) {
        return this.#formatterTool(rawErrors);
    }

    /**
     * Transforms validation errors into the system's structured error format.
     * @param {Array<object>} rawErrors - Array of errors from the validation library.
     * @returns {Array<{path: string, message: string, keyword: string, params: object, schemaPath: string}>}
     */
    formatValidationError(rawErrors) {
        return this.#formatErrors(rawErrors);
    }
}

// Create a singleton instance
const errorFormatter = new SchemaErrorFormatter();

// Export the formatter function
module.exports = {
    formatValidationError: errorFormatter.formatValidationError.bind(errorFormatter)
};
