/**
 * Component ID: ATN
 * Name: Adaptive Tuner Kernel
 * Function: Monitors historical telemetry and real-time operational metrics using standardized evaluation
 *           to provide dynamic, controlled adjustments to system governance configurations (like RTM).
 * GSEP Alignment: Stage 4 Autonomous Optimization (T-02 Dynamic Parameter Adjustment)
 */

class AdaptiveTunerKernel {
    /**
     * @param {object} dependencies - Injected kernel dependencies.
     * @param {ILoggerToolKernel} dependencies.ILoggerToolKernel - High-integrity logging interface.
     * @param {ITelemetryServiceKernel} dependencies.ITelemetryServiceKernel - Service for historical metrics.
     * @param {ISystemMonitorServiceKernel} dependencies.ISystemMonitorServiceKernel - Service for current resource data.
     * @param {IAdaptiveTunerConfigRegistryKernel} dependencies.IAdaptiveTunerConfigRegistryKernel - Configuration source for tuning profiles.
     * @param {IAdaptiveParameterTunerToolKernel} dependencies.IAdaptiveParameterTunerToolKernel - Core adjustment calculation tool.
     */
    constructor(dependencies) {
        this.logger = dependencies.ILoggerToolKernel;
        this.configRegistry = dependencies.IAdaptiveTunerConfigRegistryKernel;
        this.parameterTuner = dependencies.IAdaptiveParameterTunerToolKernel;
        this.telemetryService = dependencies.ITelemetryServiceKernel;
        this.systemMonitorService = dependencies.ISystemMonitorServiceKernel; // Retained for architectural completeness, though not heavily used in getAdjustments.

        this.tuningProfile = null; // Configuration loaded asynchronously
        
        this.#setupDependencies();
    }

    /**
     * Ensures all required dependencies are present.
     * @private
     */
    #setupDependencies() {
        if (!this.logger || !this.configRegistry || !this.parameterTuner || !this.telemetryService) {
            throw new Error("ATN Kernel initialization failure: Missing required kernel dependencies.");
        }
    }

    /**
     * Asynchronously initializes the kernel by loading the tuning profile.
     * @async
     */
    async initialize() {
        try {
            // Load the tuning profile from the specialized registry
            this.tuningProfile = await this.configRegistry.loadTuningProfile();
            
            if (!this.tuningProfile || typeof this.tuningProfile.metrics !== 'object') {
                throw new Error("Invalid or empty tuning profile loaded.");
            }
            this.logger.info("AdaptiveTunerKernel initialized successfully with profile.", { metricsCount: Object.keys(this.tuningProfile.metrics).length });
        } catch (error) {
            this.logger.error("ATN Kernel failed configuration loading.", { error: error.message });
            // Fail-safe: Disable tuning if configuration is critical
            this.tuningProfile = { metrics: {} }; 
        }
    }

    /**
     * Evaluates a single metric using recent history, calculating proportional adjustment needed and applying safety limits.
     * This logic is delegated entirely to the IAdaptiveParameterTunerToolKernel.
     * @private
     * @param {string} metricKey - Key of the metric (e.g., 'cpu_util').
     * @param {number} currentValue - The current threshold value for this metric.
     * @param {object} recentHistory - Summary statistics and raw data for the metric.
     * @returns {Promise<number | null>} The final calculated bounded threshold value, or null if adjustment is insignificant.
     */
    async #evaluateMetricAdjustment(metricKey, currentValue, recentHistory) {
        const params = this.tuningProfile.metrics[metricKey];
        if (!params || !currentValue) return null;

        // Prepare arguments for the external tuning tool
        const adjustmentArgs = {
            currentValue: currentValue,
            history: recentHistory,
            metricParams: params,
            globalProfile: {
                MAX_ADJUSTMENT_FACTOR: this.tuningProfile.MAX_ADJUSTMENT_FACTOR,
                MIN_THRESHOLD_DRIFT_PERCENT: this.tuningProfile.MIN_THRESHOLD_DRIFT_PERCENT
            }
        };
        
        // Delegate calculation to the specialized tuning tool kernel
        try {
            return await this.parameterTuner.calculateBoundedAdjustment(adjustmentArgs);
        } catch (error) {
            this.logger.error(`ATN: Error during adjustment calculation for ${metricKey}.`, { error: error.message });
            return null;
        }
    }

    /**
     * Calculates required threshold adjustments based on recent system state using parameterized analysis.
     * @async
     * @param {Object} currentConfig - The current configuration schema from RTM, mapped by metric keys.
     * @returns {Promise<Object>} A map of metric keys to adjustment objects (e.g., { cpu_util: { threshold: 0.78 } }).
     */
    async getAdjustments(currentConfig) {
        if (!this.tuningProfile || Object.keys(this.tuningProfile.metrics).length === 0) {
             this.logger.warn("ATN Kernel inactive due to missing or invalid tuning profile. Skipping adjustment cycle.");
             return {};
        }

        const adjustments = {};
        
        const metricKeys = Object.keys(this.tuningProfile.metrics);
        
        // Retrieve generalized summary statistics asynchronously
        const operationalSummary = await this.telemetryService.getRecentOperationalSummary(metricKeys);

        const adjustmentPromises = [];
        
        for (const metricKey of metricKeys) {
            if (currentConfig[metricKey] && operationalSummary[metricKey]) {
                const currentValue = currentConfig[metricKey].threshold;
                const history = operationalSummary[metricKey];

                adjustmentPromises.push(
                    this.#evaluateMetricAdjustment(metricKey, currentValue, history)
                        .then(adjustedThreshold => {
                            if (adjustedThreshold !== null) {
                                adjustments[metricKey] = {
                                    threshold: adjustedThreshold
                                };
                            }
                        })
                );
            }
        }
        
        await Promise.all(adjustmentPromises);
        
        return adjustments;
    }
}

module.exports = AdaptiveTunerKernel;