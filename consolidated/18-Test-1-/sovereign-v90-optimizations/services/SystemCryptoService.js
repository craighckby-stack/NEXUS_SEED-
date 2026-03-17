/**
 * SystemCryptoKernel v1.0.0 (Sovereign AGI)
 * Provides secure cryptographic hashing utilities for verifying system component integrity.
 * This Kernel is critical for auditing configuration manifest (SPDM) integrity.
 * Adheres to Kernel architectural standards (privatized state, synchronous setup, I/O proxies).
 */

/**
 * @typedef {'sha256' | 'sha3-512' | 'sha384'} HashingAlgorithm
 */

/**
 * Defines the expected interface for the injected Integrity Hashing Utility.
 * @interface IIntegrityHashingUtility
 */

class SystemCryptoKernel {
    
    /** @type {IIntegrityHashingUtility} */
    #hashingUtility;
    /** @type {boolean} */
    #isInitialized = false;

    /**
     * @param {IIntegrityHashingUtility} hashingUtility - The external tool for performing crypto operations.
     */
    constructor(hashingUtility) {
        this.#setupDependencies(hashingUtility);
        this.#isInitialized = true;
    }

    // --- Private Error/I/O Proxies ---

    /**
     * @private
     * Throws a standardized setup error.
     * @param {string} message
     */
    #throwSetupError(message) {
        throw new Error(`SystemCryptoKernel Setup Error: ${message}`);
    }

    /**
     * @private
     * Throws a critical security failure error, wrapping the underlying cause.
     * @param {string} operation - The failed operation (e.g., 'hashing', 'verification').
     * @param {HashingAlgorithm} algorithm - The algorithm attempted.
     * @param {Error} cause - The original error object.
     */
    #throwSecurityFailure(operation, algorithm, cause) {
        // Logging the internal failure point but returning a generalized security error.
        console.error(`SystemCryptoKernel failure during ${operation} using ${algorithm}:`, cause.message);
        throw new Error(`CRITICAL SECURITY FAILURE: Could not perform integrity check operation '${operation}'. System integrity subsystem compromised or offline.`);
    }

    /**
     * @private
     * Isolates and delegates the hashing operation to the external utility.
     * @param {string | Buffer} data - The input data to hash.
     * @param {HashingAlgorithm} algorithm - The hashing algorithm to use.
     * @returns {string} The hash digest.
     */
    #delegateToHashingUtilityHash(data, algorithm) {
        try {
            return this.#hashingUtility.execute({
                method: 'hash',
                data: data,
                algorithm: algorithm
            });
        } catch (error) {
            this.#throwSecurityFailure('hashing', algorithm, error);
        }
    }

    /**
     * @private
     * Isolates and delegates the hash verification operation to the external utility.
     * @param {string | Buffer} data - The data to check.
     * @param {string} expectedHash - The hash the data must match.
     * @param {HashingAlgorithm} algorithm - The hashing algorithm used.
     * @returns {boolean} True if the hash matches, false otherwise.
     */
    #delegateToHashingUtilityVerify(data, expectedHash, algorithm) {
        try {
            return this.#hashingUtility.execute({
                method: 'verify',
                data: data,
                expectedHash: expectedHash,
                algorithm: algorithm
            });
        } catch (error) {
            // Unlike hashing, which fails if the tool cannot run, verification should return false
            // unless the failure is due to a fundamental utility crash.
            // We treat *execution* failure as critical security failure, not mismatched hash (which is handled by the utility returning false).
            this.#throwSecurityFailure('verification execution', algorithm, error);
        }
    }

    // --- Synchronous Setup ---

    /**
     * @private
     * Rigorously validates and assigns dependencies synchronously.
     * Satisfies the synchronous setup extraction goal.
     * @param {IIntegrityHashingUtility} hashingUtility
     */
    #setupDependencies(hashingUtility) {
        if (!hashingUtility || typeof hashingUtility.execute !== 'function') {
            this.#throwSetupError("IntegrityHashingUtility dependency is required and must implement an 'execute' method.");
        }
        this.#hashingUtility = hashingUtility;
    }

    // --- Public Interface ---

    /**
     * Generates a cryptographic hash for data integrity verification.
     * @param {string | Buffer} data - The input data to hash (e.g., stringified JSON).
     * @param {HashingAlgorithm} [algorithm='sha3-512'] - The hashing algorithm to use.
     * @returns {string} The hash digest.
     */
    hash(data, algorithm = 'sha3-512') {
        return this.#delegateToHashingUtilityHash(data, algorithm);
    }

    /**
     * Verifies data integrity against a provided expected hash.
     * @param {string | Buffer} data - The data to check.
     * @param {string} expectedHash - The hash the data must match.
     * @param {HashingAlgorithm} [algorithm='sha3-512'] - The hashing algorithm used.
     * @returns {boolean} True if the hash matches, false otherwise.
     */
    verifyHash(data, expectedHash, algorithm = 'sha3-512') {
        return this.#delegateToHashingUtilityVerify(data, expectedHash, algorithm);
    }
}

export default SystemCryptoKernel;