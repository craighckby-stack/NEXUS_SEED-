/**
 * AGI-KERNEL Governance Model Refinement Kernel (GMREK) V1.0
 * Replaces synchronous GovernanceModelRefinementEngine.
 *
 * The GMREK ensures that the GSEP and P-01 protocols remain optimized and resilient.
 * It is the only component permitted to autonomously generate M-01 Intents targeting the governance layer.
 */
class GovernanceModelRefinementKernel {
    /**
     * @param {IMaturityMetricDeriverToolKernel} metricsDeriver - Provides D-01 derived performance metrics (P-01 Pass/Fail frequency, latency).
     * @param {IStructuralEntropyAnalysisToolKernel} structuralEntropyAnalyzer - Provides SEA/FBA reports (Architectural debt/entropy score).
     * @param {IGovernanceRefinementConfigRegistryKernel} configRegistry - Provides adaptive thresholds for refinement triggers.
     * @param {IMutationIntentFactoryToolKernel} intentFactory - Utility for generating standardized M-01 Intents.
     * @param {ILoggerToolKernel} logger - Auditable logging tool.
     */
    constructor(
        metricsDeriver,
        structuralEntropyAnalyzer,
        configRegistry,
        intentFactory,
        logger
    ) {
        // All dependencies are injected high-integrity Tool Kernels.
        this.metricsDeriver = metricsDeriver;
        this.entropyAnalyzer = structuralEntropyAnalyzer;
        this.configRegistry = configRegistry;
        this.intentFactory = intentFactory;
        this.logger = logger;
        this.config = null; // Stored asynchronously during initialization
    }

    /**
     * Asynchronously initializes the kernel, loading necessary configuration thresholds.
     * Must be called before executeRefinementCycle.
     */
    async initialize() {
        this.logger.audit('GMREK: Initializing configuration and dependencies.');
        try {
            // Asynchronously fetch mandatory configuration from registry
            const fullConfig = await this.configRegistry.getRefinementThresholds();
            if (!fullConfig || !fullConfig.thresholds) {
                // Critical configuration failure, using structured logging conceptId.
                throw new Error("Configuration integrity failure: GMRE thresholds are missing or invalid.");
            }
            this.config = fullConfig;
        } catch (e) {
            this.logger.error('GMREK Initialization failed.', { error: e.message, conceptId: 'GOV_E_GMRE_001' });
            // Re-throw standardized error for pipeline handling
            throw new Error(`GMREK initialization failure: ${e.message}`);
        }
    }

    /**
     * Executes the autonomous refinement cycle based on observed metrics.
     * @returns {Promise<object|null>} An M-01 Intent package or null.
     */
    async executeRefinementCycle() {
        if (!this.config) {
            throw new Error("GMREK not initialized. Call initialize() first.");
        }
        this.logger.info('GMREK: Starting refinement cycle check.', { conceptId: 'GMRE_C_001' });

        // 1. Retrieve asynchronous metrics and structural data
        const failureMetrics = await this.metricsDeriver.getGovernanceFailureMetrics();
        const latencyMetrics = await this.metricsDeriver.getGovernanceLatencyMetrics();
        const entropyScore = await this.entropyAnalyzer.getStructuralEntropyScore();

        // 2. Check Triggers
        let intent = await this._checkVetoIncidence(failureMetrics, entropyScore);
        if (intent) {
            this.logger.warn('GMREK: Veto incidence trigger detected.', { conceptId: 'GMRE_T_001' });
            return intent;
        }

        intent = await this._checkLatencyBottlenecks(latencyMetrics, entropyScore);
        if (intent) {
            this.logger.warn('GMREK: Latency bottleneck trigger detected.', { conceptId: 'GMRE_T_002' });
            return intent;
        }

        this.logger.info('GMREK: No refinement needed based on current state.', { conceptId: 'GMRE_C_004' });
        return null;
    }

    async _checkVetoIncidence(metrics, entropyScore) {
        const thresholds = this.config.thresholds;
        const VETO_THRESHOLD = thresholds.P01_Veto_Max;
        const HIGH_ENTROPY_MODIFIER = 1.15; 

        if (metrics.P01_S03_Vetoes > VETO_THRESHOLD) {
            const urgency = metrics.P01_S03_Vetoes * 10;
            // Use entropy to prioritize fixes where policy failure is linked to structural debt
            const priority = entropyScore > 0.6 ? urgency * HIGH_ENTROPY_MODIFIER : urgency;

            // Use formal IMutationIntentFactoryToolKernel for M-01 creation
            return await this.intentFactory.createMutationIntent({
                target: 'GOVERNANCE_LAYER_CONFIG',
                type: 'POLICY_REFINEMENT',
                conceptId: 'C-15',
                description: `High S-03 veto incidence (${metrics.P01_S03_Vetoes.toFixed(3)}). SEA Score: ${entropyScore.toFixed(2)}`,
                priority: Math.min(0.99, priority),
                payload: { action: 'Suggest_Policy_Adjustment', details: 'Review VetoTriggerEvaluationKernel rules.' }
            });
        }
        return null;
    }

    async _checkLatencyBottlenecks(metrics, entropyScore) {
        const thresholds = this.config.thresholds;
        const LATENCY_THRESHOLD = thresholds.Stage3_Latency_Max;

        if (metrics.Stage3_Latency > LATENCY_THRESHOLD) {
            const priorityBase = 0.85;
            const correlationWeight = thresholds.SEA_Latency_Correlation_Weight;
            // Higher entropy score pushes priority higher, suggesting structural fixes are intertwined with performance.
            const priority = priorityBase + (entropyScore * correlationWeight);

            // Use formal IMutationIntentFactoryToolKernel for M-01 creation
            return await this.intentFactory.createMutationIntent({
                target: 'GOVERNANCE_LAYER_EXECUTION',
                type: 'PERFORMANCE_OPTIMIZATION',
                conceptId: 'ATM/C-11',
                description: `Stage 3 latency (${metrics.Stage3_Latency}ms) consistently exceeding threshold. Requires integration review.`,
                priority: Math.min(0.98, priority),
                payload: { action: 'Suggest_Component_Review', details: 'Investigate TransportLatencyPolicyKernel.' }
            });
        }
        return null;
    }
}

module.exports = GovernanceModelRefinementKernel;