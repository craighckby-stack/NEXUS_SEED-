// src/governance/interfaces/LedgerPersistence.js
// Defines the required interface for ledger persistence used by the MutationChainRegistrar (MCR).

/**
 * @interface LedgerPersistence
 * @description Handles asynchronous I/O operations for the mutation chain ledger, ensuring non-blocking persistence.
 */
class LedgerPersistence {

    /**
     * Asynchronously loads the entire history of MutationRecords.
     * @returns {Promise<MutationRecord[]>}
     */
    async loadChainHistory() {
        throw new Error("Method 'loadChainHistory' must be implemented by the persistence layer.");
    }

    /**
     * Asynchronously appends a single, fully formed MutationRecord to the ledger.
     * This ensures efficient, atomic commitment for new chain links.
     * @param {MutationRecord} record - The new record to commit, including the calculated selfHash.
     * @returns {Promise<void>}
     */
    async persistRecord(record) {
        throw new Error("Method 'persistRecord' must be implemented by the persistence layer.");
    }
}

module.exports = LedgerPersistence;
