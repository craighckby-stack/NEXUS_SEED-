/**
 * Configuration schema for the Governance Health Monitor (GHM).
 * Defines specific thresholds and weights for critical OGT components, decoupling these parameters from monitoring code.
 */
module.exports = {
    // Global Settings
    globalLatencyThresholdMs: 450, 

    // Standard Governance Readiness Signal (GRS) requirement for GSEP Stage 3
    minimumGRSThreshold: 0.88, 

    // Component-Specific Overrides and Weights
    // The weights allow critical components (higher value) to have a larger impact on the final GRS.
    components: {
        mcraEngine: {
            weight: 3.0, 
            // Requires fast response
            latencyThresholdMs: 250 
        },
        atmSystem: {
            weight: 2.0, 
            latencyThresholdMs: 500
        },
        policyEngine: {
            weight: 1.5, 
            latencyThresholdMs: 600
        },
        auditLogger: {
            weight: 0.5, 
            latencyThresholdMs: 1000 
        }
    }
};