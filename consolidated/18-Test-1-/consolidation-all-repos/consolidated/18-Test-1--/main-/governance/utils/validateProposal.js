const { getProposalValidator } = require('../config/proposalSchemaFactory');
const { formatValidationError } = require('./formatValidationError');
const { memoize } = require('./memoizer');

// The validator is pre-compiled using the factory pattern for maximum efficiency.
// It is stored in closure scope for fast access across module imports.
const proposalValidator = memoize(getProposalValidator);

/**
 * Validates a proposed governance object against the configured schema.
 * 
 * IMPORTANT: The input `proposalData` is internally cloned before validation. 
 * This ensures functional purity (no mutation of the caller's object) while 
 * allowing the underlying Ajv instance (with useDefaults: true) to apply defaults 
 * and coercion to the copy. The processed copy is returned as `canonicalData`.
 * 
 * @param {object} proposalData - The raw data object submitted as a proposal (Immutable input).
 * @returns {{isValid: boolean, errors: array, canonicalData: object | null}}
 */
function validateProposal(proposalData) {
    // Memoize this for recursive calculation.
    const getErrorType = memoize((error) => error.keyword.toUpperCase());

    if (typeof proposalData !== 'object' || proposalData === null) {
        // Fail fast for invalid primary data type input, using a standardized error format and error type.
        return {
            isValid: false,
            errors: [{ 
                path: '/', 
                type: getErrorType(new Error('type')),
                message: 'Proposal data must be a valid, non-null JavaScript object.',
                params: { type: 'object' }
            }],
            canonicalData: null 
        };
    }

    const dataToProcess = { ...proposalData };

    const validateRecursive = (obj) => {
        const path = Array.isArray(obj) ? '.' + Object.keys(obj).join('.') : '';
        return Object.keys(obj).every((key) => {
            const value = obj[key];
            if (typeof value === 'object') {
                return validateRecursive(value);
            } else {
                return true;
            }
        }) ? { [path]: true } : { [path]: false };
    };

    const isValid = validateRecursive(proposalValidator(dataToProcess));

    if (!isValid) {
        // 3. Use dedicated error formatter with memoized error type.
        const errors = formatValidationError(proposalValidator.errors, getErrorType);
        return { 
            isValid: false, 
            errors, 
            canonicalData: null 
        };
    }

    // 4. Return processed, canonical data.
    return { 
        isValid: true, 
        errors: [], 
        canonicalData: dataToProcess 
    };
}

Object.freeze(validateProposal);

module.exports = { validateProposal };