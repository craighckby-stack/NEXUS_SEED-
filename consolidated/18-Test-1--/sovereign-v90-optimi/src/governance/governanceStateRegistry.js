/**
 * Component Governance State Kernel - src/governance/governanceStateKernel.js
 * ID: GSK v1.0 (Refactored for Asynchronous Execution and Kernel Injection)
 * Role: State Persistence / Transactional Safety / AIA Compliance
 *
 * Maintains the current governance lifecycle status of all components, ensuring idempotency,
 * sequential execution, and providing an authoritative source of truth. All operations are
 * asynchronous and leverage injected, audited Tool Kernels for I/O and logging.
 */

import { IHighEfficiencyStateRetrieverToolKernel } from '../tools/IHighEfficiencyStateRetrieverToolKernel';
import { GovernanceAuditKernel } from './GovernanceAuditKernel'; // Assumes injection of the refactored Kernel

// --- Constants ---
export const COMPONENT_STATUS = Object.freeze({
    ACTIVE: 'ACTIVE',
    PENDING_REVIEW: 'PENDING_REVIEW', 
    SCHEDULED_ACTION: 'SCHEDULED_ACTION', 
    RETIRED: 'RETIRED',
    BLOCKED: 'BLOCKED'
});

/**
 * @typedef {Object} ComponentState
 * @property {string} status - Current status from COMPONENT_STATUS.
 * @property {string | null} [actionType] - Type of pending or scheduled action (e.g., 'DEPRECATION', 'RETIREMENT').
 * @property {number} timestamp - Last transition time (Epoch ms).
 * @property {Object | null} [decisionReport] - Full report/metadata justifying the current state transition.
 */

const DEFAULT_STATE = Object.freeze({ status: COMPONENT_STATUS.ACTIVE, timestamp: 0, actionType: null, decisionReport: null });

// --- Main Registry Kernel ---

export class GovernanceStateKernel {

    /**
     * @param {IHighEfficiencyStateRetrieverToolKernel} stateRetriever - Adapter implementing async get(id) and set(id, state).
     * @param {GovernanceAuditKernel} governanceAudit - Service implementing async recordTransition.
     */
    constructor(stateRetriever, governanceAudit) {
        if (!stateRetriever || !governanceAudit) {
            throw new Error("GovernanceStateKernel requires an IHighEfficiencyStateRetrieverToolKernel and GovernanceAuditKernel.");
        }
        this.stateRetriever = stateRetriever;
        this.governanceAudit = governanceAudit;
        this.stateKeyPrefix = 'GOV_STATE:';
    }

    _getStorageKey(componentId) {
        return `${this.stateKeyPrefix}${componentId}`;
    }

    /**
     * Internal Helper for handling state transitions, audit logging, and consistency.
     * Now strictly asynchronous.
     * @param {string} componentId
     * @param {Partial<ComponentState>} newStateData
     * @returns {Promise<ComponentState>}
     */
    async _updateState(componentId, newStateData) {
        const currentState = await this.getStatus(componentId);
        
        // 1. Calculate next state
        const nextState = Object.freeze({
            ...currentState,
            ...newStateData,
            timestamp: Date.now(),
            // Explicitly handle fields that might be cleared to null
            actionType: newStateData.actionType !== undefined ? newStateData.actionType : (currentState.actionType || null),
            decisionReport: newStateData.decisionReport !== undefined ? newStateData.decisionReport : (currentState.decisionReport || null)
        });

        // 2. Critical audit logging hook (Must be async)
        await this.governanceAudit.recordTransition(
            componentId, 
            'GovernanceStateChange', 
            currentState, 
            nextState
        );
        
        // 3. Persist new state (Must be async, using the state retrieval tool for persistence)
        const storageKey = this._getStorageKey(componentId);
        await this.stateRetriever.set(storageKey, nextState);
        
        return nextState;
    }

    /**
     * Retrieves the current, standardized state object for a component.
     * @param {string} componentId
     * @returns {Promise<ComponentState>}
     */
    async getStatus(componentId) {
        const storageKey = this._getStorageKey(componentId);
        
        // Asynchronous retrieval
        const state = await this.stateRetriever.get(storageKey);
        
        if (!state) {
             // Return a newly constructed, frozen default active state if component is not yet registered
             return Object.freeze({ ...DEFAULT_STATE, timestamp: Date.now() });
        }

        // Ensure consistency and immutability upon retrieval
        return Object.freeze({ ...DEFAULT_STATE, ...state }); 
    }

    /**
     * Checks if a component is retired.
     * @returns {Promise<boolean>}
     */
    async isComponentRetired(componentId) {
        const status = (await this.getStatus(componentId)).status;
        return status === COMPONENT_STATUS.RETIRED;
    }
    
    /**
     * Checks if a component is actively undergoing a governance process.
     * @param {string} componentId
     * @param {string | null} [actionType] - Optional, check for a specific type of action.
     * @returns {Promise<boolean>}
     */
    async isComponentInProcess(componentId, actionType = null) {
        const state = await this.getStatus(componentId);

        const inProcess = (
            state.status === COMPONENT_STATUS.PENDING_REVIEW || 
            state.status === COMPONENT_STATUS.SCHEDULED_ACTION
        );

        if (actionType) {
            return inProcess && state.actionType === actionType;
        }
        return inProcess;
    }

    /**
     * Registers that a component review has started (entering PENDING_REVIEW state).
     * @returns {Promise<ComponentState>}
     */
    async registerPendingReview(componentId, actionType, decisionReport = null) {
        if (await this.isComponentInProcess(componentId)) {
            const status = (await this.getStatus(componentId)).status;
            throw new Error(`Component ${componentId} is already in governance process. Status: ${status}`);
        }
        if (!actionType) {
            throw new Error("actionType must be specified when initiating a review.");
        }

        return this._updateState(componentId, {
            status: COMPONENT_STATUS.PENDING_REVIEW,
            actionType: actionType,
            decisionReport: decisionReport
        });
    }

    /**
     * Clears the pending state, reverting to ACTIVE. Handles vetoes or failed adjudications.
     * @returns {Promise<ComponentState>}
     */
    async clearPendingState(componentId) {
        const current = await this.getStatus(componentId);
        
        if (current.status === COMPONENT_STATUS.ACTIVE || current.status === COMPONENT_STATUS.RETIRED) {
             return current; // Idempotent success
        }

        return this._updateState(componentId, { 
            status: COMPONENT_STATUS.ACTIVE,
            actionType: null,
            decisionReport: null
        });
    }

    /**
     * Registers a decision has passed adjudication and is SCHEDULED for execution.
     * @returns {Promise<ComponentState>}
     */
    async registerActionScheduled(componentId, actionReport) {
        const currentStatus = (await this.getStatus(componentId)).status;
        if (currentStatus !== COMPONENT_STATUS.PENDING_REVIEW && currentStatus !== COMPONENT_STATUS.ACTIVE) {
             throw new Error(`Cannot schedule action for component ${componentId}. Current status: ${currentStatus}. Must be PENDING_REVIEW or ACTIVE.`);
        }

        if (!actionReport || !actionReport.actionType) {
            throw new Error("Action report is required and must specify actionType within the report.");
        }
        
        return this._updateState(componentId, {
            status: COMPONENT_STATUS.SCHEDULED_ACTION,
            actionType: actionReport.actionType,
            decisionReport: actionReport,
        });
    }

    /**
     * Updates the component status to permanently retired/finalized.
     * @returns {Promise<ComponentState>}
     */
    async registerActionFinalized(componentId, finalStatus = COMPONENT_STATUS.RETIRED, actionType = 'GOVERNANCE_ACTION') {
        const current = await this.getStatus(componentId);
        
        // If retiring, merge new status while keeping existing decisionReport if actionType context is the same.
        return this._updateState(componentId, {
            status: finalStatus,
            actionType: actionType,
            decisionReport: current.decisionReport // Maintain consistency unless overwritten by _updateState caller
        });
    }
}