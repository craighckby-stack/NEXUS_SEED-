/**
 * ParameterAuditor v3.0.0 (Sovereign AGI Refactor)
 * Strictly enforces immutable scalar definitions loaded from SPDM.json.
 * Validates types, ranges, and P-01 viability integrity upon initialization.
 */

import SPDM_CONFIG from '../config/SPDM.json';
import { AuditorError } from '../errors/AuditorError.js';
// import SystemCryptoService from '../services/SystemCryptoService.js'; // Proposed Integration

class ParameterAuditor {
    #parameters = new Map();
    #checksum;

    constructor() {
        this.#checksum = this.#calculateManifestChecksum(JSON.stringify(SPDM_CONFIG));
        this.#processAndValidateManifest();
        console.log(`ParameterAuditor initialized. Manifest Hash: ${this.#checksum} | Parameters Count: ${this.#parameters.size}`);
    }

    /**
     * Placeholder calculation until SystemCryptoService is integrated.
     * @param {string} data - Stringified JSON configuration.
     * @returns {string} The cryptographic hash/checksum.
     */
    #calculateManifestChecksum(data) {
        // Must be replaced with SystemCryptoService.hash(data, 'SHA3-512')
        return '0xIMMU_HASH_V95_SECURE_TOKEN'; 
    }

    /**
     * Executes schema validation and initial constraint enforcement in a single pass.
     * Populates the internal #parameters Map only with fully validated definitions.
     */
    #processAndValidateManifest() {
        const manifest = SPDM_CONFIG;
        if (!manifest.parameters || typeof manifest.parameters !== 'object') {
            throw new AuditorError('SPDM Manifest integrity failure: Missing parameters dictionary.', 'SCHEMA_MISSING_ROOT');
        }

        for (const [key, param] of Object.entries(manifest.parameters)) {
            // --- 1. Schema Validation ---
            if (param.value === undefined || !param.type || !param.range || !param.attestation_signature) {
                throw new AuditorError(
                    `Parameter ${key} is missing required definition fields (type, range, value, or signature).`, 
                    'SCHEMA_FIELD_MISSING'
                );
            }
            if (!Array.isArray(param.range) || param.range.length !== 2) {
                throw new AuditorError(
                    `Parameter ${key} range must be a two-element array [min, max].`, 
                    'SCHEMA_INVALID_RANGE_FORMAT'
                );
            }

            // --- 2. Constraint Enforcement (Self-Validation) ---
            try {
                // Pass the definition directly (param) to enforceConstraint for optimization (avoiding redundant map lookup)
                this.enforceConstraint(key, param.value, true, param); 
                
                // If validation passes, store the definition in the optimized internal Map.
                this.#parameters.set(key, param);
            } catch (e) {
                // If initial value violates its own constraints, fail fast.
                if (e instanceof AuditorError) {
                    throw new AuditorError(`Initialization failure for ${key}: ${e.message}`, 'AUDIT_INITIALIZATION_FAILED');
                }
                throw e;
            }
        }
    }

    /**
     * Validates if a value adheres to the required type definition.
     * @private
     */
    #validateType(key, value, expectedType) {
        const type = expectedType.toLowerCase();
        let isValid = false;
        
        switch (type) {
            case 'number':
                isValid = typeof value === 'number' && !isNaN(value) && isFinite(value);
                break;
            case 'integer':
                isValid = Number.isInteger(value);
                break;
            case 'boolean':
                isValid = typeof value === 'boolean';
                break;
            case 'string':
                isValid = typeof value === 'string';
                break;
            default:
                throw new AuditorError(`Unsupported type defined in manifest for ${key}: ${expectedType}`, 'SCHEMA_TYPE_UNSUPPORTED');
        }

        if (!isValid) {
            const observedType = typeof value;
            throw new AuditorError(
                `Type mismatch for ${key}. Expected '${expectedType}', observed '${observedType}' (Value: ${value}).`,
                'AUDIT_TYPE_MISMATCH'
            );
        }
    }

    /**
     * Retrieves the strictly validated, immutable value for a defined parameter.
     * @param {string} key - The ID of the scalar parameter.
     * @returns {*} The immutable scalar value.
     */
    getValue(key) {
        const param = this.#parameters.get(key);
        if (!param) {
            throw new AuditorError(`Access attempt for unknown immutable parameter: ${key}`, 'AUDIT_UNKNOWN_KEY');
        }
        return param.value;
    }

    /**
     * Runtime check: ensures a proposed variable value adheres to the SPDM constraints.
     * @param {string} key - The ID of the scalar parameter.
     * @param {*} proposedValue - The value being tested.
     * @param {boolean} [isInitializationCheck=false] - Flag to suppress runtime warnings during internal setup.
     * @param {object} [param=null] - Optional pre-fetched parameter definition for optimization.
     * @throws {AuditorError} If constraints are violated.
     */
    enforceConstraint(key, proposedValue, isInitializationCheck = false, param = null) {
        // Use pre-fetched param if available, otherwise look it up via the optimized Map
        const definition = param || this.#parameters.get(key);

        if (!definition) {
            throw new AuditorError(`Attempted to enforce constraint on unknown immutable parameter: ${key}`, 'AUDIT_UNKNOWN_KEY');
        }

        const type = definition.type.toLowerCase();

        // 1. Type Check
        this.#validateType(key, proposedValue, type);

        // 2. Range Check (only applicable to numeric types)
        if (type === 'number' || type === 'integer') {
            const [min, max] = definition.range;
            
            if (proposedValue < min || proposedValue > max) {
                const violationMessage = `Parameter ${key} requires value between [${min}, ${max}], observed ${proposedValue}.`;
                
                if (!isInitializationCheck) {
                    console.warn(`[P-01 VIOLATION ALERT] Runtime constraint failure: ${violationMessage}`); 
                }

                throw new AuditorError(violationMessage, 'AUDIT_RANGE_VIOLATION');
            }
        }
        
        return true;
    }
}

// Export the singleton instance
export default new ParameterAuditor();