/**
 * src/config/DialAnalysisConfigValidator.js
 * Utility class responsible for loading, validating, and normalizing the Dial Analysis Configuration Map.
 * This decouples runtime logic from configuration schema concerns.
 */

class DialAnalysisConfigValidator {
    /**
     * Validates and returns a standardized configuration object.
     * @param {Object} rawConfig The raw JSON configuration object (e.g., dial_analysis_map.json).
     * @returns {Object} The validated and normalized configuration.
     * @throws {Error} If the configuration fails validation checks.
     */
    static validate(rawConfig) {
        if (!rawConfig) {
            throw new Error("Configuration map is null or undefined.");
        }

        // 1. Basic Structure Check
        const requiredKeys = ['metrics_config', 'precondition_definitions', 'response_rules'];
        for (const key of requiredKeys) {
            if (!rawConfig[key] || typeof rawConfig[key] !== 'object') {
                throw new Error(`Configuration missing required section: ${key}`);
            }
        }

        // 2. Metric and Precondition Consistency Check (Simplified)
        for (const [pKey, definition] of Object.entries(rawConfig.precondition_definitions)) {
            if (!definition.check || typeof definition.check !== 'string') {
                 throw new Error(`Precondition ${pKey} is missing a 'check' field defining the metric.`);
            }
            if (!rawConfig.metrics_config[definition.check]) {
                throw new Error(`Metric configuration missing for precondition target: ${definition.check}`);
            }
        }

        // 3. Rule Structure Normalization
        // Ensure every rule has a defined priority for robust sorting
        rawConfig.response_rules = rawConfig.response_rules.map(rule => ({
            ...rule,
            priority: rule.priority || 0 
        }));

        return rawConfig;
    }
}

export default DialAnalysisConfigValidator;