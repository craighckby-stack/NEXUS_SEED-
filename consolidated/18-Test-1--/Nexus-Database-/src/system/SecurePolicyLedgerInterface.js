const IntegrityUtils = require('../utils/IntegrityUtils');

// Define specific error context constants
const ERROR_PREFIX = "[SecurePolicyLedgerInterface]";

/**
 * Interface Component: SecurePolicyLedgerInterface (D-01 Connector) v94.1
 * Role: Provides secured read/write access to the cryptographic integrity ledger (D-01).
 * Mandate: Acts as the dedicated channel for retrieving baseline configuration hashes and 
 *          persisting authorized updates, ensuring strong cryptographic authentication 
 *          and boundary enforcement. CIM relies on this for policy I/O.
 */
class SecurePolicyLedgerInterface {
    
    // RPC Method Constants defined as static properties for easy access and configuration
    static RPC_METHODS = {
        FETCH_HASHES: 'D01.fetch_hashes',
        STORE_HASH_RECORD: 'D01.store_hash_record'
    };

    #rpcClient;
    #logger;

    /**
     * @param {object} rpcClient - The secure client used for Ledger (D-01) interaction.
     * @param {object} logger - The system logging utility (must support .error, .debug).
     */
    constructor(rpcClient, logger) {
        if (!rpcClient || typeof rpcClient.call !== 'function') {
            throw new Error(`${ERROR_PREFIX}: Requires a secured RPC client with a callable method.`);
        }
        if (!logger || typeof logger.error !== 'function') {
             throw new Error(`${ERROR_PREFIX}: Requires a valid logging utility.`);
        }

        this.#rpcClient = rpcClient; 
        this.#logger = logger;
        this.#logger.debug(`${ERROR_PREFIX}: Initialized successfully.`);
    }

    /**
     * Centralized RPC execution handler with unified logging and error wrapping.
     * @param {string} method - The RPC method name.
     * @param {object} params - The parameters to pass to the RPC call.
     * @param {string} context - Descriptive context for logging.
     * @returns {Promise<any>} The result of the RPC call.
     * @private
     */
    async #executeRpcCall(method, params, context) {
        try {
            this.#logger.debug(`${ERROR_PREFIX} [${context}] Attempting RPC call: ${method}`);
            const result = await this.#rpcClient.call(method, params);
            this.#logger.debug(`${ERROR_PREFIX} [${context}] RPC call successful.`);
            return result;
        } catch (error) {
            this.#logger.error(
                `${ERROR_PREFIX} [${context}] RPC failure. Method: ${method}`,
                { error: error.message, params }
            );
            // Throw a standardized error for external handling
            throw new Error(`D-01 Ledger access failure (${context}): ${error.message}`);
        }
    }

    /**
     * Retrieves the map of known-good hashes for a list of configured file paths.
     * This interaction must be cryptographically verified against D-01.
     * @param {string[]} paths - List of paths to query hashes for.
     * @returns {Promise<Object<string, string>>} Hash map (path -> hash).
     */
    async getPolicyHashes(paths) {
        if (!Array.isArray(paths) || paths.some(p => typeof p !== 'string')) {
            throw new TypeError(`${ERROR_PREFIX}: Input paths must be an array of strings.`);
        }
        
        const method = SecurePolicyLedgerInterface.RPC_METHODS.FETCH_HASHES;

        const result = await this.#executeRpcCall(
            method,
            { paths },
            'HASH_RETRIEVAL'
        );
            
        // Critical Integrity Check: Validate the structure of the returned hashes.
        if (!IntegrityUtils.isValidPolicyHashMap(result)) {
            const validationError = "Ledger response failed policy hash map integrity validation.";
            this.#logger.error(`${ERROR_PREFIX}: ${validationError}`, { response: result });
            throw new Error(validationError); // Thrown after logging context
        }
            
        return result;
    }

    /**
     * Persists a newly approved hash for a file path. Must only succeed post A-01 approval.
     * This operation must be transactionally signed and immutable in D-01.
     * @param {string} filePath - Path of the file updated.
     * @param {string} newHash - The SHA-512 digest approved by the Governance module.
     * @returns {Promise<boolean>} Success status.
     */
    async storeNewIntegrityHash(filePath, newHash) {
        if (typeof filePath !== 'string' || filePath.length === 0) {
            throw new TypeError(`${ERROR_PREFIX}: File path must be a non-empty string.`);
        }
        
        // Use dedicated utility for cryptographic standard enforcement
        if (!IntegrityUtils.isValidPolicyHash(newHash)) {
            throw new TypeError(`${ERROR_PREFIX}: Provided hash does not meet expected system integrity standard.`);
        }

        const method = SecurePolicyLedgerInterface.RPC_METHODS.STORE_HASH_RECORD;

        const result = await this.#executeRpcCall(
            method,
            { filePath, newHash },
            'HASH_STORAGE'
        );
            
        // Normalize D-01 response (check for explicit success indicators)
        if (result === true || (typeof result === 'object' && result?.success === true)) {
            return true;
        }
            
        // Explicit failure notification from D-01 (if the RPC succeeded but the transaction failed)
        const errorMessage = (typeof result === 'object' && result?.message) || 'Ledger indicated non-specific operational failure during storage.';
        this.#logger.error(`${ERROR_PREFIX}: D-01 transaction failed after successful RPC transport.`, { filePath, response: result });
        throw new Error(errorMessage);
    }
}

module.exports = SecurePolicyLedgerInterface;