# validation/base.py

/**
 * Base class for validation.
 */
class Validator {
  #region Constructor
  /**
   * Initialize the validator with data.
   * @param {any} data - The data to be validated.
   */
  constructor(data) {
    this.#data = data;
  }
  #endregion

  #region Properties
  /**
   * Get the data to be validated.
   * @returns {any} The data.
   */
  get data() {
    return this.#data;
  }
  #endregion

  #region Methods
  /**
   * Validate the data.
   * @throws {Error} If the data is invalid.
   */
  validate() {
    throw new Error("Subclasses must implement this method");
  }

  /**
   * Check if the data is valid.
   * @returns {boolean} True if the data is valid, False otherwise.
   */
  isValid() {
    try {
      this.validate();
      return true;
    } catch (error) {
      return false;
    }
  }
  #endregion
}

/**
 * Example validator.
 */
class ExampleValidator extends Validator {
  /**
   * Validate the data.
   * @throws {Error} If the data is invalid.
   */
  validate() {
    if (typeof this.data !== "string") {
      throw new Error("Data must be a string");
    }
  }
}

// Create a validator and validate some data
const validator = new ExampleValidator("Hello, World!");
console.log(validator.isValid()); // Output: true