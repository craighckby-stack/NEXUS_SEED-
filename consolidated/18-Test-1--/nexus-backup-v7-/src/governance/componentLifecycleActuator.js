/**
 * Component Lifecycle Actuator (CLA) - src/governance/componentLifecycleActuator.js
 * ID: CLA v95.0 - Refactored for Transactional Integrity and SRP
 * Role: Execution Trigger / Controlled Side Effects (Orchestrator)
 *
 * CLA handles the non-reversible system modifications authorized by CORE,
 * focusing on controlled, staged deprecation or retirement via external managers.
 */

import { auditLogger } from '../core/decisionAuditLogger.js';
import { moduleStateManager } from '../runtime/moduleStateManager.js';
// Replaced direct dependencyRegistry access with a dedicated router service to enforce SRP
import { dependencyRouterService } from '../runtime/dependencyRouterService.js'; 

const ACTUATOR_CONTEXT = 'LIFECYCLE_ACTUATION';

// Define explicit state constants for clear process flow tracking
const LIFECYCLE_STATES = {
    STAGED_RETIREMENT: 'STAGED_RETIREMENT',
    DEPENDENCY_REROUTING: 'DEPENDENCY_REROUTING',
    FINAL_UNLOAD: 'FINAL_UNLOAD',
    COMPLETE: 'RETIREMENT_COMPLETE',
    FAILED: 'FAILED_RETIREMENT'
};

class ComponentLifecycleActuator {
    
    /**
     * Executes the mandated retirement process based on the CORE report.
     * This process is synchronous in orchestration but manages async stages.
     * @param {string} componentId - The target component.
     * @param {object} report - The full decision report from CORE.
     * @returns {Promise<{success: boolean, message: string, finalStatus: string}>}
     */
    async retireComponent(componentId, report) {
        let currentStatus = LIFECYCLE_STATES.STAGED_RETIREMENT;
        auditLogger.logExecution('CLA_RETIREMENT_INIT', { componentId, score: report.score, targetStatus: currentStatus });

        try {
            // 1. Mark component status in system registry (Transactional Start)
            await moduleStateManager.markComponentStatus(componentId, LIFECYCLE_STATES.STAGED_RETIREMENT);
            auditLogger.logExecution('CLA_STATUS_MARKER', { componentId, status: LIFECYCLE_STATES.STAGED_RETIREMENT });

            // 2. Initiate robust dependency cleanup/re-routing
            currentStatus = LIFECYCLE_STATES.DEPENDENCY_REROUTING;
            const rerouteResult = await this._routeDependencies(componentId);

            if (!rerouteResult.success) {
                // Dependency Router failed to achieve a safe state for removal
                throw new Error(`Dependency rerouting failed: ${rerouteResult.reason}`);
            }

            // 3. Final removal/unloading command
            currentStatus = LIFECYCLE_STATES.FINAL_UNLOAD;
            await moduleStateManager.unloadComponent(componentId);
            
            // 4. Final state logging and status update
            currentStatus = LIFECYCLE_STATES.COMPLETE;
            await moduleStateManager.markComponentStatus(componentId, currentStatus); // Record finality
            
            auditLogger.logExecution('CLA_RETIREMENT_COMPLETE', { 
                componentId, 
                result: 'Success', 
                score: report.score 
            });
            
            return { 
                success: true, 
                message: `Component ${componentId} successfully retired.`,
                finalStatus: currentStatus
            };

        } catch (error) {
            
            const failedStatus = LIFECYCLE_STATES.FAILED;
            
            // Transactional Rollback Attempt: Log failure and attempt to update state manager
            auditLogger.logError('CLA_RETIREMENT_FAIL', { 
                componentId, 
                error: error.message,
                failingStep: currentStatus // Log which stage failed
            });
            
            // Attempt to mark failure status (crucial for manual/automated intervention)
            await moduleStateManager.markComponentStatus(componentId, failedStatus)
                .catch(rollbackError => {
                    auditLogger.logError('CLA_ROLLBACK_FAIL', { 
                        componentId, 
                        originalError: error.message,
                        rollbackError: rollbackError.message 
                    });
                });

            return { 
                success: false, 
                message: `Retirement process failed during ${currentStatus}: ${error.message}`,
                finalStatus: failedStatus 
            };
        }
    }

    /**
     * Delegates dependency rerouting logic to the specialized router service.
     * @param {string} componentId
     * @returns {Promise<{success: boolean, reason?: string}>}
     */
    async _routeDependencies(componentId) {
        // Use the dedicated router service for transactional dependency updates.
        return dependencyRouterService.rerouteConsumers(componentId);
    }
}

export const lifecycleActuator = new ComponentLifecycleActuator();