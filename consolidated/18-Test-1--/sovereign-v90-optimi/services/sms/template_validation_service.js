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
 * Kernel responsible for validating SMS template configurations 
 * against a schema and runtime input data against template requirements.
 */
class TemplateValidationKernel {
  
  // Private internal state
  #configIntegrityKernel;
  #segmentCalculatorTool;
  #templates; // Map<string, SmsTemplate>
  #TemplateNotFoundErrorClass;
  #InputValidationErrorClass;

  static DEFAULT_MAX_SEGMENTS = DEFAULT_MAX_SEGMENTS;
  static TEMPLATE_KEY_FIELD = TEMPLATE_KEY_FIELD;

  /**
   * @param {Object} dependencies 
   * @param {ConfigurationIntegrityKernel} dependencies.configIntegrityKernel
   * @param {SmsSegmentCalculatorToolKernel} [dependencies.segmentCalculatorTool]
   * @param {Function} dependencies.TemplateNotFoundErrorClass - Constructor for TemplateNotFoundError
   * @param {Function} dependencies.InputValidationErrorClass - Constructor for InputValidationError
   * @param {Object} config 
   * @param {SmsTemplate[]} config.messageTemplates - Array of template objects.
   */
  constructor(dependencies, config) {
    this.#setupDependencies(dependencies, config);
  }

  /**
   * Rigorously validates and assigns all required dependencies and configuration.
   * @private
   */
  #setupDependencies(dependencies, config) {
    if (!dependencies.configIntegrityKernel) {
         throw new Error('Dependency Error: ConfigurationIntegrityKernel is required.');
    }
    if (!dependencies.TemplateNotFoundErrorClass || !dependencies.InputValidationErrorClass) {
         throw new Error('Dependency Error: Error classes (TemplateNotFoundErrorClass, InputValidationErrorClass) are required.');
    }
    if (!config || !config.messageTemplates) {
         throw new Error('Configuration Error: config.messageTemplates array is required.');
    }

    this.#configIntegrityKernel = dependencies.configIntegrityKernel;
    this.#segmentCalculatorTool = dependencies.segmentCalculatorTool || null; 
    this.#TemplateNotFoundErrorClass = dependencies.TemplateNotFoundErrorClass;
    this.#InputValidationErrorClass = dependencies.InputValidationErrorClass;
    
    const messageTemplates = config.messageTemplates;
    const KEY_FIELD = TemplateValidationKernel.TEMPLATE_KEY_FIELD;

    if (messageTemplates.some(t => !t || !t[KEY_FIELD])) {
         throw new Error(`Setup Validation Error: All templates must define a non-null '${KEY_FIELD}' property.`);
    }

    this.#templates = new Map(messageTemplates.map(t => [t[KEY_FIELD], t]));
  }

  // --- I/O Proxy Methods ---

  /**
   * Delegates configuration validation to the injected ConfigurationIntegrityKernel.
   * @private
   */
  #delegateToConfigIntegrityCheck(config) {
    // Assuming ConfigurationIntegrityKernel is pre-configured to handle the SMS schema context.
    this.#configIntegrityKernel.validateConfiguration(config);
    return true;
  }
  
  /**
   * Looks up a template and throws a structured error if not found.
   * @private
   */
  #delegateToTemplateLookup(templateKey) {
    const template = this.#templates.get(templateKey);
    
    if (!template) {
      throw new this.#TemplateNotFoundErrorClass(`Template not found: ${templateKey}`);
    }
    return template;
  }

  /**
   * Checks for missing required variables and throws a structured error if variables are missing.
   * @private
   */
  #delegateToCheckRequiredVariables(template, templateKey, inputData) {
    const inputIsObject = inputData !== null && typeof inputData === 'object';
    
    const missingVars = (template.required_variables || []).filter(
      requiredVar => !inputIsObject || !(requiredVar in inputData)
    );

    if (missingVars.length > 0) {
      throw new this.#InputValidationErrorClass(
        `Missing required variables for template ${templateKey}: ${missingVars.join(', ')}`
      );
    }
  }

  /**
   * Delegates segment calculation to the injected tool.
   * @private
   */
  #delegateToSegmentCalculator(template, inputData) {
    if (!this.#segmentCalculatorTool) {
        return null; 
    }
    
    return this.#segmentCalculatorTool.calculateSegments({
        content: template.content,
        data: inputData, 
        encoding: template.encoding
    });
  }

  /**
   * Checks message segment constraints and throws a structured error if limits are exceeded.
   * @private
   */
  #delegateToCheckMessageConstraints(template, templateKey, inputData) {
    const segments = this.#delegateToSegmentCalculator(template, inputData);

    if (segments === null) {
        return; // Segment calculator dependency was not provided
    }
    
    const maxSegments = template.max_segments !== undefined 
        ? template.max_segments 
        : TemplateValidationKernel.DEFAULT_MAX_SEGMENTS; 

    if (segments > maxSegments) {
        throw new this.#InputValidationErrorClass(
            `Message for template ${templateKey} exceeds maximum segment limit (${segments}/${maxSegments}).`
        );
    }
  }

  // --- Public Interface ---

  /**
   * Validates runtime input data against required variables and segment limits.
   * @param {string} templateKey - The key of the SMS template.
   * @param {Object} inputData - Runtime data for substitution.
   * @returns {void} Throws an error on failure.
   */
  validateRuntimeData(templateKey, inputData) {
    const template = this.#delegateToTemplateLookup(templateKey);
    
    this.#delegateToCheckRequiredVariables(template, templateKey, inputData);
    this.#delegateToCheckMessageConstraints(template, templateKey, inputData);
  }

  /**
   * Validates the configuration data itself against the master JSON schema.
   * @param {Object} config - The SMS configuration object being validated.
   * @returns {boolean} True if validation passes.
   * @throws {Error} If configuration validation fails.
   */
  validateSchemaIntegrity(config) {
    return this.#delegateToConfigIntegrityCheck(config);
  }
}

module.exports = TemplateValidationKernel;