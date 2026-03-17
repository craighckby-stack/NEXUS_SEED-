/**
 * Component Obsolescence Review Engine (CORE) - src/governance/obsolescenceReviewEngine.js
 * ID: CORE v94.1 (Autonomous Refactor: Intelligence & Safety)
 * Role: Integrity Maintenance / Governance
 *
 * CORE initiates and governs component lifecycle actions (deprecation/retirement).
 * It leverages the specialized Trust Calculus Engine (TCE) for high-stakes decision
 * scoring based on dependency stability and long-term complexity reduction metrics.
 * Decoupled execution trigger via ComponentLifecycleActuator (CLA).
 */

import { policyEngine } from '../core/policyEngine.js';
import { auditLogger } from '../core/decisionAuditLogger.js';
import { retirementMetricsService } from './retirementMetricsService.js';
import { trustCalculusEngine } from './trustCalculusEngine.js';
import { lifecycleActuator } from './componentLifecycleActuator.js';
import { governanceStateRegistry } from './governanceStateRegistry.js'; // NEW: Essential for idempotency and state tracking

// --- Constants ---
const POLICY_ID_DEPRECATION = 'C-15';
const RETIREMENT_ACTION_TYPE = 'RETIREMENT';
const GOVERNANCE_THRESHOLD_KEY = 'obs_risk_tolerance';

export class ObsolescenceReviewEngine {
    // Private fields for enhanced encapsulation and state management
    #retirementThreshold = 0.85; 

    constructor() {
        // Runtime validation to ensure core dependencies are loaded (v94 robustness)
        if (!trustCalculusEngine || !policyEngine || !governanceStateRegistry) {
            throw new Error("CORE initialization failure: Required governance dependencies are missing.");
        }
    }

    /**
     * Initializes the engine, ensuring required configurations are loaded.
     */
    async init() {
        try {
            // 1. Load System Threshold
            const configuredThreshold = policyEngine.getSystemConfiguration(GOVERNANCE_THRESHOLD_KEY);
            if (typeof configuredThreshold === 'number' && configuredThreshold >= 0 && configuredThreshold <= 1) {
                this.#retirementThreshold = configuredThreshold;
            }
            
            // 2. Initialize Dependencies (e.g., configuring TCE context)
            await trustCalculusEngine.init('RETIREMENT_CALCULUS');
            
            // 3. Log Success
            auditLogger.logSystemInfo('CORE_INIT', { 
                version: 'v94.1_Refactored', 
                requiredThreshold: this.#retirementThreshold 
            });

        } catch (error) {
            auditLogger.logFatalError('CORE_INIT_FAIL', { detail: 'Configuration or Dependency initialization failed.', error: error.message });
            throw error; // Propagate severe initialization failure
        }
    }

    /**
     * Executes the synchronous pre-flight check based on immediate policy constraints 
     * and checks governance state to prevent double execution.
     * @param {string} componentId
     * @returns {{pass: boolean, reason?: string, skipExecution?: boolean}}
     */
    #runPreflightCheck(componentId) {
        if (!componentId) {
            const reason = 'Component ID required for review.';
            auditLogger.logError('CORE_REVIEW_INPUT_FAIL', { message: reason });
            return { pass: false, reason };
        }

        // Intelligence Check 1: Idempotency safety
        if (governanceStateRegistry.isComponentRetired(componentId) || governanceStateRegistry.isComponentPending(componentId, RETIREMENT_ACTION_TYPE)) {
             const reason = `Component is already scheduled for or is currently in ${RETIREMENT_ACTION_TYPE} status. Skipping review.`;
             auditLogger.logDecision('CORE_RETIREMENT_PREFLIGHT_SKIP', { componentId, reason });
             return { pass: false, reason, skipExecution: true };
        }

        // Policy Constraint Check 2
        if (!policyEngine.checkPolicy(componentId, POLICY_ID_DEPRECATION)) {
            const reason = `Policy constraint violation (${POLICY_ID_DEPRECATION}). Deprecation not permitted.`;
            auditLogger.logDecision('CORE_RETIREMENT_PREFLIGHT_FAIL', { componentId, reason });
            return { pass: false, reason };
        }

        return { pass: true };
    }

    /**
     * Calculates the Trust Calculus Score using the external engine.
     * @param {string} componentId
     * @param {object} metricData
     * @returns {Promise<number>} Score (0.0 to 1.0)
     */
    async #calculateRetirementScore(componentId, metricData) {
        // Delegate complex calculation to the specialized engine
        return trustCalculusEngine.calculateScore('RETIREMENT_CALCULUS', metricData);
    }

    /**
     * Internal governance function to adjudicate the decision based on score, constraints, and external signals.
     * @param {string} componentId
     * @param {number} retirementScore
     * @param {object} metricData
     * @returns {object} The full decision report.
     */
    #adjudicateDecision(componentId, retirementScore, metricData) {
        const requiredThreshold = this.#retirementThreshold;
        const globalVeto = policyEngine.getGlobalVetoSignal(); // High-level, immediate veto check
        
        let pass = (retirementScore >= requiredThreshold) && (!globalVeto);
        let failureReason = '';

        if (globalVeto) {
            pass = false;
            failureReason = 'Policy mandated global veto is currently active.';
        } else if (retirementScore < requiredThreshold) {
            failureReason = `Trust score (${retirementScore.toFixed(4)}) is below required threshold (${requiredThreshold.toFixed(4)}).`;
        }

        const report = {
            pass: pass,
            componentId: componentId,
            score: retirementScore,
            requiredThreshold: requiredThreshold,
            metricsUsed: metricData,
            vetoActive: globalVeto,
            action: RETIREMENT_ACTION_TYPE,
            reason: pass ? 'Governance thresholds met and no veto issued.' : failureReason
        };

        if (pass) {
            auditLogger.logDecision('CORE_RETIREMENT_PASS', report);
        } else {
            auditLogger.logDecision('CORE_RETIREMENT_FAIL', report);
        }

        return report;
    }

    /**
     * Triggers a comprehensive review of a component, handling lifecycle state transition safety.
     * @param {string} componentId - ID of the component under review.
     * @returns {Promise<object>} The final decision report.
     */
    async reviewComponentForRetirement(componentId) {
        let finalReport = { pass: false, componentId };

        try {
            // 1. Synchronous Pre-flight Check
            const preflight = this.#runPreflightCheck(componentId);
            if (!preflight.pass) {
                return preflight; // Returns immediate reason/skip if preflight fails
            }
            
            // Set state to PENDING_REVIEW immediately after preflight
            governanceStateRegistry.registerPendingReview(componentId, RETIREMENT_ACTION_TYPE);

            // 2. Data Acquisition (Async)
            const metricData = await retirementMetricsService.getComponentMetrics(componentId);
            
            // 3. Score Calculation (Async, delegated)
            const retirementScore = await this.#calculateRetirementScore(componentId, metricData);
            
            // 4. Adjudication & Governance Veto (Sync)
            finalReport = this.#adjudicateDecision(componentId, retirementScore, metricData);
            
            // 5. Execution Trigger & State Persistence
            if (finalReport.pass) {
                // Register the action as SCHEDULED before actual execution trigger
                governanceStateRegistry.registerActionScheduled(componentId, finalReport);
                this.#executeRetirementProcedure(componentId, finalReport); 
            } else {
                // If adjudication fails, clear the temporary PENDING state.
                governanceStateRegistry.clearPendingReview(componentId, RETIREMENT_ACTION_TYPE);
            }

            return finalReport;

        } catch (error) {
            // Critical failure handling during review pipeline
            auditLogger.logError('CORE_REVIEW_CRITICAL_FAIL', { componentId, error: error.message, stack: error.stack });
            // Attempt to clean up pending state regardless of error type
            governanceStateRegistry.clearPendingReview(componentId, RETIREMENT_ACTION_TYPE);
            return { 
                pass: false, 
                componentId, 
                reason: `Critical system failure during review pipeline: ${error.message}` 
            };
        }
    }
    
    /**
     * Delegates the non-reversible action to the Actuator (non-blocking trigger).
     */
    async #executeRetirementProcedure(componentId, report) {
        auditLogger.logExecution('CORE_ACTUATION_TRIGGER', { componentId, score: report.score, target: 'CLA', status: 'SCHEDULED' });
        // Delegation for execution and final state mutation (ACTUATOR handles the rest)
        lifecycleActuator.retireComponent(componentId, report);
    }
}

// Export a singleton instance
export const CORE = new ObsolescenceReviewEngine();
