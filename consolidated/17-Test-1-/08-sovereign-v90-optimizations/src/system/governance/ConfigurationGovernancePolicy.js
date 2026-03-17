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
     * @param {SystemLog} logger The centralized system logging utility.
     * @param {SystemConfigurationRegistry} scr Reference to the SCR for current value lookup.
     * @param {RelativeChangeValidatorTool} relativeChangeValidator Instance of the deviation validator tool.
     */
    constructor(logger, scr, relativeChangeValidator) {
        this.logger = logger;
        this.scr = scr;
        this.relativeChangeValidator = relativeChangeValidator;
    }

    /**
     * Validates a request to change a configuration parameter.
     * @param {string} path Configuration path (e.g., 'SEA.WEIGHTS.COUPLING_FACTOR')
     * @param {*} newValue The proposed new value
     * @param {Object} context Access context (must include componentId)
     * @returns {boolean} True if the change is permissible.
     */
    validateChange(path, newValue, context) {
        // 1. Authorization Check
        const requiredLevel = GOVERNANCE_LEVELS.C13; // Simple placeholder logic: requires highest level for all dynamic changes.
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
            
            // Use the extracted tool for deviation validation
            const validationResult = this.relativeChangeValidator.execute(currentValue, newValue, maxDeviation);

            if (!validationResult.isValid) {
                this.logger.critical(`[CGP] CHANGE REJECTED: ${path} deviation (${validationResult.deviation.toFixed(2)}) exceeds maximum allowed (${maxDeviation}). Prevented self-correction instability.`);
                return false; 
            }
        }
        
        this.logger.log(`[CGP] Configuration change approved for ${path}: ${currentValue} -> ${newValue} by ${context.componentId}.`);
        return true;
    }
}

module.exports = ConfigurationGovernancePolicy;