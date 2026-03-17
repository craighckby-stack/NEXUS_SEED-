/**
 * F-01: Failure State Analysis Kernel (FSAK)
 * 
 * Purpose: Processes governance failures (P-01 Trust Calculus and M-02 R-INDEX)
 * to generate structured, auditable refinement mandates. Adheres strictly to
 * declarative policies retrieved from the Governance Mitigation Schema Registry.
 */

import { ILoggerToolKernel } from '@AGI/tools/ILoggerToolKernel';
import { IGovernanceConstantsV2ConfigRegistryKernel } from '@AGI/registries/IGovernanceConstantsV2ConfigRegistryKernel';
import { IGovernanceMitigationSchemaRegistryKernel } from '@AGI/registries/IGovernanceMitigationSchemaRegistryKernel';

// Assumed Tool Kernel for complex metric analysis, replacing the synchronous MetricsSystem.diagnoseScoreDeficiency
interface ITrustDeficitAnalysisToolKernel {
    // Must be asynchronous and reliable for high-integrity governance
    diagnoseScoreDeficiency(trustWeightings: any): Promise<{ majorDeficiencyComponent: string | null }>;
}

// === TYPE DEFINITIONS (Internalized and Refined) ===

interface MandateAction {
    type: string;
    [key: string]: any;
}

interface FailureReport {
    stage: string;
    reason: any; // TrustCalculusReason | RIndexReason
    payloadHash: string;
}

interface Mandate {
    targetProposal: string;
    requiredActions: MandateAction[];
    refinementMandates: string[];
    newRIndexTarget: number;
}

class FailureStateAnalysisKernel {
    private logger: ILoggerToolKernel;
    private constantsRegistry: IGovernanceConstantsV2ConfigRegistryKernel;
    private mitigationRegistry: IGovernanceMitigationSchemaRegistryKernel;
    private analysisTool: ITrustDeficitAnalysisToolKernel;

    // Cached constants loaded during initialize()
    private FAILURE_STAGES: Record<string, string> = {};
    private MANDATE_ACTION_TYPES: Record<string, string> = {};
    private defaultTarget: number = 0;
    private vetoTarget: number = 0;

    constructor(
        logger: ILoggerToolKernel,
        constantsRegistry: IGovernanceConstantsV2ConfigRegistryKernel,
        mitigationRegistry: IGovernanceMitigationSchemaRegistryKernel,
        analysisTool: ITrustDeficitAnalysisToolKernel
    ) {
        // Dependencies are injected, enforcing high-integrity architecture.
        this.logger = logger;
        this.constantsRegistry = constantsRegistry;
        this.mitigationRegistry = mitigationRegistry;
        this.analysisTool = analysisTool;
    }

    /**
     * Initializes the kernel, loading critical constants and targets asynchronously.
     */
    public async initialize(): Promise<void> {
        // Load required constants using the Registry Kernel (replaces synchronous import)
        const constantIds = IGovernanceConstantsV2ConfigRegistryKernel.CONCEPT_IDS;

        this.FAILURE_STAGES = await this.constantsRegistry.get(constantIds.FAILURE_STAGES);
        this.MANDATE_ACTION_TYPES = await this.constantsRegistry.get(constantIds.MANDATE_ACTION_TYPES);
        
        const targets = await this.constantsRegistry.get(constantIds.GOV_TARGETS);
        this.defaultTarget = targets.DEFAULT_R_INDEX_TARGET;
        this.vetoTarget = targets.VETO_RETRY_TARGET;

        await this.logger.logInfo('FSAK_INIT', { message: 'Failure State Analysis Kernel initialized successfully.' });
    }

    // Renamed and formalized logging using ILoggerToolKernel
    private async _logMandate(mandate: Mandate): Promise<void> {
        await this.logger.logEvent('GOV_MANDATE_GENERATED', {
            conceptId: 'GOV_M_001',
            targetProposal: mandate.targetProposal,
            actionsCount: mandate.requiredActions.length,
            newRIndexTarget: mandate.newRIndexTarget
        });
    }
    
    /**
     * Helper to create structured, validated mandate actions.
     */
    private _createMandateAction(type: string, data: Record<string, any> = {}): MandateAction {
        if (!Object.values(this.MANDATE_ACTION_TYPES).includes(type)) {
            this.logger.logWarning('FSAE_INVALID_ACTION_TYPE', { attemptedType: type });
            type = this.MANDATE_ACTION_TYPES.UNKNOWN_ACTION;
        }
        return { type, ...data };
    }

    /**
     * Uses the declarative Mitigation Registry to determine mandated actions and injects
     * dynamic runtime data.
     */
    private async _getMandateFromPolicy(stage: string, reasonKey: string, runtimeData: Record<string, any> = {}): Promise<{ actions: MandateAction[], newTarget: number }> {
        // Mitigation Registry replaces the synchronous RemediationMap lookup
        const policy = await this.mitigationRegistry.getRemediationPolicy(stage, reasonKey);
        
        if (!policy || !policy.actions) {
            await this.logger.logWarning('FSAE_MISSING_POLICY', { stage, reasonKey });
            return {
                actions: [{
                    type: this.MANDATE_ACTION_TYPES.MANUAL_REVIEW,
                    reason: `Policy mapping missing for [${stage}]:[${reasonKey}]`
                }],
                newTarget: this.defaultTarget
            };
        }

        const actions = policy.actions.map(action => {
            const mandatedData = { ...action.data };
            
            // --- Runtime Data Injection & Dynamic Parameter Calculation ---
            if (action.type === this.MANDATE_ACTION_TYPES.INCREASE_COVERAGE) {
                const baseIncrease = mandatedData.baseIncrease || 10;
                const gapMultiplier = mandatedData.gapMultiplier || 1.0;
                
                if (runtimeData.scoreGap !== undefined && typeof runtimeData.scoreGap === 'number') {
                    mandatedData.requiredCoverageDelta = Math.max(
                        baseIncrease, 
                        // Ensure calculation results in an integer delta
                        Math.ceil(runtimeData.scoreGap * 100 * gapMultiplier)
                    );
                }
                mandatedData.component = runtimeData.component || mandatedData.component || 'GLOBAL';
            }
            
            if (action.type === this.MANDATE_ACTION_TYPES.STABILITY_FOCUS && runtimeData.failedComponents) {
                mandatedData.components = runtimeData.failedComponents;
            }

            return this._createMandateAction(action.type, mandatedData);
        });

        const newTarget = policy.newTarget !== undefined ? policy.newTarget : this.defaultTarget;

        return { actions, newTarget };
    }

    public async analyze(failureReport: FailureReport): Promise<Mandate> {
        const { stage, reason, payloadHash } = failureReport;

        let mandate: Mandate = {
            targetProposal: payloadHash,
            requiredActions: [], 
            refinementMandates: [], 
            newRIndexTarget: this.defaultTarget
        };

        if (stage === this.FAILURE_STAGES.P01_TRUST_CALCULUS) {
            await this._analyzeTrustCalculusFailure(reason, mandate);
        } else if (stage === this.FAILURE_STAGES.M02_R_INDEX_READINESS) {
            await this._analyzeRIndexFailure(reason, mandate);
        } else {
            mandate.refinementMandates.push('UNCATEGORIZED FAILURE: Input stage unknown. Policy review required.');
            
            const uncategorizedPolicy = await this._getMandateFromPolicy(stage, 'UNCATEGORIZED');
            mandate.requiredActions = uncategorizedPolicy.actions;
            mandate.newRIndexTarget = uncategorizedPolicy.newTarget;
        }

        await this._logMandate(mandate);
        return mandate;
    }

    /**
     * Handles failures stemming from insufficient Trust Calculus (P-01) scores.
     */
    private async _analyzeTrustCalculusFailure(reason: any, mandate: Mandate): Promise<void> {
        const { vetoState, requiredConfidence, actualScore, trustWeightings } = reason;

        // 1. Veto Handling (CRITICAL BLOCK)
        if (vetoState === true) {
            mandate.refinementMandates.push(`POLICY VIOLATION: Vetoed by ${reason.vetoSource}.`);
            
            const vetoPolicy = await this._getMandateFromPolicy(
                this.FAILURE_STAGES.P01_TRUST_CALCULUS, 
                'VETOED', 
                { source: reason.vetoSource }
            );

            mandate.requiredActions = vetoPolicy.actions;
            mandate.newRIndexTarget = this.vetoTarget; // Veto always defaults to the critical veto target
            return;
        } 
        
        // 2. Trust Deficit Analysis
        const scoreGap = requiredConfidence - actualScore;
        
        if (scoreGap > 0) {
            // Asynchronous delegation to specialized analysis tool
            const analysis = await this.analysisTool.diagnoseScoreDeficiency(trustWeightings);
            const component = analysis.majorDeficiencyComponent;

            let reasonKey: string;
            
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
            const deficitPolicy = await this._getMandateFromPolicy(
                this.FAILURE_STAGES.P01_TRUST_CALCULUS,
                reasonKey,
                { scoreGap, component, requiredConfidence }
            );

            mandate.requiredActions = deficitPolicy.actions;
            mandate.newRIndexTarget = deficitPolicy.newTarget;

        } else {
             // Fallback for unexpected Trust Calculus failure modes (e.g., secondary constraints)
             mandate.refinementMandates.push('Trust Calculus failed, but no clear score deficit found. Investigate secondary constraints.');
             const genericPolicy = await this._getMandateFromPolicy(this.FAILURE_STAGES.P01_TRUST_CALCULUS, 'SECONDARY_CONSTRAINT_FAILURE');
             mandate.requiredActions = genericPolicy.actions;
             mandate.newRIndexTarget = genericPolicy.newTarget;
        }
    }

    /**
     * Handles failures stemming from M-02 (R-INDEX) readiness checks.
     */
    private async _analyzeRIndexFailure(reason: any, mandate: Mandate): Promise<void> {
        const { missingRequirements, failedChecks } = reason; // Example R-Index reason structure

        let reasonKey: string;

        if (missingRequirements && missingRequirements.length > 0) {
            reasonKey = 'R_INDEX_REQUIREMENTS_MISSING';
            mandate.refinementMandates.push(`R-Index requirements missing: ${missingRequirements.join(', ')}`);
        } else if (failedChecks && failedChecks.length > 0) {
            reasonKey = 'R_INDEX_CHECKS_FAILED';
            mandate.refinementMandates.push(`R-Index checks failed: ${failedChecks.join(', ')}`);
        } else {
             reasonKey = 'UNKNOWN_R_INDEX_FAILURE';
             mandate.refinementMandates.push('Unknown M-02 R-Index readiness failure.');
        }

        const rIndexPolicy = await this._getMandateFromPolicy(
            this.FAILURE_STAGES.M02_R_INDEX_READINESS,
            reasonKey,
            { missingRequirements, failedChecks }
        );

        mandate.requiredActions = rIndexPolicy.actions;
        mandate.newRIndexTarget = rIndexPolicy.newTarget;
    }
}