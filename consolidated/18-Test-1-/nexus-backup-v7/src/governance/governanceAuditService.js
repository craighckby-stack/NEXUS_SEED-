/**
 * Governance Audit Service - src/governance/governanceAuditService.js
 * ID: GAS v1.0
 * Role: Immutable Logging and Traceability
 *
 * Provides an interface for recording all critical state transitions, decisions, 
 * and execution outcomes within the governance lifecycle.
 * This service is essential for debugging, compliance, and rollback analysis.
 */

// NOTE: In a production system, this would interface with an append-only, durable store (e.g., specialized database table or log stream).
const auditLogStore = []; 

export class GovernanceAuditService {

    /**
     * Logs a state transition from a component registry.
     * @param {string} componentId
     * @param {Object} previousState
     * @param {Object} nextState
     */
    logTransition(componentId, previousState, nextState) {
        const logEntry = {
            timestamp: Date.now(),
            componentId: componentId,
            transitionId: `${componentId}-${Date.now()}`,
            previousStatus: previousState.status,
            nextStatus: nextState.status,
            metadata: { 
                actionType: nextState.actionType, 
                reportSnapshot: nextState.decisionReport || null
            }
        };
        
        // In-memory simulation of persistent append log
        auditLogStore.push(logEntry);
        
        // NOTE: Production implementation would use a robust logger/database write here.
        // console.log(`[AUDIT] Transition logged for ${componentId}: ${previousState.status} -> ${nextState.status}`);
    }

    /**
     * Retrieves the history of a specific component.
     */
    getHistory(componentId) {
        return auditLogStore.filter(entry => entry.componentId === componentId)
                            .sort((a, b) => a.timestamp - b.timestamp);
    }
}

export const governanceAuditService = new GovernanceAuditService();