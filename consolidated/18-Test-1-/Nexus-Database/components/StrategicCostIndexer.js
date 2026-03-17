/**
 * CONTRACT: SCI (Strategic Cost Indexer)
 * PURPOSE: Calculates the Chronic Cost Index (C-01), a forward-looking scalar
 * quantification of potential long-term structural debt or required maintenance 
 * overhead induced by the proposed transition (SST).
 * 
 * INTEGRATION: Feeds VMO (L6) to influence the adaptive safety margin (epsilon),
 * ensuring high-debt proposals face a stricter finality gate.
 */

// --- Configuration Defaults ---
const DEFAULT_WEIGHTS = {
    'default': 1.0,
    'major_dependency_change': 1.8,
    'protocol_expansion': 0.7,
    'maintenance_patch': 0.3
};

const DEFAULT_SCALING = {
    // Multiplier for weighted complexity (Future Debt Potential)
    complexity_scale: 0.1, 
    // Multiplier for historical trend (Systemic Inertia)
    historical_debt_scale: 0.5,
    // Maximum clamp value
    max_c01: 10.0
};

class StrategicCostIndexer {
    constructor(SPDM, SST_Payload, CMO_Config = {}) {
        if (!SPDM || !SST_Payload) {
            throw new Error("SCI initialization failed: Requires SPDM and SST_Payload.");
        }

        this.SPDM = SPDM; 
        this.SST_Payload = SST_Payload;
        
        // Merge configuration with sensible defaults for tuning transparency
        this.config = {
            ...DEFAULT_SCALING,
            ...CMO_Config
        };
        
        this.cost_weight_vector = this._loadCostVectors(CMO_Config.SCI_Weights);
        // Factors storage for detailed auditing and transparency
        this.factors = {}; 
    }

    _loadCostVectors(weights) {
        // Allow CMO to override default cost vectors
        return {
            ...DEFAULT_WEIGHTS,
            ...(weights || {})
        };
    }

    /**
     * Breaks down inputs into traceable factors before scaling.
     * @private
     */
    _calculateRawFactors(proposal_type, complexity_score) {
        const weight = this.cost_weight_vector[proposal_type] || this.cost_weight_vector['default'];
        
        // 1. Complexity Factor (Input debt potential)
        const complexity_factor = complexity_score * weight;

        // 2. Historical Systemic Debt Trend Factor (Contextual debt risk)
        // Assumes SPDM returns a non-negative scalar.
        const historical_debt_modifier = this.SPDM.queryAverageStructuralDebt() || 0.0;

        // Store pre-scaled factors for diagnostics
        this.factors = {
            proposal_type,
            complexity_score,
            type_weight: weight,
            complexity_factor_raw: complexity_factor,
            historical_debt_trend: historical_debt_modifier
        };

        return { complexity_factor, historical_debt_modifier };
    }

    /**
     * Calculates C-01 (Chronic Cost Index)
     * @returns {number} Scalar index C-01 (Range 0.0 - Max_C01)
     */
    calculateC01() {
        const proposal_type = this.SST_Payload.type || 'default';
        // Ensure minimum complexity of 1 to prevent trivial results unless components_affected is explicitly 0
        const complexity_score = Math.max(0, this.SST_Payload.components_affected ?? 1); 

        const { complexity_factor, historical_debt_modifier } = 
            this._calculateRawFactors(proposal_type, complexity_score);
        
        // F1: Future Debt Potential scaled
        const F1 = complexity_factor * this.config.complexity_scale;
        
        // F2: Systemic Inertia Debt scaled
        const F2 = historical_debt_modifier * this.config.historical_debt_scale;

        const C01 = F1 + F2;

        // Store scaled factors for audit trail
        this.factors.scaled = { F1, F2 };

        // Clamp the scalar output based on configured maximum
        return Math.min(this.config.max_c01, Math.max(0.0, C01));
    }

    /**
     * Executes calculation and provides detailed context.
     */
    queryC01() {
        return {
            scalar: this.calculateC01(),
            id: 'C-01',
            factors: this.factors // Crucial for VMO debugging and model tuning
        };
    }
}

module.exports = { StrategicCostIndexer };