/**
 * Hashing Utility Kernel
 * Provides standardized, cryptographic hashing capabilities necessary for 
 * integrity verification across the governance and transaction layers, leveraging
 * an injected Crypto Utility for deterministic serialization and hashing.
 */

export class HashingUtilityKernel {
    /** @type {CryptoUtilityInterfaceKernel} */
    #cryptoUtility; 
    
    /**
     * @param {CryptoUtilityInterfaceKernel} cryptoUtility - The dependency providing stable serialization and hashing functionality.
     */
    constructor(cryptoUtility) {
        this.#cryptoUtility = cryptoUtility;
        this.#setupDependencies();
    }

    /**
     * Validates and sets up required dependencies.
     * Satisfies: synchronous setup extraction goal.
     * @private
     */
    #setupDependencies() {
        if (!this.#cryptoUtility || typeof this.#cryptoUtility.calculateHash !== 'function') {
            throw new Error("Initialization failed: CryptoUtilityInterfaceKernel dependency required and must expose calculateHash(data, algorithm).");
        }
    }

    /**
     * Generates a cryptographic hash of the input data.
     * Supports complex objects by stably serializing them first via the underlying utility.
     * 
     * @param {*} data - The input data (string, object, buffer) to be hashed.
     * @param {string} [algorithm='sha256'] - The hashing algorithm to use (e.g., 'sha256', 'sha512').
     * @returns {string} The hexadecimal hash digest.
     */
    calculateHash(data, algorithm = 'sha256') {
        return this.#delegateToCryptoUtilityCalculateHash(data, algorithm);
    }

    /**
     * Delegates the hashing request to the injected crypto utility.
     * Satisfies: I/O proxy creation goal.
     * 
     * @param {*} data 
     * @param {string} algorithm 
     * @returns {string}
     * @private
     */
    #delegateToCryptoUtilityCalculateHash(data, algorithm) {
        return this.#cryptoUtility.calculateHash(data, algorithm);
    }
}