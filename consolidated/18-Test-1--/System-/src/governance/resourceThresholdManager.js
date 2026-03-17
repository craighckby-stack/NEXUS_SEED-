/**
 * Component ID: RTM
 * Name: Resource Threshold Manager
 * Function: Manages and provides environment-specific or historically tuned resource constraint thresholds
 *           to the Resource Constraint Evaluator (RCE). Enables dynamic tuning and environment profiling.
 * GSEP Alignment: Stage 3 Configuration Support (P-01 Input refinement)
 */

// Define constants outside the class scope and freeze them for immutability and memory optimization.
const DEFAULT_THRESHOLDS = Object.freeze({
    cpu_util: Object.freeze({ threshold: 0.85, weight: 0.40, severity_boost: 1.5 }),
    memory_used_ratio: Object.freeze({ threshold: 0.90, weight: 0.50, severity_boost: 2.0 }),
    io_wait_factor: Object.freeze({ threshold: 0.60, weight: 0.10, severity_boost: 1.2 })
});

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
        
        // Initialize base configurations synchronously.
        this._initializeConfiguration();
    }

    /**
     * Highly optimized configuration merging abstraction (Fixed Depth 2).
     * Creates a new object by merging 'layer' onto 'base'.
     * Uses internal iteration and Object.assign for maximum V8 optimization 
     * in updating configuration definitions (threshold, weight, etc.).
     * This encapsulates the core configuration resolution logic.
     * @private
     * @param {Object} base - The starting configuration map.
     * @param {Object} layer - The configuration layer to apply as overrides.
     * @returns {Object} A new, merged configuration map.
     */
    _mergeLayer(base, layer) {
        // Optimization: Shallow copy the base metrics structure.
        const merged = { ...base }; 
        
        // Iterate only over the override keys (more efficient than Object.entries)
        for (const metricKey in layer) {
            // Prepare the base metric definition (defaults to empty object if new metric)
            const baseMetric = base[metricKey] || {};
            
            // Use Object.assign for high-performance property merging within the metric definition.
            // Creates a new metric definition object.
            merged[metricKey] = Object.assign({}, baseMetric, layer[metricKey]);
        }
        return merged;
    }


    /**
     * Centralized configuration loading and merging.
     * Establishes the stable, static base configuration chain: 
     * [Defaults] -> [Service Base] -> [Environment Profile]
     * @private
     */
    _initializeConfiguration() {
        const baseFromService = this.configService.get('resourceThresholds.base') || {};

        // Layer 1 & 2: Merge Defaults with Base configuration from service
        let staticConfig = this._mergeLayer(DEFAULT_THRESHOLDS, baseFromService);

        // Layer 3: Apply Environment Overrides
        const overrides = this.configService.get(`resourceThresholds.profiles.${this.environmentProfile}`);
        if (overrides) {
            staticConfig = this._mergeLayer(staticConfig, overrides);
        }
        
        this.baseConfiguration = staticConfig;
    }

    /**
     * Applies dynamic adjustments from the Adaptive Tuner, if present, 
     * using the recursive merging abstraction.
     * @private
     * @param {Object} currentConfig - The statically merged configuration.
     * @returns {Object} The dynamically adjusted configuration.
     */
    _applyAdaptiveTuning(currentConfig) {
        if (!this.adaptiveTuner || typeof this.adaptiveTuner.getAdjustments !== 'function') {
            return currentConfig;
        }
        
        const adjustments = this.adaptiveTuner.getAdjustments(currentConfig);
        
        // Layer 4: Apply Dynamic Adjustments using the optimized merger
        return this._mergeLayer(currentConfig, adjustments);
    }

    /**
     * Public method for RCE to retrieve the aggregated, tuned configuration.
     * Caches the result unless explicitly requested to refresh.
     * @param {boolean} [refresh=false] - Force recalculation even if cached.
     * @returns {Object} Merged configuration object defining current operating constraints.
     */
    getTunedConstraintConfig(refresh = false) {
        // Optimization: Fast path exit using cache
        if (this.cachedConfig && !refresh) {
            return this.cachedConfig;
        }

        // Start with the pre-calculated static configuration
        let finalConfig = this.baseConfiguration;
        
        // Apply dynamic adjustments (Layer 4)
        finalConfig = this._applyAdaptiveTuning(finalConfig);

        this.cachedConfig = finalConfig;
        return finalConfig;
    }
}

module.exports = ResourceThresholdManager;