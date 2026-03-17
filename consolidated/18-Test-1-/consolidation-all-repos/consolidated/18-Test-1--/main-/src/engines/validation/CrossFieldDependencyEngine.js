const { ValidationError } = require('../../utils/ValidationError');

/**
 * Manages the evaluation of dependency constraints (e.g., A requires B, C mutually exclusive with D).
 * This engine focuses solely on relationships between fields, not single-field data type validation.
 */
class CrossFieldDependencyEngine {

  /**
   * Internal map linking common schema directives (keys) to evaluation methods (handlers).
   * Standardizes the dependency syntax interpretation across the application.
   */
  static DEPENDENCY_MAP = {
    // Field must be present if a specified condition (value match/presence) in another field is met.
    'requiresIf': CrossFieldDependencyEngine._evaluateRequirement,
    // Ensures fields are mutually exclusive (only one can have a value).
    'mutuallyExclusive': CrossFieldDependencyEngine._evaluateExclusion,
    // Defines complex conditional requirements based on a specific value match (e.g., IF A='X', THEN B is required)
    'conditionalRule': CrossFieldDependencyEngine._evaluateConditional
  };

  /**
   * Executes all cross-field dependency validation rules by iterating through schema directives.
   * 
   * @param {Object} fieldSchema - The specific schema definition for the field currently being evaluated.
   * @param {string} currentFieldPath - Dot-separated path of the field being evaluated (e.g., 'user.address.zip').
   * @param {Object} dataContext - The full input object being validated (root data).
   * @returns {Array<ValidationError>} List of accumulated validation errors.
   */
  static execute(fieldSchema, currentFieldPath, dataContext) {
    const errors = [];

    for (const [directive, ruleDefinition] of Object.entries(fieldSchema)) {
      if (CrossFieldDependencyEngine.DEPENDENCY_MAP[directive]) {
        const handler = CrossFieldDependencyEngine.DEPENDENCY_MAP[directive];
        // Handlers must return an array of ValidationError instances
        const results = handler(currentFieldPath, ruleDefinition, dataContext);
        errors.push(...results);
      }
    }
    return errors;
  }

  // --- Internal Evaluation Helpers ---

  /**
   * Evaluates simple conditional requirement dependency: If currentFieldPath has a specific value or is present,
   * target fields must also have values.
   *
   * Rule Structure Example (within field A's schema):
   * requiresIf: { presenceOf: 'B', requiredTargets: ['C', 'D'] }
   *
   * @param {string} currentFieldPath - The field being evaluated (the source of the requirement).
   * @param {Object} ruleDefinition - Specific rules defining the condition and targets.
   * @param {Object} dataContext - Root data.
   * @returns {Array<ValidationError>}
   */
  static _evaluateRequirement(currentFieldPath, ruleDefinition, dataContext) {
    const errors = [];
    const { presenceOf, requiredTargets } = ruleDefinition;

    // 1. Check Condition (simplification: if 'presenceOf' exists, check if that field is present)
    const dependencyValue = CrossFieldDependencyEngine._resolvePath(dataContext, presenceOf);

    // Check passes if the dependency field is present (assuming simple presence check for efficiency)
    if (dependencyValue !== undefined && dependencyValue !== null) { 
      const targets = Array.isArray(requiredTargets) ? requiredTargets : [requiredTargets];
      
      // 2. Evaluate Targets
      targets.forEach(targetFieldPath => {
        const targetValue = CrossFieldDependencyEngine._resolvePath(dataContext, targetFieldPath);
        if (targetValue === undefined || targetValue === null) {
          errors.push(new ValidationError(
            targetFieldPath, 
            `${targetFieldPath} is required because ${presenceOf} is provided.`,
            'dependency.required'
          ));
        }
      });
    }
    return errors;
  }
  
  static _evaluateExclusion(currentFieldPath, mutuallyExclusiveFields, dataContext) {
      // Stub: Logic for checking if the current field conflicts with mutually exclusive fields.
      return []; 
  }

  static _evaluateConditional(currentFieldPath, conditionalRules, dataContext) {
      // Stub: Logic for complex 'when value equals X' type rules.
      return [];
  }
  
  /**
   * Utility to safely retrieve a value from a nested object using a dot path.
   * @param {Object} data - The root data object.
   * @param {string} path - The dot-separated path.
   * @returns {*} The value, or undefined if not found.
   */
  static _resolvePath(data, path) {
    return path.split('.').reduce((obj, key) => 
      (obj && obj[key] !== undefined) ? obj[key] : undefined, data);
  }
}

module.exports = CrossFieldDependencyEngine;