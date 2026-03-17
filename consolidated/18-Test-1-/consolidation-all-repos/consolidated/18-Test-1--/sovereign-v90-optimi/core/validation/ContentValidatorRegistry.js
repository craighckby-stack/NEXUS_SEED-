/**
 * core/validation/ContentValidatorRegistry.js
 * Manages and retrieves specific content validators (e.g., JsSchemaValidator, YamlLinter).
 * Ensures a centralized, single source of truth for validation routines via the Singleton pattern.
 * 
 * NOTE: Assumes ServiceRegistry base class is available.
 */
class ContentValidatorRegistry extends ServiceRegistry { 

  constructor() {
    this.#initializeRegistry();
  }

  /**
   * Initializes the Singleton instance and the base ServiceRegistry.
   */
  #initializeRegistry() {
    // 1. Singleton Check
    if (ContentValidatorRegistry.instance) {
        return ContentValidatorRegistry.instance;
    }
    // 2. Initialize ServiceRegistry (sets up internal map for storage)
    super(); 
    ContentValidatorRegistry.instance = this;
  }

  /**
   * Ensures the validator instance implements the required methods.
   * @param {string} name - The identifier.
   * @param {Object} validatorInstance - The validator implementation.
   * @throws {Error} If validation fails.
   */
  #validateValidatorInterface(name, validatorInstance) {
    if (typeof validatorInstance.validate !== 'function') {
      throw new Error(`[ContentValidatorRegistry] Validator instance for '${name}' must implement an async validate(content, config) method.`);
    }
  }

  // --- I/O Proxies for ServiceRegistry Interactions (Base Class Dependency) ---

  #delegateToRegistryHas(name) {
      return super.has(name);
  }
  
  #delegateToRegistryRegister(name, instance) {
      super.register(name, instance);
  }

  #delegateToRegistryGet(name) {
      return super.get(name);
  }

  #delegateToRegistryGetKeys() {
      return super.getKeys();
  }


  /**
   * Registers a new validator utility.
   * A validator must implement an `async validate(content, config)` method.
   * @param {string} name - The identifier used in artifact definitions (e.g., 'jsLinter').
   * @param {Object} validatorInstance - The validator implementation.
   * @throws {Error} If the validator does not implement the required method.
   */
  registerValidator(name, validatorInstance) {
    this.#validateValidatorInterface(name, validatorInstance);
    
    // Delegate storage and key validation to the base registry
    if (this.#delegateToRegistryHas(name)) {
        // console.warn(`[ContentValidatorRegistry] Validator '${name}' is being overwritten.`);
    }
    this.#delegateToRegistryRegister(name, validatorInstance);
  }

  /**
   * Retrieves a validator by name.
   * @param {string} name
   * @returns {Object | null} The registered validator or null if not found.
   */
  getValidator(name) {
    return this.#delegateToRegistryGet(name);
  }

  /**
   * @returns {Array<string>} List of registered validator names.
   */
  getRegisteredValidatorNames() {
      return this.#delegateToRegistryGetKeys();
  }
}

// Create and export the single instance (Singleton)
module.exports = new ContentValidatorRegistry();