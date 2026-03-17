/**
 * Component Governance State Registry - src/governance/governanceStateRegistry.js
 * ID: GSR v94.3 (Refactored for Dependency Injection and Robustness)
 * Role: State Persistence / Transactional Safety
 *
 * Maintains the current governance lifecycle status of all components, ensuring idempotency,
 * sequential execution, and providing an authoritative source of truth.
 *
 * Refactor Note: This class is now infrastructure-agnostic, requiring explicit injection of
 * a Persistence Adapter and an Audit Service, drastically improving testability and scalability.
 */

// --- Constants ---
export const COMPONENT_STATUS = {
    ACTIVE: 'ACTIVE',
    PENDING_REVIEW: 'PENDING_REVIEW', 
    SCHEDULED_ACTION: 'SCHEDULED_ACTION', 
    RETIRED: 'RETIRED',
    BLOCKED: 'BLOCKED' 
};

/**
 * @typedef {Object} ComponentState
 * @property {string} status - Current status from COMPONENT_STATUS.
 * @property {string | null} [actionType] - Type of pending or scheduled action (e.g., 'DEPRECATION', 'RETIREMENT').
 * @property {number} timestamp - Last transition time (Epoch ms).
 * @property {Object | null} [decisionReport] - Full report/metadata justifying the current state transition.
 */

const DEFAULT_STATE = { status: COMPONENT_STATUS.ACTIVE, timestamp: 0, actionType: null, decisionReport: null };

// --- Infrastructure / Default Adapters (In-Module Instantiation Only) ---

/**
 * Implements a simple in-memory key-value persistence adapter for the Registry.
 * Mimics the expected interface of a DurablePersistenceAdapter (e.g., Redis/DB).
 */
class MemoryPersistenceAdapter {
    constructor() {
        this.store = new Map();
    }

    get(key) {
        // Returns state object or undefined
        return this.store.get(key);
    }

    set(key, value) {
        this.store.set(key, value);
        return value;
    }
}

/**
 * Placeholder for the dedicated Governance Audit Service (Proposed Scaffold).
 */
class PlaceholderAuditService {
    logTransition(id, previous, next) {
        // console.log(`[AUDIT] Transition for ${id}: ${previous.status} -> ${next.status}`);
        // Actual implementation would persist this log to a centralized audit trail.
    }
}


// --- Main Registry Class ---

class GovernanceStateRegistry {

    /**
     * @param {MemoryPersistenceAdapter | Object} persistenceAdapter - Adapter implementing get(id) and set(id, state).
     * @param {PlaceholderAuditService | Object} auditService - Service implementing logTransition.
     */
    constructor(persistenceAdapter, auditService) {
        if (!persistenceAdapter || !auditService) {
            throw new Error("GovernanceStateRegistry requires a Persistence Adapter and an Audit Service.");
        }
        this.persistence = persistenceAdapter;
        this.audit = auditService;
    }

    /**
     * Internal Helper for handling state transitions, audit logging, and consistency.
     * @param {string} componentId
     * @param {Partial<ComponentState>} newStateData
     */
    _updateState(componentId, newStateData) {
        const currentState = this.getStatus(componentId);
        
        // 1. Calculate next state, overwriting properties only if defined in newStateData
        const nextState = {
            ...currentState,
            ...newStateData,
            timestamp: Date.now(),
            // Explicitly ensuring state keys are present, defaulting to null/undefined if intended to be cleared.
            actionType: newStateData.actionType !== undefined ? newStateData.actionType : (currentState.actionType || null),
            decisionReport: newStateData.decisionReport !== undefined ? newStateData.decisionReport : (currentState.decisionReport || null)
        };

        // 2. Critical audit logging hook
        this.audit.logTransition(componentId, currentState, nextState);
        
        // 3. Persist new state
        return this.persistence.set(componentId, nextState);
    }

    /**
     * Retrieves the current, standardized state object for a component.
     * Ensures a consistent return type (ComponentState).
     * @param {string} componentId
     * @returns {ComponentState}
     */
    getStatus(componentId) {
        const state = this.persistence.get(componentId);
        
        if (!state) {
             // Return a newly constructed default active state if component is not yet registered
             return { ...DEFAULT_STATE, timestamp: Date.now() };
        }

        // Ensure backward compatibility/schema consistency if persistence layer returns partial data
        return { ...DEFAULT_STATE, ...state }; 
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
     * @param {string | null} [actionType] - Optional, check for a specific type of action.
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
    registerPendingReview(componentId, actionType, decisionReport = null) {
        if (this.isComponentInProcess(componentId)) {
            throw new Error(`Component ${componentId} is already in governance process. Status: ${this.getStatus(componentId).status}`);
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
     * This explicitly clears actionType and decisionReport.
     */
    clearPendingState(componentId) {
        const current = this.getStatus(componentId);
        
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
     */
    registerActionScheduled(componentId, actionReport) {
        const currentStatus = this.getStatus(componentId).status;
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
     */
    registerActionFinalized(componentId, finalStatus = COMPONENT_STATUS.RETIRED, actionType = 'GOVERNANCE_ACTION') {
        
        // If retiring, clear previous pending metadata but keep the final status report if provided in a later action.
        return this._updateState(componentId, {
            status: finalStatus,
            actionType: actionType,
            // decisionReport carries over if the state was SCHEDULED_ACTION
        });
    }

    /**
     * Marks a component as blocked due to failure or veto, preventing automated action.
     */
    registerBlockedState(componentId, reasonReport = {}) {
         return this._updateState(componentId, {
            status: COMPONENT_STATUS.BLOCKED,
            actionType: 'BLOCK_VETO',
            decisionReport: reasonReport
        });
    }
}

// Instantiate the Singleton using local/default implementations
const defaultPersistence = new MemoryPersistenceAdapter();
const defaultAudit = new PlaceholderAuditService();

export const governanceStateRegistry = new GovernanceStateRegistry(defaultPersistence, defaultAudit);

// Export the Class for alternative initialization or testing purposes
export { GovernanceStateRegistry };
