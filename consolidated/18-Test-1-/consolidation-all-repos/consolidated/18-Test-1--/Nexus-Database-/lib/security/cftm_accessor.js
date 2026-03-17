/**
 * CFTMAccessor (Core Failure Thresholds Manifest Accessor)
 * Implements strict, read-only access to immutable governance constants.
 * Pre-processes the config to ensure type-safe, optimized constant access.
 */

/**
 * Custom error type for configuration issues related to the CFTM.
 */
class CFTMConfigurationError extends Error {
    constructor(message, key) {
        super(`CFTM Error: ${message}${key ? ` (Key: ${key})` : ''}`);
        this.name = 'CFTMConfigurationError';
        this.key = key;
    }
}

class CFTMAccessor {
    /**
     * @param {object} cftmConfig - The configuration object, expected to contain cftmConfig.thresholds.
     */
    constructor(cftmConfig) {
        if (!cftmConfig || !cftmConfig.thresholds) {
            throw new CFTMConfigurationError("Missing or invalid 'thresholds' configuration object.");
        }

        const processedThresholds = {};
        const rawThresholds = cftmConfig.thresholds;

        // Phase 1: Pre-process, validate structure, and flatten thresholds map.
        for (const key in rawThresholds) {
            if (Object.prototype.hasOwnProperty.call(rawThresholds, key)) {
                const constant = rawThresholds[key];
                
                // Enforce structure: Must be an object with a numerical 'value' property.
                if (constant === null || typeof constant !== 'object' || typeof constant.value !== 'number' || isNaN(constant.value)) {
                    throw new CFTMConfigurationError(
                        `Malformed constant entry. Expected { value: number, ... }, received invalid structure or non-finite number.`,
                        key
                    );
                }
                
                // Flatten the structure for direct numerical access efficiency
                processedThresholds[key] = constant.value;
            }
        }

        // Phase 2: Freeze the optimized, flattened map to enforce immutability.
        this.thresholds = Object.freeze(processedThresholds);
    }

    /**
     * @param {string} key - The constant identifier.
     * @returns {number} The immutable numerical value.
     * @throws {CFTMConfigurationError} If the constant is not defined.
     */
    getThreshold(key) {
        const value = this.thresholds[key];
        
        if (value === undefined) {
            // All structure/type checks were performed in the constructor, we only check for key existence here.
            throw new CFTMConfigurationError(`Constant key not found.`, key);
        }
        
        return value;
    }

    /**
     * Specialized accessor for Stability Tau (for GAX-S-02.1).
     * @returns {number}
     */
    getStabilityTau() {
        return this.getThreshold('DENOMINATOR_STABILITY_TAU');
    }

    /**
     * Specialized accessor for Efficacy Safety Margin (for GAX-P-01.2).
     * @returns {number}
     */
    getEfficacySafetyMargin() {
        return this.getThreshold('MINIMUM_EFFICACY_SAFETY_MARGIN_EPSILON');
    }
}

module.exports = { CFTMAccessor, CFTMConfigurationError };