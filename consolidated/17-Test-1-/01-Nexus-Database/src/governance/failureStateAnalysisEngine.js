/**
 * F-01: Failure State Analysis Engine (FSAE)
 * 
 * Purpose: Processes P-01 (Trust Calculus) failures and M-02 (R-INDEX) rejections
 * to generate specific, measurable, and machine-readable refinement mandates. 
 * Prevents inefficient cycling of low-integrity proposals by strictly adhering
 * to defined, declarative governance action policies.
 */

const {
    FAILURE_STAGES,
    MANDATE_ACTION_TYPES,
    GOV_TARGETS
} = require('./governanceConstants'); // G-C01 Integration

class FailureStateAnalysisEngine {
    constructor(policyEngine, metricsSystem) {
        // Renamed internally for clarity and context, mapping to standard acronyms
        this.policyEngine = policyEngine; // C15 Policy Engine
        this.metricsSystem = metricsSystem; // ATM Telemetry and Metrics System
        
        // The engine now depends entirely on this declarative map for action derivation
        // enforcing external governance over hardcoded logic.
        this.RemediationMap = this.policyEngine.getFailureRemediationMap();
        
        // Cache targets locally for quick access
        this.defaultTarget = GOV_TARGETS.DEFAULT_R_INDEX_TARGET;
        this.vetoTarget = GOV_TARGETS.VETO_RETRY_TARGET;
    }

    /**
     * Helper to create structured, validated mandate actions.
     */
    _createMandateAction(type, data = {}) {
        if (!Object.values(MANDATE_ACTION_TYPES).includes(type)) {
            this.metricsSystem.logWarning('FSAE_INVALID_ACTION_TYPE', { attemptedType: type });
            type = MANDATE_ACTION_TYPES.UNKNOWN_ACTION;
        }
        return { type, ...data };
    }

    /**
     * Uses the declarative RemediationMap to determine mandated actions and injects
     * dynamic runtime data (e.g., score deficits, failed components) into policy actions.
     */
    _getMandateFromPolicy(stage, reasonKey, runtimeData = {}) {
        const policy = this.RemediationMap.getRemediation(stage, reasonKey);
        
        if (!policy || !policy.actions) {
            // Fallback for uncategorized or missing policy entries
            return [{
                type: MANDATE_ACTION_TYPES.MANUAL_REVIEW,
                reason: `Policy mapping missing for [${stage}]:[${reasonKey}]`
            }];
        }

        return policy.actions.map(action => {
            const mandatedData = { ...action.data };
            
            // --- Runtime Data Injection & Dynamic Parameter Calculation ---
            if (action.type === MANDATE_ACTION_TYPES.INCREASE_COVERAGE) {
                // Use policy defined multipliers and minimums to calculate the required delta
                const baseIncrease = mandatedData.baseIncrease || 10;
                const gapMultiplier = mandatedData.gapMultiplier || 1.0;
                
                if (runtimeData.scoreGap !== undefined) {
                    mandatedData.requiredCoverageDelta = Math.max(
                        baseIncrease, 
                        Math.ceil(runtimeData.scoreGap * 100 * gapMultiplier)
                    );
                }
                mandatedData.component = runtimeData.component || mandatedData.component || 'GLOBAL';
            }
            
            if (action.type === MANDATE_ACTION_TYPES.STABILITY_FOCUS && runtimeData.failedComponents) {
                mandatedData.components = runtimeData.failedComponents;
            }

            return this._createMandateAction(action.type, mandatedData);
        });
    }

    analyze(failureReport) {
        const { stage, reason, payloadHash } = failureReport;

        let mandate = {
            targetProposal: payloadHash,
            requiredActions: [], 
            refinementMandates: [], 
            newRIndexTarget: this.defaultTarget
        };

        switch (stage) {
            case FAILURE_STAGES.P01_TRUST_CALCULUS:
                this._analyzeTrustCalculusFailure(reason, mandate);
                break;
            case FAILURE_STAGES.M02_R_INDEX_READINESS:
                this._analyzeRIndexFailure(reason, mandate);
                break;
            default:
                mandate.refinementMandates.push('UNCATEGORIZED FAILURE: Input stage unknown. Policy review required.');
                mandate.requiredActions = this._getMandateFromPolicy(stage, 'UNCATEGORIZED');
        }

        this.logMandate(mandate);
        return mandate;
    }

    /**
     * Handles failures stemming from insufficient Trust Calculus (P-01) scores.
     * Now maps runtime state to declarative policy keys.
     */
    _analyzeTrustCalculusFailure(reason, mandate) {
        const { vetoState, requiredConfidence, actualScore, trustWeightings } = reason;

        // 1. Veto Handling (CRITICAL BLOCK)
        if (vetoState === true) {
            mandate.refinementMandates.push(`POLICY VIOLATION: Vetoed.`);
            mandate.requiredActions = this._getMandateFromPolicy(
                FAILURE_STAGES.P01_TRUST_CALCULUS, 
                'VETOED', 
                { source: reason.vetoSource }
            );
            mandate.newRIndexTarget = this.vetoTarget;
            return;
        } 
        
        // 2. Trust Deficit Analysis
        const scoreGap = requiredConfidence - actualScore;
        
        if (scoreGap > 0) {
            const analysis = this.metricsSystem.diagnoseScoreDeficiency(trustWeightings);
            const component = analysis.majorDeficiencyComponent;

            let reasonKey;
            
            // Define policy lookup keys based on severity and source targeting
            if (scoreGap >= 0.10) { 
                 reasonKey = 'MAJOR_TRUST_DEFICIT';
            } else if (component) {
                 reasonKey = 'TARGETED_TRUST_DEFICIT';
            } else {
                 reasonKey = 'GENERAL_DEFICIT';
            }

            mandate.refinementMandates.push(`TRUST DEFICIT (${scoreGap.toFixed(4)}). Failure Type: ${reasonKey}.`);

            // Fetch dynamic actions and targets based on calculated reasonKey
            mandate.requiredActions = this._getMandateFromPolicy(
                FAILURE_STAGES.P01_TRUST_CALCULUS,
                reasonKey,
                { scoreGap, component, requiredConfidence }
            );
            
            const deficitPolicy = this.RemediationMap.getRemediation(FAILURE_STAGES.P01_TRUST_CALCULUS, reasonKey);
            // Use policy target or calculate fallback target
            mandate.newRIndexTarget = deficitPolicy.newTarget || Math.min(1.0, requiredConfidence + scoreGap * 0.15);
        }
    }

    /**
     * Handles failures stemming from low Readiness Index (M-02) checks.
     * Now maps runtime state to declarative policy keys.
     */
    _analyzeRIndexFailure(reason, mandate) {
        const { failedComponents } = reason;

        const reasonKey = failedComponents && failedComponents.length > 0 
            ? 'COMPONENT_INSTABILITY' 
            : 'GENERAL_INSTABILITY';

        mandate.refinementMandates.push(`LOW READINESS INDEX: Failure type: ${reasonKey}.`);
        
        mandate.requiredActions = this._getMandateFromPolicy(
            FAILURE_STAGES.M02_R_INDEX_READINESS,
            reasonKey,
            { failedComponents }
        );

        const stabilityPolicy = this.RemediationMap.getRemediation(FAILURE_STAGES.M02_R_INDEX_READINESS, reasonKey);
        // Use policy target or fallback target
        mandate.newRIndexTarget = stabilityPolicy.newTarget || (this.defaultTarget + 0.10);
    }

    logMandate(mandate) {
        // D-01 Audit Logger integration utilizing ATM
        this.metricsSystem.logEvent('FSAE_MANDATE_ISSUED', {
            target: mandate.targetProposal,
            actionsCount: mandate.requiredActions.length,
            newTarget: mandate.newRIndexTarget
        });
    }
}

module.exports = FailureStateAnalysisEngine;