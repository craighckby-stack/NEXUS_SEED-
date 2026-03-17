const GOVERNANCE_LEVELS = {
    C13: 3, // Highest: Strategic Decision Making
    SEA: 2, // Moderate: Tuning Weights
    FBA: 2,
    DEFAULT: 1 // Lowest: Read-Only Access
};

/**
 * Component ID: CGP
 * Configuration Governance Policy (CGP)
 * 
 * Responsibility: Central gatekeeper for the SCR. Validates configuration change requests (set operations) 
 * based on component privilege and checks for excessive parameter deviation before persisting.
 */
class ConfigurationGovernancePolicy {

    /**
     * @param {object} logger The centralized system logging utility (usually SystemLog).
     * @param {object} scr Reference to the SystemConfigurationRegistry (SCR) for current value lookup.
     */
    constructor(logger, scr) {
        if (!logger || !scr) {
            throw new Error("CGP Initialization Error: Logger and SCR references are mandatory.");
        }
        this.logger = logger;
        this.scr = scr;
    }

    /**
     * Validates a request to change a configuration parameter.
     * @param {string} path Configuration path (e.g., 'SEA.WEIGHTS.COUPLING_FACTOR')
     * @param {*} newValue The proposed new value
     * @param {Object} context Access context (must include componentId)
     * @returns {boolean} True if the change is permissible.
     */
    validateChange(path, newValue, context) {
        // Context Check
        if (!context || !context.componentId) {
            this.logger.error(`[CGP] Access Denied: Missing component context for change request on ${path}.`);
            return false;
        }

        // 1. Authentication/Authorization Check
        // Standardizing requirement to C13 for dynamic changes.
        const requiredLevel = GOVERNANCE_LEVELS.C13;
        const currentLevel = GOVERNANCE_LEVELS[context.componentId] || GOVERNANCE_LEVELS.DEFAULT;

        if (currentLevel < requiredLevel) {
            this.logger.error(`[CGP] Access Denied: ${context.componentId} (Level ${currentLevel}) attempted modification of ${path}, requires Level ${requiredLevel}.`);
            return false;
        }

        const currentValue = this.scr.get(path); 
        
        // 2. Integrity Check: Deviation Monitoring (Crucial for learning models)
        if (typeof currentValue === 'number' && typeof newValue === 'number') {
            // Assumes GOVERNANCE_CONFIG.MAX_CHANGE_DEVIATION is accessible via SCR
            const maxDeviation = this.scr.get('GOVERNANCE_CONFIG.MAX_CHANGE_DEVIATION'); 
            
            if (maxDeviation === undefined || maxDeviation === null) {
                // If max deviation isn't defined, skip this critical check, but log a warning.
                this.logger.warn(`[CGP] Deviation check skipped for ${path}: MAX_CHANGE_DEVIATION not configured in SCR.`);
            } else {
                const deviation = Math.abs((newValue - currentValue) / currentValue);

                if (deviation > maxDeviation) {
                    this.logger.critical(`[CGP] CHANGE REJECTED: ${path} deviation (${deviation.toFixed(2)}) exceeds maximum allowed (${maxDeviation}). Prevented self-correction instability.`);
                    return false; 
                }
            }
        }
        
        this.logger.log(`[CGP] Configuration change approved for ${path}: ${currentValue} -> ${newValue} by ${context.componentId}.`);
        return true;
    }
}

/**
 * Exports the Configuration Governance Policy for integration.
 * UNIFIER Protocol Compliance: Module export for easy integration.
 */
module.exports = ConfigurationGovernancePolicy;