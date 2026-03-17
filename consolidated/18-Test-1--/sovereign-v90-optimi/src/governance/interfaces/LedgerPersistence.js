// src/governance/interfaces/LedgerPersistence.js
// Defines the required interface for ledger persistence used by the MutationChainRegistrar (MCR).

/**
 * @interface IMutationChainPersistenceToolKernel
 * @description A high-integrity, asynchronous Tool Kernel responsible for
 * managing I/O operations for the core Mutation Chain Ledger. This replaces
 * the generic LedgerPersistence interface, ensuring auditable, non-blocking
 * persistence compliant with AIA Enforcement Layer mandates.
 */
class IMutationChainPersistenceToolKernel {

    /**
     * Asynchronously loads the entire validated history of MutationRecords from persistent storage.
     * @returns {Promise<ReadonlyArray<MutationRecord>>} A promise that resolves to an immutable array of records.
     */
    async loadChainHistory() {
        throw new Error("Kernel method 'loadChainHistory' must be implemented.");
    }

    /**
     * Asynchronously commits a single, validated MutationRecord to persistent storage.
     * This ensures efficient, atomic commitment for new chain links.
     * @param {MutationRecord} record - The immutable record to commit, containing cryptographic hashes.
     * @returns {Promise<void>}
     */
    async persistRecord(record) {
        throw new Error("Kernel method 'persistRecord' must be implemented.");
    }
}

module.exports = IMutationChainPersistenceToolKernel;