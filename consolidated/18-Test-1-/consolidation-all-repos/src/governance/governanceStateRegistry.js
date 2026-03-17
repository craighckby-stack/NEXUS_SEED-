/**
 * Component Governance State Registry - src/governance/governanceStateRegistry.js
 * ID: GSR v94.2 (Refactored for robustness and scalability)
 * Role: State Persistence / Transactional Safety
 *
 * Maintains the current governance lifecycle status of all components.
 * This ensures idempotency, sequential execution, and provides an authoritative source of truth.
 *
 * NOTE: The internal map acts as a placeholder Persistence Adapter. This structure is ready
 * to inject a durable persistence dependency and interface with an Audit Service.
 */

// --- Constants ---
export const COMPONENT_STATUS = {
    ACTIVE: 'ACTIVE',
    PENDING_REVIEW: 'PENDING_REVIEW', // A review or voting process is ongoing
    SCHEDULED_ACTION: 'SCHEDULED_ACTION', // Review passed, pending execution by Actuator
    RETIRED: 'RETIRED',
    BLOCKED: 'BLOCKED' // Due to external factors/veto or failure
};

/**
 * @typedef {Object} ComponentState
 * @property {string} status - Current status from COMPONENT_STATUS.
 * @property {string} [actionType] - Type of pending or scheduled action (e.g., 'DEPRECATION', 'RETIREMENT').
 * @property {number} timestamp - Last transition time (Epoch ms).
 * @property {Object} [decisionReport] - Full report/metadata justifying the current state transition.
 */

// Placeholder Persistence Layer (In-memory Map)
const stateMap = new Map(); 
const DEFAULT_STATE = { status: COMPONENT_STATUS.ACTIVE, timestamp: 0 };

// Placeholder: GovernanceAuditService Dependency (See Scaffold proposal)
const AuditService = { 
    logTransition: (id, previous, next) => { /* Placeholder: Integrate governanceAuditService here */ }
};

class GovernanceStateRegistry {

    /**
     * Internal Helper for handling state transitions, audit logging, and consistency.
     * @param {string} componentId
     * @param {Partial<ComponentState>} newStateData
     */
    _updateState(componentId, newStateData) {
        const currentState = this.getStatus(componentId);
        
        const nextState = {
            ...currentState,
            ...newStateData,
            timestamp: Date.now(),
        };

        // Critical audit logging hook
        AuditService.logTransition(componentId, currentState, nextState);
        
        stateMap.set(componentId, nextState);
        return nextState;
    }

    /**
     * Retrieves the current, standardized state object for a component.
     * Ensures a consistent return type (ComponentState).
     * @param {string} componentId
     * @returns {ComponentState}
     */
    getStatus(componentId) {
        const state = stateMap.get(componentId);
        // Return existing state or a newly constructed default active state
        return state ? state : { ...DEFAULT_STATE, timestamp: Date.now() };
    }

    /**
     * Checks if a component is retired.
     */
    isComponentRetired(componentId) {
        return this.getStatus(componentId).status === COMPONENT_STATUS.RETIRED;
    }
    
    /**
     * Checks if a component is actively undergoing a governance process.
     * @param {string} componentId
     * @param {string} [actionType] - Optional, check for a specific type of action.
     */
    isComponentInProcess(componentId, actionType = null) {
        const state = this.getStatus(componentId);

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
     */
    registerPendingReview(componentId, actionType) {
        if (this.isComponentInProcess(componentId)) {
            throw new Error(`Component ${componentId} is already in process. Status: ${this.getStatus(componentId).status}`);
        }
        return this._updateState(componentId, {
            status: COMPONENT_STATUS.PENDING_REVIEW,
            actionType: actionType,
            decisionReport: undefined
        });
    }

    /**
     * Clears the pending state, reverting to ACTIVE. Handles vetoes or failed adjudications.
     */
    clearPendingState(componentId) {
        const current = this.getStatus(componentId);
        
        if (current.status !== COMPONENT_STATUS.PENDING_REVIEW && current.status !== COMPONENT_STATUS.SCHEDULED_ACTION) {
             return current; // Idempotent success
        }

        return this._updateState(componentId, { 
            status: COMPONENT_STATUS.ACTIVE,
            actionType: undefined,
            decisionReport: undefined
        });
    }

    /**
     * Registers a decision has passed adjudication and is SCHEDULED for execution.
     * Requires actionReport to contain the actionType.
     */
    registerActionScheduled(componentId, actionReport) {
        const currentStatus = this.getStatus(componentId).status;
        if (currentStatus !== COMPONENT_STATUS.PENDING_REVIEW && currentStatus !== COMPONENT_STATUS.ACTIVE) {
             throw new Error(`Cannot schedule action for component ${componentId}. Current status: ${currentStatus}`);
        }

        if (!actionReport || !actionReport.actionType) {
            throw new Error("Action report is required and must specify actionType.");
        }
        
        return this._updateState(componentId, {
            status: COMPONENT_STATUS.SCHEDULED_ACTION,
            actionType: actionReport.actionType,
            decisionReport: actionReport,
        });
    }

    /**
     * Updates the component status to permanently retired/finalized.
     */
    registerActionFinalized(componentId, finalStatus = COMPONENT_STATUS.RETIRED, actionType = 'GOVERNANCE_ACTION') {
        
        return this._updateState(componentId, {
            status: finalStatus,
            actionType: actionType,
            // decisionReport is implicitly carried forward from SCHEDULED_ACTION
        });
    }
}

export const governanceStateRegistry = new GovernanceStateRegistry();