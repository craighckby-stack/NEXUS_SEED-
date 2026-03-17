const { ValidationError } = require('../../utils/ValidationError');

/**
 * Manages the evaluation of dependency constraints (e.g., A requires B, C mutually exclusive with D).
 * This engine focuses solely on relationships between fields, not single-field data type validation.
 */
class CrossFieldDependencyEngineKernel {
  #pathResolver;
  #logger;
  #dependencies;

  /**
   * Internal map linking common schema directives (keys) to evaluation methods (handlers).
   * Standardizes the dependency syntax interpretation across the application.
   */
  DEPENDENCY_MAP = {};

  /**
   * @param {object} dependencies 
   * @param {IJsonPathQueryToolKernel} dependencies.IJsonPathQueryToolKernel - Tool for resolving object paths.
   * @param {ILoggerToolKernel} dependencies.ILoggerToolKernel - Logger utility.
   */
  constructor(dependencies) {
    this.#dependencies = dependencies;
    this.#setupDependencies();

    // Bind internal methods to the instance
    this._evaluateRequirement = this._evaluateRequirement.bind(this);
    this._evaluateExclusion = this._evaluateExclusion.bind(this);
    this._evaluateConditional = this._evaluateConditional.bind(this);

    // Initialize the dependency map with bound instance methods
    this.DEPENDENCY_MAP = {
      'requiresIf': this._evaluateRequirement,
      'mutuallyExclusive': this._evaluateExclusion,
      'conditionalRule': this._evaluateConditional
    };
  }

  #setupDependencies() {
    const { IJsonPathQueryToolKernel, ILoggerToolKernel } = this.#dependencies;

    if (!IJsonPathQueryToolKernel || typeof IJsonPathQueryToolKernel.resolve !== 'function') {
      throw new Error('CrossFieldDependencyEngineKernel requires IJsonPathQueryToolKernel with a resolve method.');
    }
    if (!ILoggerToolKernel) {
      throw new Error('CrossFieldDependencyEngineKernel requires ILoggerToolKernel.');
    }

    this.#pathResolver = IJsonPathQueryToolKernel;
    this.#logger = ILoggerToolKernel;
  }

  async initialize() {
    // Standard kernel initialization hook
    return Promise.resolve();
  }

  /**
   * Executes all cross-field dependency validation rules by iterating through schema directives.
   * 
   * @param {Object} fieldSchema - The specific schema definition for the field currently being evaluated.
   * @param {string} currentFieldPath - Dot-separated path of the field being evaluated (e.g., 'user.address.zip').
   * @param {Object} dataContext - The full input object being validated (root data).
   * @returns {Promise<Array<ValidationError>>} List of accumulated validation errors.
   */
  async execute(fieldSchema, currentFieldPath, dataContext) {
    const errors = [];

    if (!fieldSchema || typeof fieldSchema !== 'object') {
      return errors;
    }

    for (const [directive, ruleDefinition] of Object.entries(fieldSchema)) {
      const handler = this.DEPENDENCY_MAP[directive];

      if (handler) {
        try {
          // Handlers must return an array of ValidationError instances
          // Await execution as strategic computation must be asynchronous
          const results = await handler(currentFieldPath, ruleDefinition, dataContext);
          errors.push(...results);
        } catch (error) {
          this.#logger.error(`[DependencyEngine] Failed evaluating rule '${directive}' for ${currentFieldPath}.`, { error: error.message, ruleDefinition });
          // Continue execution despite error in a single rule
        }
      }
    }
    return errors;
  }

  // --- Internal Evaluation Helpers ---

  /**
   * Evaluates simple conditional requirement dependency.
   *
   * @param {string} currentFieldPath - The field being evaluated (the source of the requirement).
   * @param {Object} ruleDefinition - Specific rules defining the condition and targets.
   * @param {Object} dataContext - Root data.
   * @returns {Promise<Array<ValidationError>>}
   */
  async _evaluateRequirement(currentFieldPath, ruleDefinition, dataContext) {
    const errors = [];
    const { presenceOf, requiredTargets } = ruleDefinition;

    if (!presenceOf || !requiredTargets) {
      return errors;
    }

    // 1. Check Condition 
    let dependencyValue;
    try {
      // Use injected asynchronous path resolver
      dependencyValue = await this.#pathResolver.resolve(dataContext, presenceOf);
    } catch (e) {
      this.#logger.warn(`Resolution error for dependency path ${presenceOf}. Skipping requirement check.`, { field: currentFieldPath, error: e.message });
      return errors;
    }

    // Check passes if the dependency field is present (not undefined and not null)
    if (dependencyValue !== undefined && dependencyValue !== null) {
      const targets = Array.isArray(requiredTargets) ? requiredTargets : [requiredTargets];

      // 2. Evaluate Targets
      for (const targetFieldPath of targets) {
        let targetValue;
        try {
          targetValue = await this.#pathResolver.resolve(dataContext, targetFieldPath);
        } catch (e) {
          this.#logger.warn(`Resolution error for target path ${targetFieldPath}. Cannot check presence.`, { field: currentFieldPath, error: e.message });
          continue;
        }

        if (targetValue === undefined || targetValue === null) {
          errors.push(new ValidationError(
            targetFieldPath,
            `${targetFieldPath} is required because ${presenceOf} is provided. (Triggered by value: ${JSON.stringify(dependencyValue).substring(0, 50)})`,
            'dependency.required'
          ));
        }
      }
    }
    return errors;
  }

  /**
   * Logic for checking mutual exclusion.
   */
  async _evaluateExclusion(currentFieldPath, mutuallyExclusiveFields, dataContext) {
    // Implementation pending
    return [];
  }

  /**
   * Logic for complex conditional requirements.
   */
  async _evaluateConditional(currentFieldPath, conditionalRules, dataContext) {
    // Implementation pending
    return [];
  }
}

module.exports = CrossFieldDependencyEngineKernel;