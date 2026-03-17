// src/governance/mutationChainRegistrar.js
// Responsibility: Maintains an immutable, cryptographically chained ledger of all successful 
// and deployed architectural mutations (A-01 payloads), ensuring strict integrity checks.

/**
 * @typedef {object} MutationRecord
 * @property {number} timestamp - Time of registration.
 * @property {string} mutationId - Version ID from the payload.
 * @property {string} architecturalHash - Hash of the A-01 manifest.
 * @property {string} p01Hash - Confirmation hash proving successful deployment (P-01).
 * @property {string} previousChainHash - Hash of the preceding chain record.
 * @property {string} selfHash - Hash of this entire record structure (linkage).
 */

const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

class MutationChainRegistrar {
    /**
     * @param {object} dependencies 
     * @param {AuditLogger} dependencies.auditLogger 
     * @param {IntegrityService} dependencies.integrityService - Must provide verifyArchitecturalSignature.
     * @param {LedgerPersistence} dependencies.ledgerPersistence - Assumed to use async I/O and 'persistRecord'.
     */
    constructor({ auditLogger, integrityService, ledgerPersistence }) {
        if (!integrityService || !ledgerPersistence) {
            throw new Error("MCR requires IntegrityService and LedgerPersistence dependencies.");
        }

        this.auditLogger = auditLogger; 
        this.integrityService = integrityService; 
        this.ledgerPersistence = ledgerPersistence;
        
        // The chain array is initialized empty, waiting for initialization routine.
        this.chain = []; 
        this.isInitialized = false;
    }

    /**
     * Initializes the registrar by loading historical data asynchronously and verifying linkage.
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.isInitialized) return;
        
        try {
            this.chain = await this.ledgerPersistence.loadChainHistory();
            
            if (this.chain.length > 0) {
                this.auditLogger.logEvent('MCR_LOAD', `Loaded ${this.chain.length} records from history. Last hash: ${this.getLatestChainHash().substring(0, 10)}...`);
                
                if (!this.verifyFullChainIntegrity()) {
                     throw new Error("Loaded chain failed internal cryptographic linkage verification.");
                }
            } else {
                this.auditLogger.logEvent('MCR_INIT', 'Initialized GENESIS chain.');
            }
            this.isInitialized = true;
        } catch (error) {
            this.auditLogger.logCritical('MCR_INIT_FAILURE', `Failed to initialize chain history: ${error.message}`);
            // Must halt operations if chain history cannot be loaded/verified.
            throw new Error(`Critical failure loading mutation chain history: ${error.message}`);
        }
    }

    /**
     * Validates the cryptographic linkage and self-hashes of every record in the loaded chain.
     * @returns {boolean}
     */
    verifyFullChainIntegrity() {
        if (this.chain.length === 0) return true;

        for (let i = 0; i < this.chain.length; i++) {
            const record = this.chain[i];
            
            // 1. Re-calculate and verify selfHash consistency
            const calculatedSelfHash = this.integrityService.calculateStableHash({
                timestamp: record.timestamp,
                mutationId: record.mutationId,
                architecturalHash: record.architecturalHash,
                p01Hash: record.p01Hash,
                previousChainHash: record.previousChainHash
            });

            if (calculatedSelfHash !== record.selfHash) {
                this.auditLogger.logError('MCR_INTEGRITY_FAIL', `Self-hash mismatch detected at index ${i} (ID: ${record.mutationId}).`);
                return false;
            }

            // 2. Verify previousChainHash linkage
            const expectedPreviousHash = (i === 0) ? GENESIS_HASH : this.chain[i - 1].selfHash;
            
            if (record.previousChainHash !== expectedPreviousHash) {
                this.auditLogger.logCritical('MCR_CHAIN_BREAK', `Chain linkage broken at index ${i}. Expected hash break.`);
                return false;
            }
        }
        this.auditLogger.logEvent('MCR_INTEGRITY_OK', 'Chain structure verified successfully.');
        return true;
    }

    /**
     * Registers a finalized (A-01 locked) payload into the evolutionary chain.
     * @param {object} payload - The signed and versioned architectural manifest.
     * @param {string} p01ConfirmationHash - The immutable hash from D-01 proving P-01 success.
     * @returns {Promise<string>} The selfHash of the newly registered record.
     */
    async registerMutation(payload, p01ConfirmationHash) {
        if (!this.isInitialized) {
            throw new Error("MCR must be initialized before registering mutations.");
        }

        // --- Critical Security Check ---
        // Must verify the payload's signature ensures the mutation originated from the trusted governance assembly.
        if (!this.integrityService.verifyArchitecturalSignature(payload)) {
            this.auditLogger.logError('MCR_FAILURE', `Payload signature verification failed for version ${payload.versionId || 'unknown'}.`);
            throw new Error("MCR Registration Failure: Invalid cryptographic signature on A-01 manifest.");
        }
        
        // 1. Structure the new record
        const newRecordWithoutHash = {
            timestamp: Date.now(),
            mutationId: payload.versionId,
            // Use the manifest hash for immutable architectural record
            architecturalHash: this.integrityService.calculateStableHash(payload.manifest), 
            p01Hash: p01ConfirmationHash, 
            previousChainHash: this.getLatestChainHash()
        };

        // 2. Calculate the linkage hash (selfHash)
        const selfHash = this.integrityService.calculateStableHash(newRecordWithoutHash);
        
        const newRecord = { ...newRecordWithoutHash, selfHash };
        
        // 3. Commit locally and asynchronously persist
        this.chain.push(newRecord);
        
        try {
            await this.ledgerPersistence.persistRecord(newRecord);
        } catch (error) {
             // If persistence fails, roll back the local change immediately to prevent state divergence
            this.chain.pop(); 
            this.auditLogger.logCritical('MCR_PERSISTENCE_FAIL', `Failed to persist record ${payload.versionId}. Chain integrity maintained via rollback.`);
            throw new Error(`Persistence failure during MCR commit: ${error.message}`);
        }

        this.auditLogger.logEvent('MCR_COMMITMENT', `Mutation ${payload.versionId} committed. Hash: ${selfHash.substring(0, 10)}...`);
        return selfHash;
    }

    /**
     * Retrieves the selfHash of the most recent record.
     * @returns {string}
     */
    getLatestChainHash() {
        if (this.chain.length === 0) return GENESIS_HASH;
        return this.chain[this.chain.length - 1].selfHash;
    }

    getChainLength() {
        return this.chain.length;
    }

    getChain() {
        // Return a copy to ensure external manipulation does not compromise the internal ledger.
        return [...this.chain];
    }
}

module.exports = MutationChainRegistrar;
