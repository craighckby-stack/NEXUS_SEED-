/**
 * GOVERNANCE CONFIGURATION: P-01 Trust Calculus Metric Definitions
 * Defines the comprehensive parameters for normalizing and weighting raw metrics 
 * provided by the Retirement Metrics Service (RMS) before inputting into 
 * the CORE Trust Calculus Adjudication engine.
 * 
 * STRUCTURE: { metric_name: { weight: Number, category: String, influence: ('positive'|'negative'), description: String } }
 * This structure enables programmatic interpretation of metric impact direction.
 */

export const GOVERNANCE_CATEGORIES = {
    SAFETY: "Metrics promoting component stability and high confidence in retention.",
    RISK: "Metrics indicating potential downstream failure or exposure.",
    OVERHEAD: "Metrics related to system maintenance burden and resource drain.",
    USAGE: "Metrics tied directly to component adoption and operational activity rates."
};

export const METRIC_CONFIGURATIONS = {
    
    // 1. SAFETY FACTORS (High normalized metric value --> Positive contribution to Trust Score)
    REDUNDANCY: {
        weight: 1.5,
        category: 'SAFETY',
        influence: 'positive',
        description: "Confidence derived from having robust substitutes or alternatives."
    },

    // 2. RISK FACTORS (High normalized metric value --> Negative contribution to Trust Score)
    DEPENDENCY_EXPOSURE: {
        weight: 2.0, // Heavily weighted due to systemic risk potential
        category: 'RISK',
        influence: 'negative',
        description: "Critical risk based on the severity and breadth of downstream reliance."
    },
    
    // 3. OVERHEAD FACTORS 
    COMPLEXITY_REDUCTION: {
        weight: 1.2,
        category: 'OVERHEAD',
        influence: 'positive', // The BENEFIT of complexity reduction is sought
        description: "Weight applied to metrics indicating potential system simplification gains post-retirement."
    },
    MAINTENANCE_BURDEN_INDEX: {
        weight: 1.0,
        category: 'OVERHEAD',
        influence: 'negative', // High burden directly reduces Trust/Retention viability
        description: "Index tracking accumulated resource hours spent on mandatory component upkeep."
    },
    
    // 4. USAGE ADJUSTMENT FACTORS
    USAGE_RATE_PENALTY: {
        weight: 1.8,
        category: 'USAGE',
        influence: 'negative',
        description: "Strong penalty applied when component usage falls below critical thresholds, pushing retirement."
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