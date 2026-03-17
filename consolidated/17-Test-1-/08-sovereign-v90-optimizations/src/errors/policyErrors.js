/**
 * @fileoverview Defines core error classes for policy violations within the AGI-KERNEL.
 */

const { StructuredErrorBase } = require('@kernel/StructuredErrorBase');

/**
 * Base error for all Policy related exceptions. Abstracted from StructuredErrorBase
 * for maximum computational efficiency in stack trace capture and serialization.
 *
 * @augments StructuredErrorBase
 */
class PolicyError extends StructuredErrorBase {
  /**
   * @param {string} [message] - Descriptive error message.
   * @param {object | null} [details] - Additional contextual data.
   * @param {number} [status] - HTTP status code, defaults to 400 (Bad Request).
   */
  constructor(message = 'A generic policy violation occurred.', details = null, status = 400) {
    super(message, status);
    /** @type {Readonly<object | null>} */
    this.details = details ? Object.freeze(details) : null;
    this.name = 'PolicyError';
  }
}

/**
 * Policy violation indicating insufficient access or forbidden action (HTTP 403).
 * This is distinct from authentication failure (401).
 *
 * @augments PolicyError
 */
class AccessDeniedPolicyError extends PolicyError {
  /**
   * @param {string} [message] - Descriptive error message.
   * @param {string} [policyId] - The ID of the policy that denied access.
   */
  constructor(message = 'Access is denied based on current security policies.', policyId) {
    super(message, { policyId }, 403);
    this.name = 'AccessDeniedPolicyError';
  }
}

/**
 * Policy violation indicating required preconditions were not met (HTTP 412).
 *
 * @augments PolicyError
 */
class PreconditionFailedError extends PolicyError {
  /**
   * @param {string} [message] - Descriptive error message.
   * @param {Array<string>} [failingConditions] - List of condition identifiers that failed.
   */
  constructor(message = 'Required state preconditions were not satisfied.', failingConditions) {
    super(message, { failingConditions }, 412);
    this.name = 'PreconditionFailedError';
  }
}

module.exports = {
  PolicyError,
  AccessDeniedPolicyError,
  PreconditionFailedError,
};
