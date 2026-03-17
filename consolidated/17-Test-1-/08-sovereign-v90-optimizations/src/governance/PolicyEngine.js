/**
 * PolicyEngineKernel.js
 * Purpose: Interprets the RCDM ruleset and applies dynamic scoring/enforcement logic.
 * Refactored for modularity, explicit asynchronous configuration handling, and kernel architecture compliance.
 */

// NOTE: Assume AbstractKernel is imported from the core framework.
// import { AbstractKernel } from '@agi-core/kernel';

// Conceptual Interfaces (must be injected):
// interface IGovernanceSettingsRegistryKernel { getConfiguration(key: 'rcdm'): Promise<any>; }
// interface IWeightedScoreAccumulatorToolKernel { execute(proposalScores: Record<string, number>, weightingMatrix: Record<string, number>): Promise<{ score: number }>; }
// interface ILoggerToolKernel { error(message: string, context?: any): void; info(message: string, context?: any): void; }


class PolicyEngineKernel { // Extends AbstractKernel conceptually
    // Injected Dependencies
    private settingsRegistry: any; // IGovernanceSettingsRegistryKernel
    private scoreAccumulator: any; // IWeightedScoreAccumulatorToolKernel
    private logger: any; // ILoggerToolKernel

    // Runtime Configuration (loaded asynchronously)
    private rulesets: any;
    private phases: any;
    private weightingMatrix: Record<string, number>;
    private defaultThreshold: number;

    /**
     * @param {Object} dependencies - Must contain settingsRegistry, scoreAccumulator, logger.
     * Constructor only performs assignment, deferring validation and configuration loading.
     */
    constructor(dependencies: {
        settingsRegistry: any; // IGovernanceSettingsRegistryKernel
        scoreAccumulator: any; // IWeightedScoreAccumulatorToolKernel
        logger: any; // ILoggerToolKernel
    }) {
        // Assignment of injected dependencies
        this.settingsRegistry = dependencies.settingsRegistry;
        this.scoreAccumulator = dependencies.scoreAccumulator;
        this.logger = dependencies.logger;
        
        // Initialize internal state to safe defaults
        this.rulesets = null;
        this.phases = null;
        this.weightingMatrix = {};
        this.defaultThreshold = 0.5; 
    }

    // --- Kernel Lifecycle Methods ---

    private setupDependencies(): void {
        // Strict synchronous dependency validation
        if (!this.settingsRegistry || typeof this.settingsRegistry.getConfiguration !== 'function') {
            throw new Error("[PolicyEngineKernel] Dependency 'settingsRegistry' (IGovernanceSettingsRegistryKernel) is required.");
        }
        if (!this.scoreAccumulator || typeof this.scoreAccumulator.execute !== 'function') {
            throw new Error("[PolicyEngineKernel] Dependency 'scoreAccumulator' (IWeightedScoreAccumulatorToolKernel) is required.");
        }
        if (!this.logger) {
            throw new Error("[PolicyEngineKernel] Dependency 'logger' (ILoggerToolKernel) is required.");
        }
    }
    
    public async initialize(): Promise<void> {
        this.setupDependencies();

        this.logger.info("[PolicyEngineKernel] Initializing and loading RCDM configuration.", { source: 'PolicyEngineKernel' });
        
        try {
            // Asynchronously retrieve the RCDM configuration using the registry kernel
            const rcdmConfig = await this.settingsRegistry.getConfiguration('rcdm');
            
            if (!rcdmConfig || !rcdmConfig.rulesets || !rcdmConfig.phases) {
                this.logger.error("RCDM configuration loaded but is invalid (missing rulesets or phases).");
                throw new Error("[PolicyEngineKernel] Invalid RCDM configuration received.");
            }
            
            // Localize configuration data
            this.rulesets = rcdmConfig.rulesets;
            this.phases = rcdmConfig.phases;
            this.weightingMatrix = rcdmConfig.weighting_matrix || {};
            this.defaultThreshold = (rcdmConfig.config && rcdmConfig.config.default_threshold_pct) || 0.5;

            this.logger.info("[PolicyEngineKernel] RCDM configuration loaded successfully.");

        } catch (error) {
            this.logger.error("[PolicyEngineKernel] Failed to load RCDM configuration during initialization.", { error });
            throw error; // Propagate failure
        }
    }
    
    // --- Core Logic Methods (Now Asynchronous) ---

    /**
     * Determines the operational phase based on context.
     */
    public async getCurrentPhase(context: any): Promise<any> {
        if (!this.phases) {
             throw new Error("Kernel state error: Phases not loaded. Call initialize() first.");
        }

        const phaseId = context.current_task_type || 'evolution';
        const phase = this.phases[phaseId];
        
        if (!phase) {
             this.logger.info(`Phase '${phaseId}' not found in RCDM. Falling back to 'evolution' phase.`);
             return this.phases.evolution || { ruleset_id: 'default_fallback' }; 
        }
        return phase;
    }

    /**
     * Executes the evaluation based on the 'weighted_consensus' ruleset type.
     */
    private async _evaluateWeightedConsensus(phase: any, context: any, proposalScoreMap: Record<string, number>): Promise<{ decision: boolean, finalScore?: number, reason?: string }> {
        if (!this.rulesets) {
            return { decision: false, reason: 'Engine rulesets not loaded.' };
        }
        
        const ruleset = this.rulesets[phase.ruleset_id];
        
        if (!ruleset) {
             this.logger.error(`Ruleset ID '${phase.ruleset_id}' referenced by phase not found.`, { phaseId: phase.id });
             return { decision: false, reason: `Referenced Ruleset missing: ${phase.ruleset_id}` };
        }

        // Use the ruleset's specific threshold, falling back to engine default
        const threshold = ruleset.threshold || this.defaultThreshold;

        // ASYNCHRONOUS TOOL CALL INTEGRATION: Offload score calculation
        const { score: finalScore } = await this.scoreAccumulator.execute(
            proposalScoreMap, 
            this.weightingMatrix
        );
        
        // Dynamic Adjustment Logic (Mitigation Trigger)
        if (finalScore < threshold) {
            // Check if dynamic override is enabled for the phase and risk is high (e.g., >= 0.8)
            if (phase.dynamic_adjustment && context.risk_score >= 0.8) {
                this.logger.info("Weighted consensus failed, triggering mitigation signal due to high risk.", { 
                    finalScore, 
                    threshold, 
                    riskScore: context.risk_score 
                });
                
                // Signal external governance loop to trigger mitigation or ruleset change
                return { 
                    decision: false, 
                    finalScore: finalScore,
                    reason: 'Weighted consensus failed below high-risk threshold. Mitigation required.' 
                }; 
            }
        }

        return { 
            decision: finalScore >= threshold, 
            finalScore: finalScore 
        };
    }
    
    /**
     * Placeholder for future ruleset types.
     */
    private async _evaluateMetricCompliance(phase: any, context: any, proposalScoreMap: Record<string, number>): Promise<{ decision: boolean, reason: string }> {
        this.logger.info("Attempted evaluation using unimplemented ruleset type: metric_compliance.");
        return { decision: false, reason: 'Metric compliance ruleset type not yet implemented.' };
    }

    /**
     * Main entry point for proposal evaluation.
     * @returns {Promise<{decision: boolean, finalScore?: number, reason?: string}>}
     */
    public async evaluateProposal(context: any, proposalScoreMap: Record<string, number>): Promise<{decision: boolean, finalScore?: number, reason?: string}> {
        if (!this.rulesets) {
            this.logger.error("Attempted evaluation before PolicyEngineKernel was successfully initialized.");
            return { decision: false, reason: 'Engine not initialized.' };
        }

        const phase = await this.getCurrentPhase(context);
        const rulesetId = phase.ruleset_id;
        const ruleset = this.rulesets[rulesetId];

        if (!ruleset) {
            this.logger.error(`Ruleset '${rulesetId}' not found or improperly configured.`);
            return { decision: false, reason: `Ruleset '${rulesetId}' not found or improperly configured.` };
        }
        
        switch (ruleset.type) {
            case 'weighted_consensus':
                return this._evaluateWeightedConsensus(phase, context, proposalScoreMap);
                
            case 'metric_compliance':
                return this._evaluateMetricCompliance(phase, context, proposalScoreMap);
                
            default:
                this.logger.error(`Unknown ruleset type encountered: ${ruleset.type}`);
                return { decision: false, reason: `Unknown ruleset type: ${ruleset.type}` };
        }
    }
}

module.exports = PolicyEngineKernel;