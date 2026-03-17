/**
 * Component ID: ASCM (Active State Context Manager)
 * Component Name: Active State Context Manager
 * GSEP Role: EPDP F (Deployment Traceability Lookup)
 * Location: src/governance/activeStateContextManager.js
 *
 * Function: Manages and provides access to the globally agreed-upon identifier 
 * of the currently active architectural state (Proposal ID, Version Hash).
 * This state serves as the operational root-of-trust for auditing and integrity checks (SSV).
 */

import { GovernanceLock, GovernanceError } from "../utilities/governance/governancePrimitives";

/**
 * @typedef {Object} ActiveContextState
 * @property {string} id - The unique identifier of the deployed state (Proposal ID).
 * @property {string} versionHash - The cryptographic checksum or version tag of the codebase.
 * @property {number} timestamp - Unix timestamp of when the state became active.
 */

// Defines the initial, unverified bootstrap state.
const CONTEXT_INITIALIZED_STATE = Object.freeze({
    id: 'BOOTSTRAP_V0',
    versionHash: '00000000',
    timestamp: Date.now()
});

export class ActiveStateContextManager {
    /** @type {ActiveContextState | null} */
    static #activeContext = null;
    static #LOCK_HOLDER_ID = "ASCM_DEPLOYMENT_CORE";
    static #LOCK_TIMEOUT_MS = 100; // Define a reasonable short timeout for governance state changes

    /**
     * Ensures the manager has been initialized to a known baseline state.
     * Idempotent.
     * Initializes if and only if no context is currently set.
     */
    static initialize() {
        if (ActiveStateContextManager.#activeContext) {
            return; // Already initialized
        }
        ActiveStateContextManager.#activeContext = CONTEXT_INITIALIZED_STATE;
        console.log(`[ASCM] Manager initialized. Baseline state set: ${ActiveStateContextManager.#activeContext.id}`);
    }

    /**
     * Registers the state context confirmed immediately post-deployment/successful rollout.
     * This update must strictly be protected by a governance lock to ensure singularity of transition.
     * 
     * @param {string} proposalID - The identifier of the successfully deployed system state.
     * @param {string} [versionHash='N/A'] - Optional verification hash/checksum of the deployed codebase.
     * @returns {void}
     * @throws {GovernanceError} If initialization state is invalid, proposalID is missing, or lock cannot be acquired.
     */
    static setActiveState(proposalID, versionHash = 'N/A') {
        if (typeof proposalID !== 'string' || proposalID.trim() === '') {
            throw new GovernanceError("Proposal ID must be a non-empty string when setting active context.", "ASCM_E001");
        }

        // Prevent redundant updates to avoid unnecessary locking overhead.
        if (ActiveStateContextManager.getActiveState().id === proposalID) {
            console.debug(`[ASCM] State ${proposalID} is already active. Skipping transition.`);
            return;
        }

        // Implementation: Use Governance Lock with timeout for fail-fast behavior.
        try {
            // Attempt to acquire the lock. Throws GovernanceError on failure/timeout.
            GovernanceLock.acquire(ActiveStateContextManager.#LOCK_HOLDER_ID, ActiveStateContextManager.#LOCK_TIMEOUT_MS);

            const newState = Object.freeze({
                id: proposalID,
                versionHash: versionHash,
                timestamp: Date.now()
            });

            // Atomic transition
            ActiveStateContextManager.#activeContext = newState;
            console.log(`[ASCM] State transition successful. New active state: ${newState.id} (Hash: ${versionHash})`);

        } catch (error) {
            if (error instanceof GovernanceError) {
                console.error(`[ASCM] Failed state transition for ${proposalID} due to lock contention or governance rule breach.`);
                throw error; // Re-throw structured governance error
            }
            // Catch unexpected runtime errors
            throw new GovernanceError(`Unexpected internal error during state transition: ${error.message}`, "ASCM_E999");
        } finally {
            // Always attempt to release the lock managed by this component.
            if (GovernanceLock.currentHolder === ActiveStateContextManager.#LOCK_HOLDER_ID) {
                GovernanceLock.release(ActiveStateContextManager.#LOCK_HOLDER_ID);
            }
        }
    }

    /**
     * Retrieves the complete verifiable operating state context.
     * Performs lazy initialization if accessed before module load completion.
     * @returns {ActiveContextState} The active state object.
     */
    static getActiveState() {
        if (!ActiveStateContextManager.#activeContext) {
            ActiveStateContextManager.initialize(); 
        }
        return ActiveStateContextManager.#activeContext;
    }

    /**
     * Convenience method to retrieve just the Proposal ID.
     * @returns {string}
     */
    static getActiveProposalID() {
        return ActiveStateContextManager.getActiveState().id;
    }

    /**
     * Convenience method to retrieve the associated Version Hash.
     * @returns {string}
     */
    static getActiveVersionHash() {
        return ActiveStateContextManager.getActiveState().versionHash;
    }
}

// Guarantee baseline state is established upon module load.
ActiveStateContextManager.initialize();