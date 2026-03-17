/**
 * Component ID: RTM
 * Name: Resource Threshold Manager
 * Function: Manages and provides environment-specific or historically tuned resource constraint thresholds
 *           to the Resource Constraint Evaluator (RCE). Enables dynamic tuning and environment profiling.
 * GSEP Alignment: Stage 3 Configuration Support (P-01 Input refinement)
 */

const DEFAULT_THRESHOLDS = {
    cpu_util: { threshold: 0.85, weight: 0.40, severity_boost: 1.5 },
    memory_used_ratio: { threshold: 0.90, weight: 0.50, severity_boost: 2.0 },
    io_wait_factor: { threshold: 0.60, weight: 0.10, severity_boost: 1.2 }
};

class ResourceThresholdManager {
    /**
     * @param {Object} configService - Core service to load general application configuration.
     * @param {string} environmentProfile - E.g., 'production', 'staging', 'dev_vm'.
     * @param {Object|null} adaptiveTuner - Optional component for runtime adjustment (ATN).
     */
    constructor(configService, environmentProfile = 'production', adaptiveTuner = null) {
        if (!configService || typeof configService.get !== 'function') {
            throw new Error("RTM requires a valid ConfigService instance.");
        }
        
        this.configService = configService;
        this.environmentProfile = environmentProfile;
        this.adaptiveTuner = adaptiveTuner;
        
        /** @private {Object|null} Cache for the fully resolved configuration. */
        this.cachedConfig = null;
        
        // Initialize and load base configurations synchronously upon instantiation.
        this._initializeConfiguration();
    }

    /**
     * Centralized configuration loading and merging using the ConfigService.
     * @private
     */
    _initializeConfiguration() {
        // 1. Load Base Configuration (using hardcoded defaults as fallback)
        const baseConfig = this.configService.get('resourceThresholds.base') || DEFAULT_THRESHOLDS;

        // 2. Load Environment Overrides
        const overrides = this.configService.get(`resourceThresholds.profiles.${this.environmentProfile}`) || {};

        // 3. Merge configurations
        let staticConfig = { ...baseConfig };
        
        for (const [key, profileConfig] of Object.entries(overrides)) {
            staticConfig[key] = {
                ...staticConfig[key],
                ...profileConfig
            };
        }
        
        this.baseConfiguration = staticConfig;
    }

    /**
     * Applies dynamic adjustments from the Adaptive Tuner, if present.
     * @private
     * @param {Object} currentConfig - The statically merged configuration.
     * @returns {Object} The dynamically adjusted configuration.
     */
    _applyAdaptiveTuning(currentConfig) {
        if (!this.adaptiveTuner || typeof this.adaptiveTuner.getAdjustments !== 'function') {
            return currentConfig;
        }
        
        const adjustments = this.adaptiveTuner.getAdjustments(currentConfig);
        
        // Deep merge adjustments onto the current configuration
        const dynamicallyTunedConfig = { ...currentConfig };
        
        for (const [metric, adjustment] of Object.entries(adjustments)) {
            if (dynamicallyTunedConfig[metric]) {
                dynamicallyTunedConfig[metric] = {
                    ...dynamicallyTunedConfig[metric],
                    ...adjustment
                };
            }
        }
        
        return dynamicallyTunedConfig;
    }

    /**
     * Public method for RCE to retrieve the aggregated, tuned configuration.
     * Caches the result unless explicitly requested to refresh.
     * @param {boolean} [refresh=false] - Force recalculation even if cached.
     * @returns {Object} Merged configuration object defining current operating constraints.
     */
    getTunedConstraintConfig(refresh = false) {
        if (this.cachedConfig && !refresh) {
            return this.cachedConfig;
        }

        // 1. Start with the statically loaded configuration
        let finalConfig = { ...this.baseConfiguration };
        
        // 2. Apply dynamic adjustments (Adaptive Tuning)
        finalConfig = this._applyAdaptiveTuning(finalConfig);

        this.cachedConfig = finalConfig;
        return finalConfig;
    }
}

module.exports = ResourceThresholdManager;