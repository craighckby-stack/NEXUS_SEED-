/**
 * ParameterAuditor v3.0.1 (Sovereign AGI Refactor)
 * Strictly enforces immutable scalar definitions loaded from SPDM.json using 
 * the ScalarConstraintValidator plugin.
 * Validates types, ranges, and P-01 viability integrity upon initialization.
 */

import SPDM_CONFIG from '../config/SPDM.json';
import { AuditorError } from '../errors/AuditorError.js';
// import SystemCryptoService from '../services/SystemCryptoService.js'; // Proposed Integration

// Mock interface for the extracted plugin (assuming AGI-KERNEL handles injection)
declare class ScalarConstraintValidator {
    static execute(args: { key: string, value: any, type: string, range: [number, number] | null }): boolean;
}

class ParameterAuditor {
    #parameters = new Map<string, any>();
    #checksum: string;

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
    #calculateManifestChecksum(data: string): string {
        // Must be replaced with SystemCryptoService.hash(data, 'SHA3-512')
        return '0xIMMU_HASH_V95_SECURE_TOKEN'; 
    }

    /**
     * Executes schema validation and initial constraint enforcement in a single pass.
     * Populates the internal #parameters Map only with fully validated definitions.
     */
    #processAndValidateManifest(): void {
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
                // Pass the definition directly (param) to enforceConstraint for optimization
                this.enforceConstraint(key, param.value, true, param); 
                
                // If validation passes, store the definition in the optimized internal Map.
                this.#parameters.set(key, param);
            } catch (e) {
                // If initial value violates its own constraints, fail fast.
                // enforceConstraint wraps plugin errors into AuditorError.
                if (e instanceof AuditorError) {
                    throw new AuditorError(`Initialization failure for ${key}: ${e.message}`, 'AUDIT_INITIALIZATION_FAILED');
                }
                throw e;
            }
        }
    }

    /**
     * Retrieves the strictly validated, immutable value for a defined parameter.
     * @param {string} key - The ID of the scalar parameter.
     * @returns {*} The immutable scalar value.
     */
    getValue(key: string): any {
        const param = this.#parameters.get(key);
        if (!param) {
            throw new AuditorError(`Access attempt for unknown immutable parameter: ${key}`, 'AUDIT_UNKNOWN_KEY');
        }
        return param.value;
    }

    /**
     * Runtime check: ensures a proposed variable value adheres to the SPDM constraints.
     * Delegates type and range checking to the ScalarConstraintValidator plugin.
     * @param {string} key - The ID of the scalar parameter.
     * @param {*} proposedValue - The value being tested.
     * @param {boolean} [isInitializationCheck=false] - Flag to suppress runtime warnings during internal setup.
     * @param {object} [param=null] - Optional pre-fetched parameter definition for optimization.
     * @throws {AuditorError} If constraints are violated.
     */
    enforceConstraint(key: string, proposedValue: any, isInitializationCheck: boolean = false, param: any = null): true {
        // Use pre-fetched param if available, otherwise look it up via the optimized Map
        const definition = param || this.#parameters.get(key);

        if (!definition) {
            throw new AuditorError(`Attempted to enforce constraint on unknown immutable parameter: ${key}`, 'AUDIT_UNKNOWN_KEY');
        }

        // Delegate Type and Range checking to the plugin
        try {
            (ScalarConstraintValidator as any).execute({
                key: key,
                value: proposedValue,
                type: definition.type,
                range: definition.range
            });
        } catch (e) {
            // Check for specific error code thrown by the vanilla JS plugin
            const errorCode = (e as any).code;

            if (errorCode === 'AUDIT_RANGE_VIOLATION' && !isInitializationCheck) {
                // P-01 Viability Integrity Check: Warn on runtime range violation
                console.warn(`[P-01 VIOLATION ALERT] Runtime constraint failure: ${e.message}`);
            }

            // Wrap the error into the specific AuditorError type expected by consumers
            if (errorCode) {
                throw new AuditorError(e.message, errorCode);
            }
            
            // Re-throw if it's an unexpected error type
            throw e;
        }
        
        return true;
    }
}

// Export the singleton instance
export default new ParameterAuditor();