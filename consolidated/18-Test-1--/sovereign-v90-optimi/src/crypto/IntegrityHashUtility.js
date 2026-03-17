const { CryptoUtilityInterfaceKernel } = require('./CryptoUtilityInterfaceKernel'); // Placeholder for actual import path
const { SecureResourceLoaderInterfaceKernel } = require('../resource/SecureResourceLoaderInterfaceKernel'); // Placeholder for actual import path

/**
 * IntegrityHashKernel
 * Provides standardized, consistent cryptographic hashing functions for
 * Governance Artifact attestation (GAX III requirement).
 * Ensures all hashing uses the mandated protocol (SHA-256, Hex encoding).
 * Utilizes injected Kernel tools for cryptographic operations and secure resource loading.
 */
class IntegrityHashKernel {

    #cryptoUtility;
    #resourceLoader;

    // --- Mandated Integrity Protocol Constants (GAX III) ---
    static #ALGORITHM = 'sha256';
    static #ENCODING = 'hex';
    // Length of SHA-256 hash in hex characters (32 bytes * 2).
    static #HASH_LENGTH_HEX = 64;

    /**
     * @param {CryptoUtilityInterfaceKernel} cryptoUtility
     * @param {SecureResourceLoaderInterfaceKernel} resourceLoader
     */
    constructor(cryptoUtility, resourceLoader) {
        this.#setupDependencies(cryptoUtility, resourceLoader);
    }

    /**
     * Rigorously enforces synchronous dependency validation and assignment.
     * @param {CryptoUtilityInterfaceKernel} cryptoUtility
     * @param {SecureResourceLoaderInterfaceKernel} resourceLoader
     * @private
     */
    #setupDependencies(cryptoUtility, resourceLoader) {
        if (!cryptoUtility || typeof cryptoUtility.hash !== 'function' || typeof cryptoUtility.hashStream !== 'function') {
            throw new Error("IntegrityHashKernel requires a valid CryptoUtilityInterfaceKernel with hash and hashStream methods.");
        }
        if (!resourceLoader || typeof resourceLoader.createReadStream !== 'function' || typeof resourceLoader.resolvePath !== 'function') {
            throw new Error("IntegrityHashKernel requires a valid SecureResourceLoaderInterfaceKernel with createReadStream and resolvePath methods.");
        }
        this.#cryptoUtility = cryptoUtility;
        this.#resourceLoader = resourceLoader;
    }

    /**
     * Calculates the cryptographic hash of raw data (Buffer or string).
     * Delegates hashing using the mandated ALGORITHM asynchronously.
     * @param {Buffer | string} data The content to hash.
     * @returns {Promise<string>} The SHA-256 hash (64 characters).
     * @throws {Error} If data is null or undefined or if hashing fails.
     */
    async hashData(data) {
        if (data === null || data === undefined) {
            throw new Error("IntegrityHashKernel: Cannot hash null or undefined data.");
        }
        return this.#cryptoUtility.hash({
            data: data,
            algorithm: IntegrityHashKernel.#ALGORITHM,
            encoding: IntegrityHashKernel.#ENCODING
        });
    }

    /**
     * Calculates the hash of a file asynchronously (preferred for all file checks).
     * This method uses stream piping via the injected resource loader for optimal memory management.
     * @param {string} filePath Absolute or relative path to the file.
     * @returns {Promise<string>} Promise resolving to the SHA-256 hash.
     */
    async hashFileAsync(filePath) {
        try {
            const fullPath = await this.#resourceLoader.resolvePath(filePath);
            
            // Use the resource loader to create the file stream
            const stream = await this.#resourceLoader.createReadStream(fullPath);
            
            // Use the crypto utility to handle stream hashing
            return this.#cryptoUtility.hashStream({
                stream: stream,
                algorithm: IntegrityHashKernel.#ALGORITHM,
                encoding: IntegrityHashKernel.#ENCODING
            });
        } catch (error) {
            throw new Error(`Integrity hashing failed for file ${filePath}: ${error.message}`);
        }
    }
    
    /**
     * Validates if a calculated hash matches an expected hash.
     * Enforces consistency in integrity checks and hash length.
     * @param {string} calculatedHash The newly calculated hash.
     * @param {string} expectedHash The required hash.
     * @returns {boolean} True if the hashes match and are valid lengths.
     */
    validateHash(calculatedHash, expectedHash) {
        if (typeof calculatedHash !== 'string' || typeof expectedHash !== 'string') {
            return false;
        }

        // Standardize validation against the defined digest length.
        if (calculatedHash.length !== IntegrityHashKernel.#HASH_LENGTH_HEX || expectedHash.length !== IntegrityHashKernel.#HASH_LENGTH_HEX) {
            return false;
        }
        
        // Note: For sensitive cryptographic comparison, a dedicated utility for 
        // constant-time comparison (e.g., this.#cryptoUtility.secureEquals) might be preferred,
        // but simple comparison is sufficient for general integrity checking.
        return calculatedHash === expectedHash;
    }
    
    /**
     * Retrieves the currently mandated hashing algorithm for external reporting/attestation.
     * @returns {string} The algorithm name.
     */
    getAlgorithm() {
        return IntegrityHashKernel.#ALGORITHM;
    }

    /**
     * Retrieves the mandated hash length in hex characters.
     * @returns {number} The required length (64 for SHA-256 hex).
     */
    getHashLength() {
        return IntegrityHashKernel.#HASH_LENGTH_HEX;
    }
}