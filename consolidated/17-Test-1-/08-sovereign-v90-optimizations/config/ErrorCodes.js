/**
 * @fileoverview Centralized error code directory for the entire application.
 * This standardizes machine-readable error identifiers (codes) and associated defaults,
 * aiding integration with logging systems and API error mapping middleware.
 */

// Error code categories
const ERROR_CATEGORIES = {
    SYSTEM: 'SYS',
    AUDIT: 'AUD',
    AUTH: 'AUTH',
    DATA: 'DATA'
};

// Error code definitions with structured categories
const ERROR_CODES = Object.freeze({
    // System / General
    SYSTEM_UNKNOWN: `${ERROR_CATEGORIES.SYSTEM}_0000`,
    
    // Auditor / Validation Failures (typically 400 series)
    AUDIT_GENERIC: `${ERROR_CATEGORIES.AUDIT}_4000`,
    AUDIT_REQUIRED_FIELD: `${ERROR_CATEGORIES.AUDIT}_4001`,
    AUDIT_CONSTRAINT_VIOLATION: `${ERROR_CATEGORIES.AUDIT}_4002`,
    AUDIT_TYPE_MISMATCH: `${ERROR_CATEGORIES.AUDIT}_4003`,
    
    // Authentication / Authorization Failures (401/403 series)
    AUTH_UNAUTHORIZED: `${ERROR_CATEGORIES.AUTH}_4010`,
    AUTH_PERMISSION_DENIED: `${ERROR_CATEGORIES.AUTH}_4030`,
    
    // Data / Resource Failures (404/500 series)
    DATA_RESOURCE_NOT_FOUND: `${ERROR_CATEGORIES.DATA}_4040`,
    DATA_DATABASE_ERROR: `${ERROR_CATEGORIES.DATA}_5001`
});

/**
 * Safely retrieves an error code by key, falling back to SYSTEM_UNKNOWN if not found.
 * @param {string} key - The error code key (e.g., 'AUDIT_GENERIC')
 * @returns {string} The corresponding error code or SYSTEM_UNKNOWN if not found
 */
const getErrorCode = (key) => ERROR_CODES[key] ?? ERROR_CODES.SYSTEM_UNKNOWN;

/**
 * Standardized registry interface for accessing machine-readable error codes.
 * Provides safe lookup utilities and access to the immutable code enumeration.
 */
export const ErrorCodeRegistry = Object.freeze({
    /** The immutable map of all defined error codes. */
    Codes: ERROR_CODES,
    
    /**
     * Retrieves a standardized error code by key.
     * @param {string} key - The error code key (e.g., 'AUDIT_GENERIC')
     * @returns {string} The corresponding error code
     */
    get: getErrorCode
});
