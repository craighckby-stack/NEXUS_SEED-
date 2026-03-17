/**
 * Helper function mirroring the WeightedScorerUtility plugin logic.
 * This function encapsulates the reusable weighted sum calculation.
 * @param {Array<{ value: number, weight: number }>} inputs 
 * @returns {number}
 */
const calculateWeightedScore = (inputs) => {
    return inputs.reduce((sum, item) => {
        const value = item.value || 0;
        const weight = item.weight || 0;
        return sum + (value * weight);
    }, 0);
};

const SEA_CONSTANTS = {
    WEIGHTS: {
        COUPLING_FACTOR: 0.45, // Slightly prioritizing connectivity strain
        COMPLEXITY_STRAIN: 0.30, 
        GOVERNANCE_OVERHEAD: 0.25
    },
    THRESHOLDS: {
        WARNING: 0.60,
        CRITICAL: 0.85 
    },
    MANDATE_PRIORITY: 9 
};

/**
 * Component ID: SEA
 * Systemic Entropy Auditor (SEA)
 * 
 * Responsibility: Monitors system complexity and architectural debt post-mutation (Stage 5).
 * It calculates the Entropy Debt Index (EDI) and automatically injects mandatory
 * simplification or refactoring proposals into the Strategic Cache (C-13) upon critical violation.
 */

class SystemicEntropyAuditor {
    constructor(metricsService, strategicCache, configService = SEA_CONSTANTS) {
        this.metrics = metricsService; 
        this.cache = strategicCache;
        // Allows for dynamic weight/threshold injection via an external config service
        this.config = configService; 
    }

    /**
     * Normalizes inputs and calculates the Entropy Debt Index (EDI).
     * EDI focuses on persistent architectural strain across key dimensions.
     * Uses the extracted calculateWeightedScore utility (WeightedScorerUtility).
     * 
     * @param {Object} postMutationMetrics Normalized architectural metrics (e.g., couplingFactor, complexityStrain, overheadStrain).
     * @returns {number} EDI Score (0=Low Debt, 1=Critical Debt).
     */
    calculateEntropyDebt(postMutationMetrics) {
        const W = this.config.WEIGHTS; 
        
        // Prepare inputs
        const complexityStrain = postMutationMetrics.cyclomaticComplexityStrain || postMutationMetrics.lineIncrease || 0;
        const couplingFactor = postMutationMetrics.couplingFactor || 0;
        const governanceOverheadStrain = postMutationMetrics.governanceOverheadStrain || 0;

        // Structure data for the WeightedScorerUtility (delegation)
        const inputs = [
            { value: couplingFactor, weight: W.COUPLING_FACTOR },
            { value: complexityStrain, weight: W.COMPLEXITY_STRAIN },
            { value: governanceOverheadStrain, weight: W.GOVERNANCE_OVERHEAD }
        ];
        
        // Delegate calculation to the reusable scoring logic
        return calculateWeightedScore(inputs);
    }

    /**
     * Classifies the EDI into actionable categories (OK, WARNING, CRITICAL).
     * @param {number} edi The calculated Entropy Debt Index.
     * @returns {string} Severity level.
     */
    classifyDebtSeverity(edi) {
        const T = this.config.THRESHOLDS;
        if (edi >= T.CRITICAL) {
            return 'CRITICAL';
        }
        if (edi >= T.WARNING) {
            return 'WARNING';
        }
        return 'OK';
    }

    /**
     * Executes the audit cycle, calculates EDI, classifies debt, and mandates maintenance if critical.
     * @param {Object} postMutationMetrics FBA collected data, must include standardized metrics.
     * @returns {{success: boolean, edi: number, severity: string}} Audit results.
     */
    executeAuditCycle(postMutationMetrics) {
        const edi = this.calculateEntropyDebt(postMutationMetrics);
        const severity = this.classifyDebtSeverity(edi);
        let actionMandated = false;

        if (severity === 'CRITICAL') {
            this.proposeMandatoryMaintenance(edi, postMutationMetrics);
            actionMandated = true;
        } else if (severity === 'WARNING') {
             // Log Warning, but do not mandate intervention unless instructed by C-13 policy
             this.metrics.logOperationalEvent('SEA_WARNING_DEBT', { edi: edi.toFixed(4) });
        }

        return { success: actionMandated, edi, severity };
    }

    /**
     * Generates a detailed maintenance goal and submits it to the Strategic Cache (C-13).
     * @param {number} edi The resulting EDI score.
     * @param {Object} contributingMetrics Metrics causing the spike.
     */
    proposeMandatoryMaintenance(edi, contributingMetrics) {
        
        // Log detailed detection data for trace audit using the dedicated metrics service
        this.metrics.logOperationalEvent('SEA_CRITICAL_DEBT', {
            edi: edi.toFixed(4),
            trigger: this.config.THRESHOLDS.CRITICAL,
            factors: contributingMetrics
        });

        const mandatoryGoal = {
            id: `MAINTENANCE-SEA-${Date.now()}`,
            mandate: 'Architectural Debt Remediation',
            scope: this.generateMaintenanceScope(contributingMetrics),
            priority: this.config.MANDATE_PRIORITY, 
            source: 'SEA',
            context: { edi: edi.toFixed(4) }
        };
        
        this.cache.submitMandatoryIntent(mandatoryGoal);
        console.warn(`[SEA v94.1] CRITICAL DEBT DETECTED (${edi.toFixed(2)}). Mandating corrective architectural simplification.`);
    }

    /**
     * Helper to dynamically generate a detailed scope based on the highest contributing factors.
     */
    generateMaintenanceScope(metrics) {
        const W = this.config.WEIGHTS;
        const factors = {
            'High Coupling Factor': (metrics.couplingFactor || 0) * W.COUPLING_FACTOR,
            'Complexity/Size Strain': (metrics.cyclomaticComplexityStrain || metrics.lineIncrease || 0) * W.COMPLEXITY_STRAIN,
            'Governance Overburden': (metrics.governanceOverheadStrain || 0) * W.GOVERNANCE_OVERHEAD
        };

        // Identify the factor contributing the most normalized weighted value
        const topFactor = Object.keys(factors).reduce((a, b) => factors[a] > factors[b] ? a : b);
        
        return `Targeted debt remediation focusing primarily on '${topFactor}'. Driven by Coupling Factor: ${(metrics.couplingFactor || 0).toFixed(2)}, Complexity Strain: ${(metrics.cyclomaticComplexityStrain || metrics.lineIncrease || 0).toFixed(2)}.`;
    }
}

module.exports = SystemicEntropyAuditor;