/**
 * governanceConfig.js
 * Centralized configuration constants for the RCDM (Risk, Compliance, Debt, Management)
 * governance system, specifically focusing on Trust Matrix parameters.
 */
const GOVERNANCE_CONFIG = {
    // --- Trust Matrix Manager Configuration ---
    TRUST_MATRIX: {
        // Exponential Moving Average (EMA) baseline factor for trust updates (rewards/minor penalties)
        SMOOTHING_FACTOR: 0.15, 
        
        // Higher alpha factor used when an actor's performance metric drops significantly below 
        // their current trust score, enabling faster trust decay/punishment.
        PENALTY_BOOST: 0.30,     
        
        // Maximum persistence rate. How often the matrix is written to disk (in milliseconds).
        // This prevents excessive I/O during high-frequency recalculations.
        SAVE_DEBOUNCE_MS: 5000, 
        
        // Default initial trust score for a newly observed actor.
        INITIAL_TRUST_SCORE: 0.5 
    },

    // --- Policy Engine Configuration (Example Placeholder) ---
    POLICY_ENGINE: {
        CACHE_EXPIRY_MS: 60000,
        DEFAULT_ACTION_THRESHOLD: 0.25 
    }
};

module.exports = GOVERNANCE_CONFIG;