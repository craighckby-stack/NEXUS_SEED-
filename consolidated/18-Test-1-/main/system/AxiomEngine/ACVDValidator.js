import { ACVDSchema, validateACVDStructure } from '../../config/ACVDSchema.js';
import { ZodError } from 'zod'; 

/**
 * ACVDValidator
 * Responsible for validating, caching, and serving the currently active 
 * Axiomatic Constraint Vector Definition (ACVD) during runtime execution.
 * This utility decouples schema definition from runtime governance enforcement.
 */
export class ACVDValidator {
    constructor() {
        /** @type {ACVDSchema._output | null} */
        this.activeACVD = null;
        this.validationCache = new Map(); // Cache results keyed by signature/hash
    }

    /**
     * Attempts to load and validate a new ACVD definition.
     * Implements version validation (must be strictly increasing).
     * @param {object} candidateACVD - The raw ACVD object.
     * @returns {typeof ACVDSchema._output} The validated ACVD object.
     * @throws {ZodError | Error}
     */
    loadAndValidate(candidateACVD) {
        const signature = candidateACVD?.metadata?.hashSignature;

        if (signature && this.validationCache.has(signature)) {
            // High-efficiency check
            console.log(`ACVD signature ${signature} found in cache. Skipping validation.`);
            this.activeACVD = this.validationCache.get(signature);
            return this.activeACVD;
        }

        try {
            const validated = validateACVDStructure(candidateACVD);
            
            if (this.activeACVD && validated.metadata.version <= this.activeACVD.metadata.version) {
                throw new Error(`ACVD version conflict. Candidate v${validated.metadata.version} must be greater than active v${this.activeACVD.metadata.version}.`);
            }

            this.activeACVD = validated;
            if (signature) {
                this.validationCache.set(signature, validated);
            }
            console.log(`[AxiomEngine] Successfully loaded ACVD v${validated.metadata.version}. Constraints: ${validated.constraints.length}`);
            return validated;
        } catch (error) {
            if (error instanceof ZodError) {
                console.error("Critical ACVD validation error:", error.issues);
                throw new Error("Failed to parse ACVD structure due to strict schema violation.");
            }
            throw error;
        }
    }

    /**
     * Retrieves the currently active and validated ACVD.
     * @returns {typeof ACVDSchema._output}
     */
    getActiveACVD() {
        if (!this.activeACVD) {
            // In a Sovereign AGI, failing to load an ACVD is a catastrophic error.
            throw new Error("CORE_CONSTRAINT_FAULT: No active ACVD loaded. System requires bootstrap.");
        }
        return this.activeACVD;
    }
}

// Export singleton instance for systemwide access
export const ACVD_Validator = new ACVDValidator();
