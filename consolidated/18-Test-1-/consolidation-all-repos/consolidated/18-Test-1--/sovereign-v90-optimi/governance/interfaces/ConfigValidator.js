import { AbstractValidator, ValidationError, ValidationResult } from "@/plugins/ValidatorInterface";

/**
 * @fileoverview Defines the abstract interface and standard types for Configuration Validation
 * within the Governance Subsystem (GOV).
 */

// --- Standard Interface Types (Aliased for GOV domain specificity) ---

/**
 * Standard Interface Type: GOV_ValidationError
 * Represents a specific failure point discovered during configuration validation.
 * (Alias for core ValidationError type.)
 */
export type GOV_ValidationError = ValidationError;

/**
 * Standard Interface Type: GOV_ValidationResult
 * The aggregated result of a configuration validation operation.
 * (Alias for core ValidationResult type.)
 */
export type GOV_ValidationResult = ValidationResult;

// --- Abstract Base Interface ---

/**
 * Abstract Base Class: ConfigValidator
 * ID: GOV_IFACE_VLDTR_v2
 * Scope: Standardized, Asynchronous Interface for Configuration Integrity Checks.
 *
 * Purpose: Defines the required contract for all concrete governance configuration validation modules (GRCMs).
 * Extends AbstractValidator to inherit standard validation contract capabilities.
 */
export abstract class ConfigValidator extends AbstractValidator {
    /**
     * Static unique identifier for introspection and registry management. Version bumped to v2
     * to indicate adherence to modern standardized types (GOV_ prefix).
     */
    public static readonly INTERFACE_ID = 'GOV_IFACE_VLDTR_v2';

    constructor() {
        super();
        // Enforce abstract nature specific to the governance interface.
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
     * @param config - The configuration object (e.g., policy update payload) to validate.
     * @returns A promise resolving to a detailed validation result object.
     */
    public abstract validate(config: unknown): Promise<GOV_ValidationResult>;
}

/**
 * Exports the ConfigValidator abstract class and associated standard types.
 */
export {
    GOV_ValidationError as ValidationError,
    GOV_ValidationResult as ValidationResult
};
