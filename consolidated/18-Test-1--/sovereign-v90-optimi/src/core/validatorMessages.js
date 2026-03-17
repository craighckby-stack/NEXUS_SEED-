import { AbstractKernel } from '../kernel/AbstractKernel';

/**
 * Standardized error messages for common validation rules.
 * Functions are used to allow dynamic insertion of field names and parameters (e.g., min/max values).
 */
const INTERNAL_VALIDATOR_MESSAGES = Object.freeze({
  required: (field) => `${field} is required.`,
  email: (field) => `${field} must be a valid email address.`,
  numeric: (field) => `${field} must be a numeric value.`,
  integer: (field) => `${field} must be an integer.`,
  min: (field, value) => `${field} must be at least ${value}.`,
  max: (field, value) => `${field} cannot exceed ${value}.`,
  minLength: (field, length) => `${field} must be at least ${length} characters long.`,
  maxLength: (field, length) => `${field} cannot exceed ${length} characters.`,
  url: (field) => `${field} must be a valid URL.`,
  date: (field) => `${field} must be a valid date.`,
  matches: (field, otherField) => `${field} must match the value in ${otherField}.`,
  
  // Fallback message for undefined rules
  default: (field) => `The value provided for ${field} is invalid.`,
});

/**
 * ValidatorMessagesConfigRegistryKernel
 * Provides standardized, immutable configuration for validation error message templates.
 * This replaces the synchronous utility export with an architectural configuration registry.
 */
export class ValidatorMessagesConfigRegistryKernel extends AbstractKernel {
  constructor() {
    super('ValidatorMessagesConfigRegistryKernel');
  }

  /**
   * @inheritdoc
   * No external dependencies are required for static message definitions.
   */
  async #setupDependencies() {
    // Enforces the synchronous setup extraction mandate.
  }

  /**
   * @inheritdoc
   */
  async initialize() {
    await this.#setupDependencies();
    // Message configuration is static, no further async initialization required.
  }

  /**
   * Retrieves the standardized validation message generators.
   * @returns {Promise<Readonly<Record<string, Function>>>} An immutable map of rule names to message generation functions.
   */
  async getMessages() {
    // Configuration access must be asynchronous to maintain architectural consistency,
    // even for static data.
    return Promise.resolve(INTERNAL_VALIDATOR_MESSAGES);
  }
}
