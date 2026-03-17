const { getProposalValidator } = require('../config/proposalSchemaFactory');
const { formatValidationError } = require('./formatValidationError');

// The validator is pre-compiled using the factory pattern for maximum efficiency.
// It is stored in closure scope for fast access across module imports.
const proposalValidator = getProposalValidator();

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
    if (typeof proposalData !== 'object' || proposalData === null) {
        // Fail fast for invalid primary data type input, using a standardized error format.
        return { 
            isValid: false, 
            errors: [{
                path: '/', 
                message: 'Proposal data must be a valid, non-null JavaScript object.',
                keyword: 'type',
                params: { type: 'object' }
            }], 
            canonicalData: null 
        };
    }
    
    // 1. Enforce immutability and allow defaults/coercion by shallow cloning.
    const dataToProcess = { ...proposalData }; 
    
    // 2. Execute validation. Ajv mutates dataToProcess if useDefaults is true.
    const isValid = proposalValidator(dataToProcess);
    
    if (!isValid) {
        // 3. Use dedicated error formatter.
        const errors = formatValidationError(proposalValidator.errors);
        return { isValid: false, errors, canonicalData: null };
    }

    // 4. Return processed, canonical data.
    return { 
        isValid: true, 
        errors: [], 
        canonicalData: dataToProcess 
    };
}

module.exports = { validateProposal };
