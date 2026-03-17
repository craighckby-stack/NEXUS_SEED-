/**
 * GOVERNANCE CONFIGURATION: P-01 Trust Calculus Metric Definitions
 * Defines the comprehensive parameters for normalizing and weighting raw metrics 
 * provided by the Retirement Metrics Service (RMS) before inputting into 
 * the CORE Trust Calculus Adjudication engine.
 * 
 * The normalized value (Nv) is calculated using the configured strategy, applied to the raw metric (Rv).
 * Trust Score Contribution (TSC) = Nv * weight * (influence === 'negative' ? -1 : 1).
 * 
 * STRUCTURE: { metric_name: { weight: Number, category: String, influence: ('positive'|'negative'), normalization: { strategy: String, bounds?: [Number, Number] }, description: String } }
 */

/** @typedef {'SAFETY'|'RISK'|'OVERHEAD'|'USAGE'} GovernanceCategory */
/** @typedef {'positive'|'negative'} InfluenceDirection */
/** @typedef {'linear_minmax' | 'logarithmic' | 'percentile_rank' | 'constant'} NormalizationStrategy */

export const GOVERNANCE_CATEGORIES = {
    SAFETY: "Metrics promoting component stability and high confidence in retention.",
    RISK: "Metrics indicating potential downstream failure or exposure.",
    OVERHEAD: "Metrics related to system maintenance burden and resource drain.",
    USAGE: "Metrics tied directly to component adoption and operational activity rates."
};

export const METRIC_CONFIGURATIONS = {
    
    // 1. SAFETY FACTORS (High metric value is generally positive)
    SUBSIDIARY_REDUNDANCY_SCORE: {
        weight: 1.5,
        category: 'SAFETY',
        influence: 'positive',
        normalization: { 
            strategy: 'linear_minmax', 
            bounds: [0, 5] // Expected raw score range
        },
        description: "Confidence derived from having robust substitutes or alternatives. Higher score is better."
    },

    // 2. RISK FACTORS (High metric value is generally negative)
    CRITICAL_DEPENDENCY_EXPOSURE: {
        weight: 2.0, 
        category: 'RISK',
        influence: 'negative',
        normalization: { 
            strategy: 'logarithmic',
        }, // Log scaling handles outliers in dependency counts
        description: "Critical risk based on the severity and breadth of downstream reliance. Higher count is worse."
    },
    
    // 3. OVERHEAD FACTORS 
    COMPONENT_COMPLEXITY_SCORE: {
        weight: 1.2,
        category: 'OVERHEAD',
        influence: 'negative', // Higher complexity score leads to negative Trust
        normalization: {
            strategy: 'percentile_rank', // Compare against peer components
        },
        description: "Measures inherent code complexity. High complexity increases retirement viability (negative influence)."
    },
    MAINTENANCE_BURDEN_INDEX: {
        weight: 1.0,
        category: 'OVERHEAD',
        influence: 'negative', 
        normalization: { 
            strategy: 'linear_minmax',
            bounds: [0, 500] // Hours per quarter
        },
        description: "Index tracking accumulated resource hours spent on mandatory component upkeep."
    },
    
    // 4. USAGE ADJUSTMENT FACTORS
    DAILY_USAGE_RATE: {
        weight: 1.8,
        category: 'USAGE',
        influence: 'positive', // Standard interpretation: Higher usage is positive for retention
        normalization: { 
            strategy: 'linear_minmax',
            bounds: [0, 1000000]
        }, 
        description: "Raw metric of daily transaction/call volume. Normalized to penalize values below critical threshold via non-linear mapping in preprocessor."
    }
};

/**
 * Legacy/Flat Export: Provided for immediate compatibility with systems 
 * expecting a simple key-value weight map (RMS/CORE input pre-v94 integration).
 */
export const METRIC_WEIGHTS = Object.entries(METRIC_CONFIGURATIONS).reduce((acc, [key, value]) => {
    acc[key] = value.weight;
    return acc;
}, {});
