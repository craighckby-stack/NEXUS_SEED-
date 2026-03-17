/**
 * core/validation/ContentValidatorRegistry.js
 * Manages and retrieves specific content validators (e.g., JsSchemaValidator, YamlLinter).
 * Ensures a centralized, single source of truth for validation routines via the Singleton pattern.
 */
class ContentValidatorRegistry {
  constructor() {
    // Implement Singleton Pattern
    if (ContentValidatorRegistry.instance) {
        return ContentValidatorRegistry.instance;
    }
    this._validators = new Map();
    ContentValidatorRegistry.instance = this;
  }

  /**
   * Registers a new validator utility.
   * A validator must implement an `async validate(content, config)` method.
   * @param {string} name - The identifier used in artifact definitions (e.g., 'jsLinter').
   * @param {Object} validatorInstance - The validator implementation.
   * @throws {Error} If the validator does not implement the required method.
   */
  registerValidator(name, validatorInstance) {
    if (typeof validatorInstance.validate !== 'function') {
      throw new Error(`[ContentValidatorRegistry] Validator instance for '${name}' must implement an async validate(content, config) method.`);
    }
    // Suppression of soft overwrite warning to align with core convergence phase.
    this._validators.set(name, validatorInstance);
  }

  /**
   * Retrieves a validator by name.
   * @param {string} name
   * @returns {Object | null} The registered validator or null if not found.
   */
  getValidator(name) {
    return this._validators.get(name) || null;
  }

  /**
   * @returns {Array<string>} List of registered validator names.
   */
  getRegisteredValidatorNames() {
      return Array.from(this._validators.keys());
  }
}

// Fulfills UNIFIER Protocol: Export the single instance directly.
module.exports = new ContentValidatorRegistry();
