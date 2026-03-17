/**
 * ASDM_SchemaValidator V2.0
 * Autonomous utility module for validating artifacts against the ASDM schemas.
 * Ensures cryptographic commitments comply with current versioned formats.
 * Refactored for pre-compiled efficiency.
 */

import ASDM_Schemas from '../../config/ASDM_ArtifactSchemas.json';
import Ajv from 'ajv';
import ajvFormats from 'ajv-formats';

// --- 1. AJV Initialization ---
const ajv = new Ajv({
    allErrors: true,
    coerceTypes: true, // Useful for robust data handling
    useDefaults: true  // Allows schemas to inject default values
});
ajvFormats(ajv);

// --- 2. Custom Format Registration ---
ajv.addFormat('hash_256+', (data) => typeof data === 'string' && data.length >= 64 && /^[0-9a-fA-F]+$/.test(data));
ajv.addFormat('epoch_milliseconds', (data) => Number.isInteger(data) && data > 1609459200000);
ajv.addFormat('ASDM_ID', (data) => typeof data === 'string' && data.length > 10);

// --- 3. Schema Pre-compilation ---
const CompiledValidators = {};

/**
 * Pre-compiles all schemas loaded from ASDM_ArtifactSchemas.json for maximum validation performance.
 */
function initializeValidators() {
    const schemaKeys = Object.keys(ASDM_Schemas.schemas);
    
    if (schemaKeys.length === 0) {
        console.warn("ASDM Validator V2.0: No schemas found in ASDM_ArtifactSchemas.json.");
        return;
    }

    for (const key of schemaKeys) {
        try {
            const schema = ASDM_Schemas.schemas[key];
            CompiledValidators[key] = ajv.compile(schema);
        } catch (e) {
            // Critical warning: A structural issue in the schema prevents compilation.
            console.error(`ASDM Validator Initialization Failure: Schema '${key}' failed to compile. This artifact type cannot be validated.`, e.message);
            // Do not throw, allow the system to proceed if other schemas are valid.
        }
    }
}

// Execute initialization immediately upon module load
initializeValidators();

export const ASDM_SchemaValidator = {
    /**
     * Validates a given data object against a specified ASDM schema key.
     * @param {string} schemaKey - The key corresponding to the desired schema.
     * @param {object} data - The artifact object to validate. Note: This object may be mutated if schema uses 'useDefaults: true'.
     * @returns {{isValid: boolean, errors: Array<object>|null}}
     */
    validateArtifact(schemaKey, data) {
        const validate = CompiledValidators[schemaKey];

        if (!validate) {
            if (ASDM_Schemas.schemas[schemaKey]) {
                // Schema exists but failed compilation earlier (logged during initialization)
                return { isValid: false, errors: [{ keyword: "initialization", message: `Validator failed initialization for schema key: ${schemaKey}` }] };
            } else {
                // Schema key is completely unknown
                throw new Error(`Schema key not found or unsupported: ${schemaKey}`);
            }
        }

        const isValid = validate(data);

        return {
            isValid: isValid,
            errors: validate.errors
        };
    }
};
