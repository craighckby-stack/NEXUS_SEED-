/**
 * CFTMValidator
 * Ensures the Core Failure Thresholds Manifest adheres to the strict governance schema
 * before ingestion by the CFTMAccessor. Separates structural validation from runtime access.
 * This utility handles external data integrity (e.g., versioning, required keys, format).
 */

const RequiredKeys = [
    'DENOMINATOR_STABILITY_TAU',
    'MINIMUM_EFFICACY_SAFETY_MARGIN_EPSILON',
    // Add all critical mandated keys here
];

const CFTMConfigurationError = require('./cftm_accessor').CFTMConfigurationError; 

class CFTMValidator {
    /**
     * Validates the structure and presence of mandated constants in the raw manifest.
     * @param {object} rawConfig - The object containing the 'thresholds' property.
     * @throws {CFTMConfigurationError} if validation fails.
     * @returns {object} The validated configuration object.
     */
    static validateManifest(rawConfig) {
        if (!rawConfig || typeof rawConfig !== 'object' || !rawConfig.thresholds || typeof rawConfig.thresholds !== 'object') {
            throw new CFTMConfigurationError('Invalid manifest structure. Expected root object containing "thresholds".');
        }

        const thresholds = rawConfig.thresholds;

        // 1. Check for required keys
        for (const key of RequiredKeys) {
            if (!thresholds.hasOwnProperty(key)) {
                throw new CFTMConfigurationError(`Missing mandated core threshold key.`, key);
            }
        }

        // 2. Perform detailed structural validation (ensuring {value: number} format)
        for (const key in thresholds) {
            const constant = thresholds[key];
            if (constant === null || typeof constant !== 'object' || typeof constant.value !== 'number' || isNaN(constant.value)) {
                 throw new CFTMConfigurationError(
                    `Threshold validation failure: Key must define a numeric value.`,
                    key
                );
            }
        }

        // If external requirements like versioning, signatures, or metadata checks are necessary,
        // they would be implemented here.

        return rawConfig;
    }
}

module.exports = CFTMValidator;