const Ajv = require('ajv');
const GSC_SST_Schema = require('../GSC_SST_Proposal_Schema.json');

/**
 * Initializes and returns a compiled Ajv validator instance for proposals.
 * This centralizes configuration necessary for high-integrity validation.
 * @returns {function} A compiled validation function (Ajv validator).
 */
function getProposalValidator() {
    const ajv = new Ajv({
        allErrors: true, 
        coerceTypes: true,
        useDefaults: true, 
        removeAdditional: true, // Prevents injection of unnecessary or malicious fields
        strict: 'log',         // Logs warnings about potential schema issues (e.g., unknown formats)
        verbose: true          // Aids in detailed error reporting during debugging
    });

    // FUTURE IMPROVEMENT: Use this location to register custom validation keywords 
    // based on real-time chain state or external governance data.

    const validate = ajv.compile(GSC_SST_Schema);

    return validate;
}

module.exports = { getProposalValidator };