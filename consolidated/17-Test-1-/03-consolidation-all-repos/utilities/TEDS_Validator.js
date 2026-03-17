const Ajv = require('ajv');
const schema = require('../config/TEDS_Schema.json');
const ajv = new Ajv({ allErrors: true, formats: { 'date-time': true } });

const validate = ajv.compile(schema);

/**
 * Validates a TEDS artifact against the structural schema.
 * @param {object} tedsData The TEDS payload to validate.
 * @returns {boolean|string[]} True if valid, or array of errors.
 */
function validateTEDS(tedsData) {
  const valid = validate(tedsData);
  if (!valid) {
    return validate.errors.map(err => {
      return `${err.dataPath}: ${err.message}`;
    });
  }
  return true;
}

/**
 * Canonicalizes the TEDS artifact structure prior to cryptographic signing.
 * NOTE: Canonicalization logic must exactly match the CRoT implementation.
 * @param {object} tedsData The TEDS payload.
 * @returns {string} The canonicalized string representation for hashing.
 */
function canonicalize(tedsData) {
    // Standard practice uses RFC 8785, or a strict sorted JSON stringify.
    return JSON.stringify(tedsData, Object.keys(tedsData).sort()); 
}

module.exports = {
  validateTEDS,
  canonicalize
};