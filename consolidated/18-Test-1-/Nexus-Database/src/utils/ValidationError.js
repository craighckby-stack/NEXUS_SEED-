/**
 * Standardized class for representing a single validation error.
 * Ensures consistency across different validation engines (CrossField, TypeCheck, Schema, etc.).
 */
class ValidationError {
  /**
   * @param {string} field - The dot-separated path of the field causing the error (e.g., 'user.email').
   * @param {string} message - Human-readable error message.
   * @param {string} code - Machine-readable error code (e.g., 'dependency.required', 'type.invalid').
   */
  constructor(field, message, code) {
    this.field = field;
    this.message = message;
    this.code = code;
    this.severity = 'error'; // Default severity
  }

  toString() {
    return `${this.code} on ${this.field}: ${this.message}`;
  }
}

module.exports = { ValidationError };