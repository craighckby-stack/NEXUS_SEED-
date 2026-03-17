/**
 * @fileoverview Defines the abstract interface and standard types for Configuration Validation
 * within the Governance Subsystem (GOV).
 */

// --- Standard Interface Types ---

/**
 * Standard Interface Type: GOV_ValidationError
 * Represents a specific failure point discovered during configuration validation.
 * @typedef {Object} GOV_ValidationError
 * @property {string} ruleId - Identifier of the rule that failed (e.g., 'GRS-001', 'SchemaCheck').
 * @property {string} message - Human-readable, actionable description of the failure.
 * @property {string} [path] - Optional JSON path to the failed configuration element (e.g., 'rules[3].threshold').
 * @property {*} [value] - Optional failing value for detailed debugging.
 */

/**
 * Standard Interface Type: GOV_ValidationResult
 * The aggregated result of a configuration validation operation.
 * @typedef {Object} GOV_ValidationResult
 * @property {boolean} isValid - True if the configuration passed all checks.
 * @property {GOV_ValidationError[]} errors - Array of detailed errors if validation failed (empty array if isValid is true).
 */

// --- Abstract Base Interface ---

/**
 * Abstract Base Class: ConfigValidator
 * ID: GOV_IFACE_VLDTR_v2
 * Scope: Standardized, Asynchronous Interface for Configuration Integrity Checks.
 *
 * Purpose: Defines the required contract for all concrete governance configuration validation modules (GRCMs).
 * Enforces async validation capability.
 */
class ConfigValidator {
    /**
     * Static unique identifier for introspection and registry management. Version bumped to v2
     * to indicate adherence to modern standardized types (GOV_ prefix).
     * @type {string}
     */
    static INTERFACE_ID = 'GOV_IFACE_VLDTR_v2';

    constructor() {
        // Enforce abstract nature
        if (new.target === ConfigValidator) {
            throw new TypeError("Cannot instantiate abstract class ConfigValidator. Use concrete implementations (GRCMs).");
        }
    }

    /**
     * Asynchronously validates the proposed configuration payload against applicable Governance Rule Sets.
     *
     * Rationale: Operation must be asynchronous to accommodate complex checks requiring I/O,
     * state lookups, dependency analysis, or cryptographic state verification.
     *
     * @param {Object} config - The configuration object (e.g., policy update payload) to validate.
     * @returns {Promise<GOV_ValidationResult>} A promise resolving to a detailed validation result object.
     * @abstract
     */
    async validate(config) {
        // Must be implemented by concrete subclasses.
        throw new Error(`Abstract method 'validate(config)' not implemented in ${this.constructor.name}.`);
    }
}

/**
 * Exports the ConfigValidator interface and associated standard types.
 */
module.exports = {
    ConfigValidator,
    // Export standard types for JSDoc/TS consumers
    /** @typedef {GOV_ValidationError} */
    ValidationError: {}, // JSDoc placeholder
    /** @typedef {GOV_ValidationResult} */
    ValidationResult: {}, // JSDoc placeholder
};
