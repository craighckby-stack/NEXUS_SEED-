const GAXTelemetry = require('../Telemetry/GAXTelemetryService');

/**
 * CRoTIndexClient
 * Handles the high-level policy data interaction, relying on the 
 * CRoTIndexStorageAdapter (abstracted KERNEL capability) for data access.
 */
class CRoTIndexClient {
    
    /**
     * Private field to encapsulate the storage adapter dependency.
     * @type {CRoTIndexStorageAdapter}
     */
    #storageAdapter;

    /**
     * Resolves and validates the CRoT Index Storage Adapter dependency.
     * @returns {CRoTIndexStorageAdapter}
     * @throws {Error} If the dependency is missing or violates the contract.
     */
    #getValidatedStorageAdapter() {
        const adapter = global.CRoTIndexStorageAdapter; 
        
        if (!adapter) {
            // Standardized failure format for dependency injection errors
            throw new Error("[CRoT Index Client] Initialization failure: CRoTIndexStorageAdapter dependency is missing from the global scope.");
        }

        // Enforce basic contract integrity by validating required methods
        if (typeof adapter.lookup !== 'function' || typeof adapter.append !== 'function') {
            throw new Error("[CRoT Index Client] Initialization failure: CRoTIndexStorageAdapter contract violation (missing lookup or append methods).");
        }
        
        return adapter;
    }

    /**
     * Initializes the client, resolving and validating the required storage adapter dependency.
     */
    constructor() {
        this.#storageAdapter = this.#getValidatedStorageAdapter();
        GAXTelemetry.system('CRoT_IndexClient_Init_KernelMode_Abstracted');
    }

    /**
     * Retrieves historical ACV transaction IDs (anchors) associated with a policy fingerprint.
     * @param {string} fingerprint - SHA-256 policy structure hash.
     * @returns {Promise<string[]>} Array of ACV transaction IDs.
     */
    async getAnchorsByFingerprint(fingerprint) {
        // Explicitly check for string type and content to ensure data integrity
        if (typeof fingerprint !== 'string' || !fingerprint) {
            GAXTelemetry.warn('CRoT_IndexRead_Skip', { reason: 'Invalid or missing fingerprint input' });
            return [];
        }

        try {
            // Use encapsulated private storage adapter
            const anchors = await this.#storageAdapter.lookup(fingerprint);
            
            // Ensure anchors is an array for safety, handling single returns or nulls.
            const result = Array.isArray(anchors) ? anchors : (anchors != null ? [anchors] : []);
            
            GAXTelemetry.debug('CRoT_IndexRead', { count: result.length, fingerprint: fingerprint.substring(0, 8) });
            return result;
        } catch (error) {
            GAXTelemetry.error('CRoT_IndexRead_Failure', { error: error.message, fingerprint: fingerprint ? fingerprint.substring(0, 8) : 'N/A' });
            return [];
        }
    }

    /**
     * Commits a new successful ACV transaction ID against the policy fingerprint key.
     * @param {string} fingerprint - The policy structure hash.
     * @param {string} txId - The successful ACV transaction ID.
     * @returns {Promise<void>}
     */
    async indexCommit(fingerprint, txId) {
        // Explicitly check for string type and content
        if (typeof fingerprint !== 'string' || !fingerprint) {
            GAXTelemetry.warn('CRoT_IndexWrite_Skip', { reason: 'Invalid or missing fingerprint input', hasTxId: !!txId });
            return;
        }
        if (typeof txId !== 'string' || !txId) {
            GAXTelemetry.warn('CRoT_IndexWrite_Skip', { reason: 'Invalid or missing transaction ID input', hasFingerprint: !!fingerprint });
            return;
        }

        try {
            // Use encapsulated private storage adapter
            await this.#storageAdapter.append(fingerprint, txId, { timestamp: Date.now() });
            
            GAXTelemetry.info('CRoT_IndexWrite_Success', { txId, fingerprint: fingerprint.substring(0, 8) });
        } catch (error) {
            GAXTelemetry.critical('CRoT_IndexWrite_Failure', { txId, error: error.message, fingerprint: fingerprint.substring(0, 8) });
            // Wrap and rethrow standardized error for consuming services
            throw new Error(`[CRoT Index Client] Commit failed for TX ID ${txId}. Reason: ${error.message}`);
        }
    }
}

module.exports = CRoTIndexClient;