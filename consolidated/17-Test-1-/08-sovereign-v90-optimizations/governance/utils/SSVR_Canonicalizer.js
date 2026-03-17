import { CanonicalSerializationUtility } from '@@/plugin/CanonicalSerializationUtility';
import { DocumentIntegrityHashUtility } from '@@/plugin/DocumentIntegrityHashUtility';

/**
 * SSVR Canonicalizer Implementation
 * Handles deterministic serialization and integrity hash computation for SSVR documents.
 */
class SSVRCanonicalizerImpl {
    // Configuration constants defined as private static fields
    static #HASH_ALGORITHM = 'SHA-384';
    static #SSVR_EXCLUSION_FIELDS = ['integrity_hash', 'attestation_log'];

    // Dependencies stored as private fields
    #canonicalizationUtility;
    #integrityHashUtility;

    constructor() {
        this.#setupDependencies();
    }

    /**
     * Extracts synchronous dependency resolution and initialization.
     */
    #setupDependencies() {
        // Assign imported dependencies (synchronous initialization)
        this.#canonicalizationUtility = CanonicalSerializationUtility;
        this.#integrityHashUtility = DocumentIntegrityHashUtility;
        
        if (!this.#canonicalizationUtility || !this.#integrityHashUtility) {
             this.#throwDependencyError('Core serialization/hashing utilities missing.');
        }
    }
    
    // I/O Proxy: Error Handling
    #throwDependencyError(message) {
        throw new Error(`[SSVR_CANON_SETUP] ${message}`);
    }

    // I/O Proxy: Delegate to CanonicalSerializationUtility execution
    #delegateToSerializationExecution(ssvrData) {
        // CanonicalSerializationUtility.execute({ data: ssvrData })
        return this.#canonicalizationUtility.execute({ data: ssvrData });
    }

    // I/O Proxy: Delegate to DocumentIntegrityHashUtility execution
    #delegateToIntegrityHashExecution(ssvrData) {
        // DocumentIntegrityHashUtility.hash({...})
        return this.#integrityHashUtility.hash({
            data: ssvrData,
            excludeFields: SSVRCanonicalizerImpl.#SSVR_EXCLUSION_FIELDS,
            hashAlgorithm: SSVRCanonicalizerImpl.#HASH_ALGORITHM
        });
    }

    // Core Logic Implementation for `canonicalize`
    canonicalize(ssvrData) {
        return this.#delegateToSerializationExecution(ssvrData);
    }

    // Core Logic Implementation for `calculateIntegrityHash`
    calculateIntegrityHash(ssvrData) {
        return this.#delegateToIntegrityHashExecution(ssvrData);
    }
}

const ssvrCanonicalizerInstance = new SSVRCanonicalizerImpl();

/**
 * SSVR Canonicalizer Module
 * Ensures all key/value pairs within the JSON structure are sorted alphabetically
 * and serialized according to the SSVR strict canonical JSON format.
 * 
 * @param {object} ssvrData - The SSVR object ready for finalization.
 * @returns {string} - Canonicalized JSON string suitable for cryptographic hashing.
 */
export function canonicalize(ssvrData: object): string {
    return ssvrCanonicalizerInstance.canonicalize(ssvrData);
}

/**
 * Calculates the integrity_hash (SHA-384) for the SSVR data.
 * Note: This function must exclude the existing `integrity_hash` and `attestation_log` fields during computation.
 * 
 * @param {object} ssvrData - The SSVR object.
 * @returns {string} - The SHA-384 hash.
 */
export function calculateIntegrityHash(ssvrData: object): string {
    return ssvrCanonicalizerInstance.calculateIntegrityHash(ssvrData);
}