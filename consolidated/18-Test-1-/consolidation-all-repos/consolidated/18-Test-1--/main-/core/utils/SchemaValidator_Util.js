/**
 * Sovereign AGI v94.1 Schema Validator Utility
 * Provides standardized, high-performance schema validation. 
 * Ensures data integrity across sensitive service boundaries by centralizing schema definitions.
 */

class SchemaValidator_Util {

  constructor() {
    // Centralized schema definitions for critical data flows
    this.schemas = {
      'FailureTraceLog': {
        timestamp: { type: 'string', required: true },
        component: { type: 'string', required: true },
        trace_id: { type: 'string', required: true, description: 'Unique ID for error correlation' },
        error_details: { type: 'object', required: true }
      },
      // Future schemas: 'TelemetryEvent', 'ConfigurationUpdate'
    };
  }

  /**
   * Validates input data against a defined schema.
   * NOTE: This is a robust mock. A true AGI implementation would utilize Zod/Joi.
   * @param {string} schemaName - The name of the schema to use.
   * @param {Object} data - The data payload to validate.
   * @returns {Object} { isValid: boolean, errors: string[] }
   */
  validate(schemaName, data) {
    const schema = this.schemas[schemaName];
    const errors = [];

    if (!schema) {
      return { isValid: false, errors: [`Schema definition '${schemaName}' not found.`] };
    }

    for (const field in schema) {
      const definition = schema[field];
      const fieldValue = data[field];

      // 1. Required Check
      if (definition.required && (typeof fieldValue === 'undefined' || fieldValue === null)) {
        errors.push(`Missing required field: ${field}`);
        continue; 
      }

      // 2. Type Check (only if value is present)
      if (typeof fieldValue !== 'undefined' && definition.type && typeof fieldValue !== definition.type) {
        // Handle typeof null === 'object' edge case, and allow generic object structure.
        if (definition.type === 'object' && fieldValue !== null) continue;
        errors.push(`Field '${field}' type mismatch. Expected ${definition.type}, got ${typeof fieldValue}.`);
      }
    }
    
    return { 
      isValid: errors.length === 0, 
      errors 
    };
  }
}

module.exports = new SchemaValidator_Util();