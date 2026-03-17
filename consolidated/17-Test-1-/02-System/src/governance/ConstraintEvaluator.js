/**
 * @module ConstraintEvaluator
 * Provides methods for checking specific data constraints (length, pattern, format, range).
 */

/**
 * Internal Type Definition for a violation object.
 * @typedef {Object} Violation
 * @property {string} code - The violation identifier.
 * @property {string} message - Human-readable error message.
 * @property {string} field - The name of the field that failed validation.
 * @property {string} [pattern] - Optional regex pattern used for violation.
 */

const ConstraintEvaluator = {

    /**
     * Checks string length or array size constraints (minLength, maxLength).
     * @param {string} fieldName 
     * @param {string | Array<any>} value 
     * @param {Object} props - Contains constraints like minLength, maxLength.
     * @returns {Violation | null}
     */
    checkMinMaxLength(fieldName, value, props) {
        if (typeof value !== 'string' && !Array.isArray(value)) {
            return null;
        }
            
        const currentLen = value.length;
        // Use optional chaining for safe access (props?.minLength)
        const minLen = props?.minLength;
        const maxLen = props?.maxLength;

        if (minLen !== undefined && currentLen < minLen) {
            return {
                code: "CONSTRAINT_MIN_LENGTH",
                message: `Length violation: Field '${fieldName}' must be at least ${minLen} characters/items (found ${currentLen}).`,
                field: fieldName
            };
        }
        
        if (maxLen !== undefined && currentLen > maxLen) {
            return {
                code: "CONSTRAINT_MAX_LENGTH",
                message: `Length violation: Field '${fieldName}' must be at most ${maxLen} characters/items (found ${currentLen}).`,
                field: fieldName
            };
        }
        
        return null;
    },

    /**
     * Regex pattern for standard UUID v4.
     */
    UUID_V4_PATTERN: /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i,

    /**
     * Simple regex pattern for email address validation.
     */
    EMAIL_PATTERN: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,


    /**
     * Validates specific predefined formats (e.g., email, uuid, date-time).
     * @param {string} fieldName 
     * @param {string} value 
     * @param {string} fieldFormat 
     * @returns {Violation | null}
     */
    checkFormat(fieldName, value, fieldFormat) {
        if (typeof value !== 'string') {
            return null;
        }
            
        if (fieldFormat === 'uuid') {
            if (!ConstraintEvaluator.UUID_V4_PATTERN.test(value)) {
                return {
                    code: "CONSTRAINT_FORMAT_UUID",
                    message: `Format error: Field '${fieldName}' must be a valid UUID v4 string.`,
                    field: fieldName
                };
            }
                
        } else if (fieldFormat === 'email') {
            if (!ConstraintEvaluator.EMAIL_PATTERN.test(value)) {
                return {
                    code: "CONSTRAINT_FORMAT_EMAIL",
                    message: `Format error: Field '${fieldName}' is not a valid email address.`,
                    field: fieldName
                };
            }
        }
            
        return null;
    },

    /**
     * Validates string against a regex pattern defined in the 'pattern' constraint.
     * @param {string} fieldName 
     * @param {string} value 
     * @param {string} pattern - The regex string to match against.
     * @returns {Violation | null}
     */
    checkPattern(fieldName, value, pattern) {
        if (typeof value !== 'string' || !pattern) {
            return null;
        }
            
        try {
            // Create a RegExp object from the pattern string
            const regex = new RegExp(pattern);
            if (!regex.test(value)) {
                 return {
                    code: "CONSTRAINT_PATTERN_VIOLATION",
                    message: `Pattern mismatch: Field '${fieldName}' failed validation against required regex pattern.`,
                    field: fieldName,
                    pattern: pattern
                };
            }
        } catch (e) {
             // Handle invalid regex definition
             return {
                code: "CONFIG_INVALID_PATTERN",
                message: `Configuration error: Invalid regex pattern provided for field '${fieldName}'. Error: ${e.message}`,
                field: fieldName,
                pattern: pattern
            };
        }
        return null;
    }
};

module.exports = ConstraintEvaluator;
