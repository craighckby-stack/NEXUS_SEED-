/**
 * AGI-KERNEL v7.11.3 Navigator Edition - Core Schema Validator Utility
 * Provides standardized, high-performance schema validation essential for data integrity
 * across sensitive service boundaries.
 *
 * Uses the StructuralSchemaValidator plugin for robust, recursive, and strict validation logic.
 */

class SchemaValidator_Util {
  /**
   * Default schemas for core system components.
   * @private
   */
  static #defaultSchemas = {
    'FailureTraceLog': {
      timestamp: { type: 'string', required: true },
      component: { type: 'string', required: true },
      trace_id: { type: 'string', required: true, description: 'Unique ID for error correlation' },
      error_details: {
        type: 'object',
        required: true,
        subSchema: {
          code: { type: 'number', required: true },
          message: { type: 'string', required: true },
          is_recoverable: { type: 'boolean', required: false }
        }
      }
    }
  };

  /**
   * Creates a new SchemaValidator_Util instance.
   * @throws {Error} If the StructuralSchemaValidator plugin is not available.
   */
  constructor() {
    this.#validatePluginAvailability();
    this.#initializeDefaultSchemas();
  }

  /**
   * Validates that the required plugin is available in the runtime environment.
   * @private
   * @throws {Error} If the StructuralSchemaValidator plugin is missing.
   */
  #validatePluginAvailability() {
    if (typeof plugins === 'undefined' || !plugins.StructuralSchemaValidator) {
      throw new Error("CRITICAL: StructuralSchemaValidator plugin missing. Cannot initialize SchemaValidator_Util.");
    }
    this.validatorPlugin = plugins.StructuralSchemaValidator;
  }

  /**
   * Registers a schema with the validation plugin.
   * @private
   * @param {string} schemaName - The name of the schema.
   * @param {Object} definition - The schema definition.
   */
  #registerSchema(schemaName, definition) {
    this.validatorPlugin.execute({
      action: 'register',
      schemaName,
      definition
    });
  }

  /**
   * Validates data against a registered schema.
   * @private
   * @param {string} schemaName - The name of the schema.
   * @param {Object} data - The data to validate.
   * @returns {Object} Validation result with isValid and properties.
   */
  #validateData(schemaName, data) {
    return this.validatorPlugin.execute({
      action: 'validate',
      schemaName,
      data
    });
  }

  /**
   * Registers all predefined core schemas with the validation engine.
   * @private
   */
  #initializeDefaultSchemas() {
    Object.entries(SchemaValidator_Util.#defaultSchemas).forEach(
      ([schemaName, definition]) => this.#registerSchema(schemaName, definition)
    );
  }

  /**
   * Dynamically registers a new schema definition.
   * @param {string} schemaName - The unique name of the schema.
   * @param {Object} definition - The schema definition object.
   */
  registerSchema(schemaName, definition) {
    if (typeof schemaName !== 'string' || !schemaName.trim()) {
      throw new Error('Schema name must be a non-empty string');
    }
    if (typeof definition !== 'object' || definition === null) {
      throw new Error('Schema definition must be an object');
    }
    this.#registerSchema(schemaName, definition);
  }

  /**
   * Validates input data against a defined schema.
   * @param {string} schemaName - The name of the schema to use.
   * @param {Object} data - The data payload to validate.
   * @returns {Object} { isValid: boolean, errors: string[] }
   */
  validate(schemaName, data) {
    if (typeof schemaName !== 'string' || !schemaName.trim()) {
      throw new Error('Schema name must be a non-empty string');
    }
    if (typeof data === 'undefined' || data === null) {
      throw new Error('Data to validate cannot be null or undefined');
    }
    return this.#validateData(schemaName, data);
  }
}

module.exports = new SchemaValidator_Util();
