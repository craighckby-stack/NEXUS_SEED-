/**
 * Component ID: SSR
 * Component Name: State Snapshot Repository
 * GSEP Role: EPDP D/E Auxiliary (Atomic State Tracing)
 * Location: src/governance/stateSnapshotRepository.js
 *
 * Function: Stores an immutable record of cryptographic components used to define
 * a System State Hash (SSH), providing a persistent, detailed audit trail for
 * rollback decisions and state integrity verification.
 */

// NOTE: In a production environment, this should utilize a secure, append-only, 
// persistent store (like an isolated database table or tamper-proof log).
// For scaffolding, we use a simple in-memory structure.

const stateSnapshots = new Map();

export class StateSnapshotRepository {

    /**
     * Saves the complete cryptographic context snapshot.
     * @param {{ proposalID: string, configHash: string, codebaseHash: string, ssh: string }} snapshot
     * @returns {void}
     */
    static saveSnapshot(snapshot) {
        if (stateSnapshots.has(snapshot.proposalID)) {
            // If the system attempted to lock the state twice for the same proposal, 
            // it suggests a governance error or re-run, but we prefer immutability.
            // We log and ignore, or throw, depending on strictness requirements.
            console.warn(`[SSR] Warning: Attempted to overwrite state snapshot for Proposal ID ${snapshot.proposalID}. Operation skipped.`);
            return;
        }
        
        // Store the immutable record
        stateSnapshots.set(snapshot.proposalID, Object.freeze(snapshot));
        console.log(`[SSR] Snapshot saved for ${snapshot.proposalID}.`);
    }

    /**
     * Retrieves a detailed snapshot by Proposal ID.
     * @param {string} proposalID
     * @returns {{ proposalID: string, configHash: string, codebaseHash: string, ssh: string } | undefined}
     */
    static getSnapshot(proposalID) {
        return stateSnapshots.get(proposalID);
    }

    /**
     * Clears all snapshots (Use only for controlled environment resets/tests).
     */
    static clearRepository() {
        stateSnapshots.clear();
    }
}