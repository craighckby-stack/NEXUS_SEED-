const Ajv = require('ajv').default;
const fs = require('fs');
const path = require('path');

/**
 * SchemaValidator: A utility to load, compile, and strictly validate 
 * configurations against the GRS schema using Ajv.
 */
class SchemaValidator {
  constructor(schemaPath = path.join(__dirname, '../config/GRS_Validation_Schema.json')) {
    // Enable strict mode and allErrors for comprehensive feedback
    this.ajv = new Ajv({
      allErrors: true,
      strict: true,
      coerceTypes: false, // Prevent silent type conversion
      useDefaults: true
    });
    this.schemaPath = schemaPath;
    this.validator = null;
    this._loadSchema();
  }

  _loadSchema() {
    try {
      const schemaContent = fs.readFileSync(this.schemaPath, 'utf8');
      const schema = JSON.parse(schemaContent);
      this.validator = this.ajv.compile(schema);
      console.log(`[SchemaValidator] GRS Schema loaded and compiled.`);
    } catch (error) {
      console.error(`[SchemaValidator] FATAL ERROR: Failed to initialize schema validator from ${this.schemaPath}. System cannot guarantee operational integrity.`);
      // Configuration validation is a critical path dependency.
      process.exit(1);
    }
  }

  /**
   * Validates a configuration object against the compiled GRS schema.
   * @param {object} configObject - The configuration data to validate.
   * @returns {{isValid: boolean, errors: Array<object>|null}}
   */
  validate(configObject) {
    if (!this.validator) {
      throw new Error("Validator failed initialization.");
    }
    const valid = this.validator(configObject);
    return {
      isValid: valid,
      errors: valid ? null : this.validator.errors
    };
  }
}

module.exports = new SchemaValidator();