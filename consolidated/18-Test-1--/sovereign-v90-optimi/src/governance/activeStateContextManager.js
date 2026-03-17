/**
 * Component ID: ASCMK (Active State Context Manager Kernel)
 * Component Name: Active State Context Manager Kernel
 * GSEP Role: EPDP F (Deployment Traceability Lookup)
 * Location: src/governance/activeStateContextManagerKernel.js
 *
 * Function: Manages and provides asynchronous, high-integrity access to the globally agreed-upon identifier 
 * of the currently active architectural state (Proposal ID, Version Hash).
 * This state serves as the operational root-of-trust for auditing and integrity checks (SSV).
 */

import { GovernanceError } from "../utilities/governance/governancePrimitives";
import { ILoggerToolKernel } from "../tools/logger/ILoggerToolKernel";

/**
 * @typedef {Object} ActiveContextState
 * @property {string} id - The unique identifier of the deployed state (Proposal ID).
 * @property {string} versionHash - The cryptographic checksum or version tag of the codebase.
 * @property {number} timestamp - Unix timestamp of when the state became active.
 */

// Defines the initial, unverified bootstrap state blueprint.
const CONTEXT_INITIALIZED_STATE = Object.freeze({
    id: 'BOOTSTRAP_V0',
    versionHash: '00000000',
    timestamp: 0
});

export class ActiveStateContextManagerKernel {
    /** @type {ILoggerToolKernel} */
    #logger;
    /** @type {ActiveContextState | null} */
    #activeContext = null;
    #isInitialized = false;

    /**
     * @param {object} dependencies
     * @param {ILoggerToolKernel} dependencies.logger - High-integrity logging tool.
     */
    constructor(dependencies) {
        this.#setupDependencies(dependencies);
    }

    /**
     * Validates and sets up injected dependencies.
     */
    #setupDependencies(dependencies) {
        if (!dependencies.logger) {
            throw new Error("ASCM Kernel requires ILoggerToolKernel for auditable operations.");
        }
        this.#logger = dependencies.logger;
    }

    /**
     * Ensures the manager has been initialized to a known baseline state.
     * Idempotent and Asynchronous.
     * Initializes the kernel state.
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.#isInitialized) {
            return;
        }

        // Initialize state to the bootstrap baseline with current timestamp.
        this.#activeContext = Object.freeze({
            ...CONTEXT_INITIALIZED_STATE,
            timestamp: Date.now()
        });

        this.#isInitialized = true;
        this.#logger.info(`[ASCMK] Manager initialized. Baseline state set: ${this.#activeContext.id}`);
    }

    /**
     * Registers the state context confirmed immediately post-deployment/successful rollout.
     * This transition must be asynchronous and atomic. Locking responsibility is delegated
     * to the surrounding execution environment (e.g., IAsyncCheckExecutionWrapperToolKernel).
     * 
     * @param {string} proposalID - The identifier of the successfully deployed system state.
     * @param {string} [versionHash='N/A'] - Optional verification hash/checksum of the deployed codebase.
     * @returns {Promise<void>}
     * @throws {GovernanceError} If the kernel is uninitialized or input is invalid.
     */
    async setActiveState(proposalID, versionHash = 'N/A') {
        if (!this.#isInitialized) {
            throw new GovernanceError("ASCM Kernel accessed before successful initialization.", "ASCM_E000");
        }

        if (typeof proposalID !== 'string' || proposalID.trim() === '') {
            throw new GovernanceError("Proposal ID must be a non-empty string when setting active context.", "ASCM_E001");
        }

        if (this.#activeContext.id === proposalID) {
            this.#logger.debug(`[ASCMK] State ${proposalID} is already active. Skipping redundant transition.`);
            return;
        }

        try {
            const oldStateId = this.#activeContext.id;
            const newState = Object.freeze({
                id: proposalID,
                versionHash: versionHash,
                timestamp: Date.now()
            });

            // Atomic state transition
            this.#activeContext = newState;
            
            // Log successful transition using the injected logger as a system event
            this.#logger.systemEvent(`[ASCMK] State transition successful. New active state: ${newState.id}`, {
                previousStateId: oldStateId,
                newStateId: proposalID,
                versionHash: versionHash,
                timestamp: newState.timestamp
            });

        } catch (error) {
            const err = (error instanceof GovernanceError) ? error : new GovernanceError(`Unexpected internal error during state transition: ${error.message}`, "ASCM_E999");
            this.#logger.error(`[ASCMK] Failed state transition for ${proposalID}.`, { error: err.message, code: err.code });
            throw err;
        }
    }

    /**
     * Retrieves the complete verifiable operating state context.
     * @returns {ActiveContextState}
     * @throws {GovernanceError} If the kernel has not been initialized.
     */
    getActiveState() {
        if (!this.#isInitialized || !this.#activeContext) {
            throw new GovernanceError("ASCM Kernel accessed before successful initialization.", "ASCM_E002");
        }
        return this.#activeContext;
    }

    /**
     * Convenience method to retrieve just the Proposal ID.
     * @returns {string}
     */
    getActiveProposalID() {
        return this.getActiveState().id;
    }

    /**
     * Convenience method to retrieve the associated Version Hash.
     * @returns {string}
     */
    getActiveVersionHash() {
        return this.getActiveState().versionHash;
    }
}