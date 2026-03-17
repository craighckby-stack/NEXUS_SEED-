import { ACVD_SCHEMA } from './ACVD_schema.json';
import Ajv, { ErrorObject, ValidateFunction } from 'ajv';
import { ALGORITHM, canonicalStringify } from '../config/crypto_standards';
import { IntegrityHasher, CryptoHashUtility } from './utilities/IntegrityHasher';

// --- Types ---
export interface ACVDRecord {
    ACVD_ID: string;
    context_hash: string;
    [key: string]: any; 
}

export interface ValidationResult {
    isValid: boolean;
    errors: { message: string; details?: any }[] | null;
}

/**
 * Encapsulated class responsible for ACVD structural and integrity validation.
 * Ensures strict separation between core orchestration logic and external dependency execution (I/O proxies).
 */
class ACVDValidator {
    #hasher: IntegrityHasher;
    #validateSchema: ValidateFunction<ACVDRecord>;

    constructor(hasher: IntegrityHasher, schema: object) {
        this.#setupDependencies(hasher, schema);
    }

    /**
     * Goal: Extract synchronous dependency resolution and initialization logic.
     */
    #setupDependencies(hasher: IntegrityHasher, schema: object): void {
        // Initialize AJV and compile schema
        const ajv = new Ajv({ allErrors: true, useDefaults: true });
        this.#validateSchema = ajv.compile(schema);
        
        // Set external dependency
        this.#hasher = hasher;
    }

    /**
     * Goal: I/O Proxy for executing Ajv schema validation.
     */
    #delegateToValidationExecution(record: ACVDRecord): boolean {
        return this.#validateSchema(record) as boolean;
    }

    /**
     * Goal: I/O Proxy for retrieving Ajv validation errors.
     */
    #delegateToGetValidationErrors(): ErrorObject[] | null {
        // Ajv validation errors are exposed directly on the function object after execution.
        return this.#validateSchema.errors;
    }

    /**
     * Goal: I/O Proxy for creating integrity hashes using the configured service.
     */
    #delegateToHashCreation(data: unknown): string {
        return this.#hasher.createIntegrityHash(data);
    }

    /**
     * Orchestrates ACVD record validation, including structural checks and cryptographic integrity verification.
     */
    public validate(record: ACVDRecord, inputContext: string): ValidationResult {
        const errors: { message: string; details?: any }[] = [];

        // 1. Structural Validation
        const isValidStructure = this.#delegateToValidationExecution(record);
        if (!isValidStructure) {
            const validationErrors = this.#delegateToGetValidationErrors();
            if (validationErrors) {
                errors.push({
                    message: 'ACVD structure failed validation against canonical schema.',
                    details: validationErrors
                });
            }
        }

        // 2. Context Hash Integrity Check
        const computedContextHash = this.#delegateToHashCreation(inputContext);
        if (computedContextHash !== record.context_hash) {
            errors.push({
                message: `Context hash mismatch. Input context appears tampered or incorrectly hashed.`,
                details: { expected: computedContextHash, found: record.context_hash, check: 'context_hash' }
            });
        }

        // 3. ACVD_ID Calculation Check
        // Safely exclude ACVD_ID for content hashing.
        const { ACVD_ID, ...recordForHashing } = record;
        
        // Hash the rest of the record using canonical stringification
        const expectedACVDId = this.#delegateToHashCreation(recordForHashing);

        if (expectedACVDId !== ACVD_ID) {
            errors.push({
                message: `ACVD_ID integrity check failed. The record content hash does not match the stored ID.`,
                details: { expected: expectedACVDId, found: ACVD_ID, check: 'ACVD_ID' }
            });
        }
        
        if (errors.length > 0) {
            return { isValid: false, errors };
        }

        return { isValid: true, errors: null };
    }
}

// Initialize private singleton instance
const validatorInstance = new ACVDValidator(
    new CryptoHashUtility(ALGORITHM, canonicalStringify),
    ACVD_SCHEMA
);

/**
 * Public entry point for ACVD validation.
 * @param record The ACVD object to validate.
 * @param inputContext The actual system context snapshot used to generate the context_hash.
 * @returns Validation results.
 */
export function validateACVD(record: ACVDRecord, inputContext: string): ValidationResult {
    return validatorInstance.validate(record, inputContext);
}