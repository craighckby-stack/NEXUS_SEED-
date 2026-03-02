const { METRIC_CONFIGURATIONS, GOVERNANCE_CATEGORIES } = require('./retirementMetricWeights');

/**
 * Validates the schema and consistency of the METRIC_CONFIGURATIONS.
 * Ensures data integrity before configuration load into the CORE engine.
 */
function validateMetricWeights() {
    const validInfluences = ['positive', 'negative'];
    const definedCategories = Object.keys(GOVERNANCE_CATEGORIES);
    let validationErrors = [];

    console.log("Starting METRIC_CONFIGURATIONS Schema Validation...");

    for (const [metricName, config] of Object.entries(METRIC_CONFIGURATIONS)) {
        if (typeof config.weight !== 'number' || config.weight <= 0) {
            validationErrors.push(`[${metricName}] Invalid 'weight': Must be a positive number.`);
        }
        if (!validInfluences.includes(config.influence)) {
            validationErrors.push(`[${metricName}] Invalid 'influence': Must be 'positive' or 'negative'. Found: ${config.influence}`);
        }
        if (!definedCategories.includes(config.category)) {
            validationErrors.push(`[${metricName}] Invalid 'category': Must be one of ${definedCategories.join(', ')}. Found: ${config.category}`);
        }
        if (typeof config.description !== 'string' || config.description.length < 5) {
             validationErrors.push(`[${metricName}] Missing or inadequate 'description'.`);
        }
    }

    if (validationErrors.length > 0) {
        console.error("Configuration Validation FAILED:");
        validationErrors.forEach(err => console.error(` - ${err}`));
        throw new Error("Metric Configuration Validation Failed. Check console for details.");
    }
    
    console.log("Configuration Validation SUCCESSFUL. All metrics adhere to schema.");
    return true;
}

module.exports = {
    validateMetricWeights
};