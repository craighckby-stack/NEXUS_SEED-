const TemplateNotFoundError = require('../errors/TemplateNotFoundError');
const InputValidationError = require('../errors/InputValidationError');

/**
 * Service constants for constraints
 */
const DEFAULT_MAX_SEGMENTS = 5;
const TEMPLATE_KEY_FIELD = 'template_key';

/**
 * @typedef {Object} SmsTemplate
 * @property {string} template_key
 * @property {string} content - The SMS template string.
 * @property {string[]} required_variables
 * @property {number} [max_segments]
 * @property {string} [encoding='GSM_7BIT']
 */

/**
 * Service responsible for validating SMS template configurations 
 * against a schema and runtime input data against template requirements.
 *
 * Assumes dependencies handle content interpolation implicitly (e.g., segmentCalculator
 * will substitute variables before counting segments).
 */
class TemplateValidationService {
  /**
   * @param {Object} dependencies 
   * @param {Object} dependencies.validator - JSON Schema validator instance (e.g., AJV, must support .validate(schema, data) and .errors).
   * @param {Function} [dependencies.segmentCalculator] - Utility function: ({ content, data, encoding }) => number
   * @param {Object} schemaConfig - The master configuration schema for templates.
   * @param {SmsTemplate[]} messageTemplates - Array of template objects.
   */
  constructor({ validator, segmentCalculator }, schemaConfig, messageTemplates) {
    if (!validator) {
      throw new Error("TemplateValidationService requires a 'validator' dependency.");
    }
    
    this.validator = validator;
    this.calculateSegments = segmentCalculator || null; 
    this.schema = schemaConfig;

    if (messageTemplates.some(t => !t || !t[TEMPLATE_KEY_FIELD])) {
         throw new Error(`All templates must define a non-null '${TEMPLATE_KEY_FIELD}' property.`);
    }

    /** @type {Map<string, SmsTemplate>} */
    this.templates = new Map(messageTemplates.map(t => [t[TEMPLATE_KEY_FIELD], t]));
  }

  /**
   * Validates runtime input data against required variables and segment limits.
   * @param {string} templateKey - The key of the SMS template.
   * @param {Object} inputData - Runtime data for substitution.
   * @returns {void} Throws an error on failure.
   * @throws {TemplateNotFoundError} If template key is invalid.
   * @throws {InputValidationError} If data is missing variables or exceeds limits.
   */
  validateRuntimeData(templateKey, inputData) {
    const template = this.templates.get(templateKey);
    
    if (!template) {
      throw new TemplateNotFoundError(`Template not found: ${templateKey}`);
    }

    this._checkRequiredVariables(template, templateKey, inputData);
    this._checkMessageConstraints(template, templateKey, inputData);
  }

  /**
   * Internal helper to check for missing required variables.
   * @param {SmsTemplate} template
   * @param {string} templateKey
   * @param {Object} inputData
   * @throws {InputValidationError}
   */
  _checkRequiredVariables(template, templateKey, inputData) {
    const inputIsObject = inputData !== null && typeof inputData === 'object';
    
    const missingVars = (template.required_variables || []).filter(
      requiredVar => !inputIsObject || !(requiredVar in inputData)
    );

    if (missingVars.length > 0) {
      throw new InputValidationError(
        `Missing required variables for template ${templateKey}: ${missingVars.join(', ')}`
      );
    }
  }

  /**
   * Internal helper to check message constraints (segments).
   * @param {SmsTemplate} template
   * @param {string} templateKey
   * @param {Object} inputData
   * @throws {InputValidationError}
   */
  _checkMessageConstraints(template, templateKey, inputData) {
    if (!this.calculateSegments) {
        // Cannot check segments without the dependency.
        return; 
    }
    
    // --- Segment Check ---

    const segments = this.calculateSegments({
        content: template.content,
        data: inputData, // Data passed for internal interpolation
        encoding: template.encoding
    });

    // Use constant for default limit and check for explicit 'undefined'
    const maxSegments = template.max_segments !== undefined 
        ? template.max_segments 
        : DEFAULT_MAX_SEGMENTS; 

    if (segments > maxSegments) {
        throw new InputValidationError(
            `Message for template ${templateKey} exceeds maximum segment limit (${segments}/${maxSegments}).`
        );
    }
  }

  /**
   * Validates the configuration data itself against the master JSON schema.
   * This should typically run during system initialization/config load.
   * @param {Object} config - The SMS configuration object being validated.
   * @returns {boolean} True if validation passes.
   * @throws {Error} If configuration validation fails.
   */
  validateSchemaIntegrity(config) {
    const isValid = this.validator.validate(this.schema, config);

    if (!isValid) {
      // Improve error context and reporting detail by pretty-printing AJV errors
      const errors = this.validator.errors 
          ? JSON.stringify(this.validator.errors, null, 2) 
          : "Unknown validation errors (validator.errors was null).";
      
      throw new Error(`SMS Template Schema Integrity Check Failed:\n${errors}`);
    }

    return true;
  }
}

module.exports = TemplateValidationService;