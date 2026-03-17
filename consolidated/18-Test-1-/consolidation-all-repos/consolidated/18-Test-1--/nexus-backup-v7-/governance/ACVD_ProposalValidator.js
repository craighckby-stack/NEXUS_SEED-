import Ajv from 'ajv';
import acvdSchema from './ACVD_schema.json';
import logger from '../utility/logger.js';

const ajv = new Ajv();
const validate = ajv.compile(acvdSchema);

/**
 * Validates an AGI-generated code evolution proposal against the ACVD governance schema.
 * @param {object} proposal - The proposed change object.
 * @returns {{isValid: boolean, errors: array}}
 */
export function validateProposal(proposal) {
    const isValid = validate(proposal);
    if (!isValid) {
        logger.error('ACVD Proposal Validation Failed', validate.errors);
        return {
            isValid: false,
            errors: validate.errors
        };
    }
    logger.info(`ACVD Proposal ${proposal.proposalId} validated successfully.`);
    return {
        isValid: true,
        errors: null
    };
}

// Example usage for internal testing/debugging
if (process.env.NODE_ENV === 'development') {
    console.log('ACVD Validator initialized.');
}