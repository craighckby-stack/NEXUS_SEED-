/**
 * Component ID: ASCM
 * Component Name: Active State Context Manager
 * GSEP Role: EPDP F (Deployment Traceability Lookup)
 * Location: src/governance/activeStateContextManager.js
 *
 * Function: Manages and provides access to the globally agreed-upon identifier 
 * of the currently active architectural state (Proposal ID, Version Hash).
 * This state is considered the operational root-of-trust for auditing (SSV).
 */

// MANDATE 3: DE-FRAGMENTATION & PRUNING (utilities -> utility)
import { GovernanceLock, GovernanceError } from "../utility/governancePrimitives.js";

// Defines the initial, unverified bootstrap state.
const CONTEXT_INITIALIZED_STATE = Object.freeze({
    id: 'BOOTSTRAP_V0',
    versionHash: '00000000',
    timestamp: Date.now()
});

// MANDATE 2: UNIFIER PROTOCOL (Export retained)
export class ActiveStateContextManager {
    // #activeContext holds an immutable state object: { id, versionHash, timestamp }
    static #activeContext = null;
    static #LOCK_HOLDER_ID = "ASCM_DEPLOYMENT_CORE";

    /**
     * Ensures the manager has been initialized to a known baseline state.
     * Idempotent.
     */
    static initialize() {
        if (ActiveStateContextManager.#activeContext) {
            return; // Already initialized
        }
        ActiveStateContextManager.#activeContext = CONTEXT_INITIALIZED_STATE;
        console.log(`[ASCM] Manager initialized. Initial state: ${ActiveStateContextManager.#activeContext.id}`);
    }

    /**
     * Registers the state context confirmed immediately post-deployment/successful rollout.
     * This update must strictly be protected by a governance lock to ensure singularity of transition.
     * @param {string} proposalID - The identifier of the successfully deployed system state.
     * @param {string} [versionHash] - Optional verification hash/checksum of the deployed codebase.
     */
    static setActiveState(proposalID, versionHash = 'N/A') {
        if (!proposalID) {
            throw new GovernanceError("Proposal ID cannot be null when setting active context.", "ASCM_E001");
        }

        // Prevent redundant updates
        if (this.getActiveState().id === proposalID) {
            console.debug(`[ASCM] State ${proposalID} is already active.`);
            return;
        }

        // V94.2 Implementation: Use Governance Lock
        try {
            GovernanceLock.acquire(this.#LOCK_HOLDER_ID);

            const newState = Object.freeze({ 
                id: proposalID, 
                versionHash: versionHash, 
                timestamp: Date.now() 
            });

            ActiveStateContextManager.#activeContext = newState;
            console.log(`[ASCM] Active state context updated: ${newState.id} (Hash: ${versionHash})`);

        } catch (error) {
            if (error instanceof GovernanceError) {
                console.error("[ASCM] Failed state transition due to lock contention.");
                throw error; // Re-throw structured governance error
            }
            throw new GovernanceError(`Unexpected error during state transition: ${error.message}`, "ASCM_E999");
        } finally {
            // Always attempt to release the lock managed by this component.
            if (GovernanceLock.currentHolder === this.#LOCK_HOLDER_ID) {
                GovernanceLock.release(this.#LOCK_HOLDER_ID);
            }
        }
    }

    /**
     * Retrieves the complete verifiable operating state context.
     * @returns {{id: string, versionHash: string, timestamp: number}} The active state object.
     */
    static getActiveState() {
        if (!this.#activeContext) {
            this.initialize(); // Lazy initialization
        }
        return this.#activeContext;
    }

    /**
     * Convenience method to retrieve just the Proposal ID.
     * @returns {string}
     */
    static getActiveProposalID() {
        return this.getActiveState().id;
    }
}

// Ensure initial baseline state is set upon module load.
ActiveStateContextManager.initialize();
