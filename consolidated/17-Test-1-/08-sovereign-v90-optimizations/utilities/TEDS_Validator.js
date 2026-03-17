import { SchemaValidationEngineTool } from '@plugins/SchemaValidationEngineTool';
import { CanonicalSerializationUtility } from '@plugins/CanonicalSerializationUtility';
import { SchemaErrorFormatterTool } from '@plugins/SchemaErrorFormatterTool';

// NOTE: Schema path assumed to be relative to module root
const TEDS_Schema = require('../config/TEDS_Schema.json');

// Initialize Tools (assuming dependency injection handles instantiation)
const validationEngine = new SchemaValidationEngineTool();
const canonicalizer = new CanonicalSerializationUtility();
const errorFormatter = new SchemaErrorFormatterTool();

/**
 * Validates a TEDS artifact against the structural schema.
 * @param {object} tedsData The TEDS payload to validate.
 * @returns {boolean|string[]} True if valid, or array of errors (formatted).
 */
function validateTEDS(tedsData) {
  // Assume validationEngine handles schema compilation and validation (using Ajv or similar behind the scenes)
  const validationResult = validationEngine.validate(tedsData, TEDS_Schema);

  if (!validationResult.valid) {
    // Use the error formatter to get the desired output format: 
    // "${err.dataPath}: ${err.message}"
    // Assuming SchemaErrorFormatterTool exposes a standard Ajv error formatting function.
    return errorFormatter.formatErrors(validationResult.errors, { format: '{dataPath}: {message}' });
  }
  return true;
}

/**
 * Canonicalizes the TEDS artifact structure prior to cryptographic signing.
 * The original implementation used a shallow sort which is non-robust. We replace it with 
 * the CanonicalSerializationUtility to ensure deep, strict, and reproducible serialization 
 * required for cryptographic integrity checks.
 * @param {object} tedsData The TEDS payload.
 * @returns {string} The canonicalized string representation for hashing.
 */
function canonicalize(tedsData) {
    // Use the robust utility for cryptographic canonicalization (e.g., RFC 8785 compliant serialization)
    return canonicalizer.serialize(tedsData, { standard: 'strict_json' }); 
}

module.exports = {
  validateTEDS,
  canonicalize
};
