/**
 * Component Obsolescence Review Kernel (CORE) - src/governance/obsolescenceReviewKernel.js
 * ID: CORE v95.0 (AIA Enforcement Layer Compliant)
 * Role: Integrity Maintenance / Governance
 *
 * CORE initiates and governs component lifecycle actions (deprecation/retirement) using
 * specialized, auditable, asynchronous Tool Kernels for all decision points and execution.
 * Ensures non-blocking execution and strict adherence to architectural mandates.
 */

// --- Constants ---
const RETIREMENT_ACTION_TYPE = 'RETIREMENT';
const GOVERNANCE_THRESHOLD_KEY = 'OBSOLESCENCE_RISK_TOLERANCE';
const OBSOLESCENCE_POLICY_RULE_ID = 'GOV_RULE_C15_DEPRECATION_PERMISSION';

// Dependencies are injected as asynchronous Tool Kernels

class ObsolescenceReviewKernel {
    #thresholdManager; // GovernanceThresholdManager
    #auditDisperser;   // MultiTargetAuditDisperserToolKernel
    #stateManager;     // ActiveStateContextManagerKernel
    #vetoEvaluator;    // VetoTriggerEvaluationKernel
    #metricExecutor;   // IExternalMetricExecutionToolKernel
    #policyEvaluator;  // IConceptualPolicyEvaluatorKernel
    #ruleEngine;       // IRuleEvaluationEngineToolKernel
    #lifecycleActuator; // ILifecycleActuatorToolKernel

    #retirementThreshold = 0.85; 

    constructor(
        thresholdManager,
        auditDisperser,
        stateManager,
        vetoEvaluator,
        metricExecutor,
        policyEvaluator,
        ruleEngine,
        lifecycleActuator
    ) {
        if (!thresholdManager || !auditDisperser || !stateManager || !policyEvaluator || !lifecycleActuator) {
             throw new Error("CORE Kernel initialization failure: Missing required Tool Kernel dependencies.");
        }

        this.#thresholdManager = thresholdManager;
        this.#auditDisperser = auditDisperser;
        this.#stateManager = stateManager;
        this.#vetoEvaluator = vetoEvaluator;
        this.#metricExecutor = metricExecutor;
        this.#policyEvaluator = policyEvaluator;
        this.#ruleEngine = ruleEngine;
        this.#lifecycleActuator = lifecycleActuator;

        Object.freeze(this);
    }

    /**
     * Initializes the kernel, ensuring required configurations are loaded asynchronously.
     */
    async initialize() {
        try {
            // 1. Load System Threshold asynchronously via dedicated Registry Kernel
            const configuredThreshold = await this.#thresholdManager.getGovernanceThreshold(GOVERNANCE_THRESHOLD_KEY);
            
            if (typeof configuredThreshold === 'number' && configuredThreshold >= 0 && configuredThreshold <= 1) {
                this.#retirementThreshold = configuredThreshold;
            }
            
            // 2. Log Success via auditable kernel
            await this.#auditDisperser.auditEvent('CORE_INIT', {
                level: 'INFO',
                details: {
                    requiredThreshold: this.#retirementThreshold,
                    status: 'Initialized successfully'
                }
            });

        } catch (error) {
            await this.#auditDisperser.auditEvent('CORE_INIT_FAIL', {
                level: 'FATAL',
                detail: 'Configuration or Dependency initialization failed.',
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Executes the asynchronous pre-flight check based on immediate policy constraints 
     * and checks governance state to prevent double execution.
     * @param {string} componentId
     * @returns {Promise<{pass: boolean, reason?: string, skipExecution?: boolean}>}
     */
    async #runPreflightCheck(componentId) {
        if (!componentId) {
            const reason = 'Component ID required for review.';
            await this.#auditDisperser.auditEvent('CORE_REVIEW_INPUT_FAIL', { componentId, reason, level: 'ERROR' });
            return { pass: false, reason };
        }

        // Intelligence Check 1: Idempotency safety using ActiveStateContextManagerKernel
        const isRetired = await this.#stateManager.isEntityInState(componentId, RETIREMENT_ACTION_TYPE, 'RETIRED');
        const isPending = await this.#stateManager.isEntityInState(componentId, RETIREMENT_ACTION_TYPE, 'PENDING');
        
        if (isRetired || isPending) {
             const reason = `Component is already scheduled for or is currently in ${RETIREMENT_ACTION_TYPE} status. Skipping review.`;
             await this.#auditDisperser.auditDecision('CORE_RETIREMENT_PREFLIGHT_SKIP', { componentId, reason });
             return { pass: false, reason, skipExecution: true };
        }

        // Policy Constraint Check 2: Asynchronously evaluate prerequisite rule
        const policyCheck = await this.#ruleEngine.evaluateRuleSet(OBSOLESCENCE_POLICY_RULE_ID, { componentId });

        if (policyCheck.outcome !== 'PASS') {
            const reason = `Policy constraint violation (${OBSOLESCENCE_POLICY_RULE_ID}). Deprecation not permitted. Outcome: ${policyCheck.outcome}`;
            await this.#auditDisperser.auditDecision('CORE_RETIREMENT_PREFLIGHT_FAIL', { componentId, reason });
            return { pass: false, reason };
        }

        return { pass: true };
    }

    /**
     * Calculates the Trust Calculus Score using the Conceptual Policy Evaluator Kernel.
     * @param {object} metricData
     * @returns {Promise<number>} Score (0.0 to 1.0)
     */
    async #calculateRetirementScore(metricData) {
        // Delegation to IConceptualPolicyEvaluatorKernel for R-Index derivation.
        const scoreReport = await this.#policyEvaluator.evaluateConceptualPolicy({
            policyContext: 'RETIREMENT_CALCULUS',
            inputData: metricData 
        });
        
        return scoreReport.R_Index_Normalized || 0.0; 
    }

    /**
     * Internal governance function to asynchronously adjudicate the decision based on score, 
     * threshold, and real-time veto signals.
     * @param {string} componentId
     * @param {number} retirementScore
     * @param {object} metricData
     * @returns {Promise<Readonly<object>>} The full decision report.
     */
    async #adjudicateDecision(componentId, retirementScore, metricData) {
        const requiredThreshold = this.#retirementThreshold;

        // 1. Check for Governance Veto using VetoTriggerEvaluationKernel
        const vetoCheck = await this.#vetoEvaluator.evaluateVetoTriggers(RETIREMENT_ACTION_TYPE, { componentId, score: retirementScore });
        const globalVeto = vetoCheck.vetoTriggered;
        
        let pass = false;
        let failureReason = '';

        if (globalVeto) {
            failureReason = `Global Veto triggered: ${vetoCheck.reason}`;
            pass = false;
        } else if (retirementScore >= requiredThreshold) {
            pass = true;
            failureReason = 'Threshold met or exceeded.';
        } else {
            failureReason = `Score (${retirementScore.toFixed(4)}) below required threshold (${requiredThreshold.toFixed(4)}).`;
            pass = false;
        }

        const report = {
            pass: pass,
            componentId: componentId,
            score: retirementScore,
            requiredThreshold: requiredThreshold,
            metricsUsed: metricData,
            vetoActive: globalVeto,
            action: RETIREMENT_ACTION_TYPE,
            reason: failureReason,
            vetoDetails: vetoCheck
        };

        if (pass) {
            await this.#auditDisperser.auditDecision('CORE_RETIREMENT_PASS', report);
        } else {
            await this.#auditDisperser.auditDecision('CORE_RETIREMENT_FAIL', report);
        }

        return Object.freeze(report);
    }

    /**
     * Triggers the final retirement execution procedure via the specialized Kernel.
     * @param {string} componentId 
     * @param {Readonly<object>} finalReport 
     */
    async #executeRetirementProcedure(componentId, finalReport) {
        // Delegation to the specialized, auditable ILifecycleActuatorToolKernel
        await this.#lifecycleActuator.initiateLifecycleAction(componentId, finalReport);
    }

    /**
     * Triggers a comprehensive review of a component, handling lifecycle state transition safety.
     * @param {string} componentId - ID of the component under review.
     * @returns {Promise<Readonly<object>>} The final decision report.
     */
    async reviewComponentForRetirement(componentId) {
        let finalReport = { pass: false, componentId, action: RETIREMENT_ACTION_TYPE };

        try {
            // 1. Asynchronous Pre-flight Check
            const preflight = await this.#runPreflightCheck(componentId);
            if (!preflight.pass) {
                return Object.freeze(preflight);
            }
            
            // Set state to PENDING_REVIEW (async)
            await this.#stateManager.registerEntityState(componentId, RETIREMENT_ACTION_TYPE, 'PENDING');

            // 2. Data Acquisition (Async, delegated)
            const metricData = await this.#metricExecutor.executeMetricProfile('OBSOLESCENCE_METRICS', componentId);
            
            // 3. Score Calculation (Async, delegated)
            const retirementScore = await this.#calculateRetirementScore(metricData);
            
            // 4. Adjudication & Governance Veto (Async)
            finalReport = await this.#adjudicateDecision(componentId, retirementScore, metricData);
            
            // 5. Execution Trigger & State Persistence
            if (finalReport.pass) {
                // Update state to reflect decision and schedule execution
                await this.#stateManager.registerEntityState(componentId, RETIREMENT_ACTION_TYPE, 'SCHEDULED', finalReport);
                await this.#executeRetirementProcedure(componentId, finalReport); 
            } else {
                // If adjudication fails, clear the temporary PENDING state.
                await this.#stateManager.clearEntityState(componentId, RETIREMENT_ACTION_TYPE, 'PENDING');
            }
            
            return finalReport;

        } catch (error) {
            // Ensure state is cleaned up upon failure before decision point
            await this.#stateManager.clearEntityState(componentId, RETIREMENT_ACTION_TYPE, 'PENDING');
            
            const errorReport = { 
                ...finalReport, 
                pass: false, 
                reason: `Fatal internal error during review: ${error.message}` 
            };
            
            await this.#auditDisperser.auditEvent('CORE_REVIEW_CRITICAL_FAIL', {
                componentId,
                error: error.message,
                stack: error.stack,
                level: 'CRITICAL'
            });
            return Object.freeze(errorReport);
        }
    }
}