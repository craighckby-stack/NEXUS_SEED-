/**
 * Base class for all structured system errors.
 * Allows for standardized logging, error categorization, and metadata attachment.
 */
class SystemError extends Error {
  constructor(message, code = 'SYSTEM_ERROR', metadata = {}) {
    super(message);
    this.name = this.constructor.name; // E.g., 'ConfigValidationError'
    this.code = code;
    this.metadata = metadata;
    
    // Maintain proper stack trace for the error instance
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Specific error type for configuration issues (like failed metric validation).
 */
class ConfigValidationError extends SystemError {
  constructor(message, context = {}) {
    super(message, 'CONFIG_VALIDATION_ERROR', context);
  }
}

module.exports = { SystemError, ConfigValidationError };