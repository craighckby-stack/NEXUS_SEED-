/**
 * P-01 Trust Calculus Schema & Definition (TC-SCHEMA)
 * ID: TC-SCHEMA
 * Role: Defines immutable standards, weighting, and metric factors.
 * 
 * Optimized for maximum initialization efficiency using a single-pass validation IIFE.
 */

// --- Constants and Types ---

/** @typedef {1 | -1} TrustPolarityValue - 1: Positive, -1: Negative */

export const TRUST_POLARITY = Object.freeze(/** @type {{POSITIVE: TrustPolarityValue, NEGATIVE: TrustPolarityValue}} */ ({
    POSITIVE: 1, // Higher Metric -> Higher Trust Score (Direct Correlation)
    NEGATIVE: -1, // Higher Metric -> Lower Trust Score (Inverse Correlation)
}));

const P = TRUST_POLARITY.POSITIVE;
const N = TRUST_POLARITY.NEGATIVE;
const WEIGHT_TOLERANCE = 1e-9; // Floating point precision threshold


/**
 * Uses an Immediately Invoked Function Expression (IIFE) to define, validate,
 * and freeze the schema in a single, efficient pass during module load.
 * This guarantees purity, immutability, and fails fast if configuration is invalid.
 */
const { TRUST_METRICS_SCHEMA, METRIC_NAMES } = (() => {
    // 1. Schema Definition (Declarative Source of Truth)
    const definition = {
        redundancyScore: {
            weight: 0.40,
            polarity: P,
            description: "Reflects fallback safety net availability (resilience metric)."
        },
        criticalDependencyExposure: {
            weight: 0.35,
            polarity: N,
            description: "Reflects direct risk impact from potential failure cascade."
        },
        usageRate: {
            weight: 0.15,
            polarity: N,
            description: "Reflects current component necessity (Inverted: Lower usage increases retirement safety margin)."
        },
        complexityReductionEstimate: {
            weight: 0.10,
            polarity: P,
            description: "Reflects technical debt reduction value upon retirement/removal."
        }
    };

    const keys = Object.keys(definition);
    let totalWeight = 0;

    // 2. Validation Phase (Single Iteration for Sum and Polarity Checks)
    for (const key of keys) {
        const item = definition[key];
        totalWeight += item.weight;

        if (item.polarity !== P && item.polarity !== N) {
             throw new Error(`[TC-SCHEMA ERROR] Invalid polarity value for metric '${key}': ${item.polarity}`);
        }
    }
    
    // Check Total Weight (Abstraction of numerical validation)
    if (Math.abs(totalWeight - 1.0) > WEIGHT_TOLERANCE) {
        throw new Error(
            `[TC-SCHEMA ERROR] Initialization Failure: Metric weights must sum exactly to 1.0. Current sum: ${totalWeight}`
        );
    }
    
    // 3. Immutability Phase
    return {
        TRUST_METRICS_SCHEMA: Object.freeze(definition),
        METRIC_NAMES: Object.freeze(keys) // Ensure metric names array is also immutable
    };
})();

export { TRUST_METRICS_SCHEMA, METRIC_NAMES };