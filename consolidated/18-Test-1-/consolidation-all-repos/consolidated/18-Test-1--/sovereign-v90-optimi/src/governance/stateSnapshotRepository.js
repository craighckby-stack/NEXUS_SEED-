/**
 * Component ID: SSRK
 * Component Name: State Snapshot Repository Kernel
 * GSEP Role: EPDP D/E Auxiliary (Atomic State Tracing)
 * Location: src/governance/stateSnapshotRepositoryKernel.js
 *
 * Function: Stores an immutable record of cryptographic components used to define
 * a System State Hash (SSH), providing a persistent, detailed audit trail for
 * rollback decisions and state integrity verification.
 *
 * This kernel replaces the synchronous StateSnapshotRepository, delegating all persistence,
 * validation, and logging responsibilities to specialized asynchronous Tool Kernels
 * to achieve Maximum Recursive Abstraction (MRA) and comply with AIA mandates.
 */

export class StateSnapshotRepositoryKernel {

    /**
     * @param {object} tools - Injected Tool Kernels.
     * @param {IProposalHistoryConfigRegistryKernel} tools.proposalHistoryRegistry - Manages immutable historical records linked to proposals.
     * @param {ISpecValidatorKernel} tools.specValidator - Validates the structure and integrity of the snapshot payload.
     * @param {MultiTargetAuditDisperserToolKernel} tools.auditDisperser - Handles secure, asynchronous, auditable logging.
     */
    constructor({ proposalHistoryRegistry, specValidator, auditDisperser }) {
        this.proposalHistoryRegistry = proposalHistoryRegistry;
        this.specValidator = specValidator;
        this.auditDisperser = auditDisperser;
        this.isInitialized = false;
        this.snapshotSchemaId = 'SystemStateSnapshotSchema';
    }

    /**
     * Mandatory asynchronous initialization method.
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.isInitialized) return;
        
        // All underlying Tool Kernels are assumed initialized via the global initialization routine.
        // We only check structural initialization here.
        this.isInitialized = true;
    }

    /**
     * Internal utility for checking snapshot structural validity via the Spec Validator.
     * @param {object} snapshot 
     * @returns {Promise<boolean>}
     */
    async _validateSnapshot(snapshot) {
        const validationResult = await this.specValidator.validate({
            schemaId: this.snapshotSchemaId,
            payload: snapshot
        });
        
        if (!validationResult.isValid) {
            const errors = validationResult.errors.map(e => e.message || String(e)).join('; ');
            await this.auditDisperser.audit({
                level: 'CRITICAL', 
                message: `Invalid state snapshot provided. Validation errors: ${errors}`,
                component: 'SSRK', 
                data: snapshot 
            });
            return false;
        }
        return true;
    }

    /**
     * Saves the complete cryptographic context snapshot, ensuring immutability.
     * The proposalID serves as the unique identifier and transaction lock.
     * @param {{ proposalID: string, configHash: string, codebaseHash: string, ssh: string, timestamp: number }} snapshot
     * @returns {Promise<void>}
     */
    async saveSnapshot(snapshot) {
        if (!this.isInitialized) throw new Error("SSRK: Kernel not initialized.");

        const isValid = await this._validateSnapshot(snapshot);
        if (!isValid) {
            return; // Validation failure logged internally.
        }

        // Check for existing record via the Registry
        const proposalID = snapshot.proposalID;
        const exists = await this.proposalHistoryRegistry.hasHistoryRecord(proposalID);
        
        if (exists) {
            // Immutability Check: Prevent overwriting existing, locked state records.
            await this.auditDisperser.audit({
                level: 'WARNING',
                message: `Attempted to overwrite state snapshot for Proposal ID ${proposalID}. Operation skipped due to immutability mandate.`,
                component: 'SSRK',
                proposalId: proposalID
            });
            return;
        }

        try {
            // Delegation: The registry handles persistence, defensive copying, and freezing.
            await this.proposalHistoryRegistry.registerHistoryRecord(proposalID, snapshot);

            await this.auditDisperser.audit({
                level: 'INFO',
                message: `State snapshot successfully locked and saved for Proposal ID: ${proposalID}.`,
                component: 'SSRK',
                proposalId: proposalID
            });
        } catch (error) {
            await this.auditDisperser.audit({
                level: 'ERROR',
                message: `Failed to save state snapshot for Proposal ID ${proposalID}: ${error.message}`,
                component: 'SSRK',
                error: error.message,
                stack: error.stack
            });
            throw error; 
        }
    }

    /**
     * Retrieves a detailed snapshot by Proposal ID.
     * @param {string} proposalID
     * @returns {Promise<object | undefined>}
     */
    async getSnapshot(proposalID) {
        if (!this.isInitialized) throw new Error("SSRK: Kernel not initialized.");
        // Delegation: Retrieve the immutable record.
        return this.proposalHistoryRegistry.getHistoryRecord(proposalID);
    }

    /**
     * Checks if a snapshot exists for a given Proposal ID.
     * @param {string} proposalID
     * @returns {Promise<boolean>}
     */
    async hasSnapshot(proposalID) {
        if (!this.isInitialized) throw new Error("SSRK: Kernel not initialized.");
        return this.proposalHistoryRegistry.hasHistoryRecord(proposalID);
    }

    /**
     * Retrieves the total count of stored snapshots (Metric).
     * @returns {Promise<number>}
     */
    async getSize() {
        if (!this.isInitialized) throw new Error("SSRK: Kernel not initialized.");
        // Delegation: Retrieve the metric from the underlying registry.
        // Assuming the history registry exposes a size/count accessor.
        if (typeof this.proposalHistoryRegistry.getRecordCount === 'function') {
            return this.proposalHistoryRegistry.getRecordCount();
        } 
        return 0; // Fallback
    }
    
    // Note: The synchronous 'clearRepository' method is deprecated and removed to maintain
    // the immutability mandate. Repository cleaning must be done via privileged system calls
    // routed through the Proposal History Registry's lifecycle management interface.
}