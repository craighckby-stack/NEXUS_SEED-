/**
 * ASDM_SchemaValidator V2.1 - Optimized for Pre-compiled Efficiency
 * Autonomous utility module for validating artifacts against the ASDM schemas.
 * Maximizes performance via module-load schema compilation.
 */

import ASDM_Schemas from '../../config/ASDM_ArtifactSchemas.json';
import Ajv from 'ajv';
import ajvFormats from 'ajv-formats';

// --- 1. AJV Setup & Configuration ---
// Retain options (allErrors, coerceTypes, useDefaults) for robust functionality,
// accepting the minor performance overhead they impose.
const ajv = new Ajv({
    allErrors: true,
    coerceTypes: true,
    useDefaults: true
});
ajvFormats(ajv);

// --- 2. Custom Format Registration (Optimized Checks) ---
const EPOCH_START_THRESHOLD = 1609459200000; // Jan 1, 2021

// Strict regex for 64+ hex characters. Using {64,} limits backtracking.
ajv.addFormat('hash_256+', (data) => 
    typeof data === 'string' && data.length >= 64 && /^[0-9a-f]{64,}$/i.test(data)
);

// Direct integer check against a fixed threshold.
ajv.addFormat('epoch_milliseconds', (data) => 
    Number.isInteger(data) && data > EPOCH_START_THRESHOLD
);

// Minimal string length check.
ajv.addFormat('ASDM_ID', (data) => typeof data === 'string' && data.length > 10);

// --- 3. Schema Pre-compilation (Recursive Abstraction via IIFE) ---
/**
 * Uses an Immediately Invoked Function Expression (IIFE) to encapsulate and execute
 * the expensive compilation step synchronously upon module load.
 */
const CompiledValidators = (() => {
    const validators = {};
    const schemas = ASDM_Schemas?.schemas || {};
    const schemaEntries = Object.entries(schemas);

    if (schemaEntries.length === 0) {
        console.warn("ASDM Validator V2.1: No schemas found.");
        return validators;
    }

    for (const [key, schema] of schemaEntries) {
        try {
            validators[key] = ajv.compile(schema);
        } catch (e) {
            console.error(`ASDM Initialization Failure: Schema '${key}' failed to compile. Error:`, e.message);
        }
    }
    return validators;
})();

// --- 4. Exported Validation Interface ---
export const ASDM_SchemaValidator = {
    /**
     * Validates a given data object against a specified ASDM schema key.
     * Complexity: O(1) runtime lookup for the pre-compiled validator function.
     * 
     * @param {string} schemaKey - The key corresponding to the desired schema.
     * @param {object} data - The artifact object to validate.
     * @returns {{isValid: boolean, errors: Array<object>|null}}
     */
    validateArtifact(schemaKey, data) {
        const validate = CompiledValidators[schemaKey];

        if (!validate) {
            // Check if the key existed but failed initialization (logged previously)
            if (ASDM_Schemas.schemas && ASDM_Schemas.schemas[schemaKey]) {
                const msg = `Validator failed initialization for schema key: ${schemaKey}`;
                return { isValid: false, errors: [{ keyword: "initialization", message: msg }] };
            }
            // Key is entirely unknown
            throw new Error(`Schema key not found or unsupported: ${schemaKey}`);
        }

        // The execution of 'validate(data)' is the core computational step, 
        // already optimized by AJV's pre-compilation.
        const isValid = validate(data);

        return {
            isValid: isValid,
            // Use null for errors if valid, avoiding unnecessary array creation.
            errors: isValid ? null : validate.errors
        };
    }
};