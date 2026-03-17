// CRM (Contextual Runtime Monitor) v94.1 R4 - High-Efficiency & Clarity Refactor
// GSEP Alignment: Stage 3 (P-01 Adjudication Input S-02)
// Function: Provides high-frequency, non-blocking telemetry stream for external constraints (Risk Floor input).

const ExponentialMovingAverager = require('../utils/ExponentialMovingAverager');

class ContextualRuntimeMonitor {
    static NAME = 'CRM_v94.1_R4';
    static GSEP_ALIGNMENT = 'Stage 3 (P-01 Adjudication Input S-02)';

    // Default Configuration Parameters
    static DEFAULT_CONFIG = {
        latencyAlpha: 0.1, // Smoothing factor for EMA
        criticalLatencyThreshold_ms: 40,
        staleDataThreshold_ms: 5000,
        
        // Risk Model Parameters (Tuned for P-01/S-02)
        RISK_STRESS_WEIGHT: 0.4,
        RISK_BASE_FACTOR: 0.05,
        RISK_DEVIATION_SCALE: 0.015,
        RISK_MAX_LATENCY_CONTRIBUTION: 0.5,
        RELIABILITY_MIN_FLOOR: 0.1, // Minimum allowable calculated reliability
        RELIABILITY_DECAY_RATE: 0.5, // Max % loss due to staleness when threshold is met.
    };

    /**
     * @param {Object} telemetrySourceConfig - Configuration overrides.
     * @param {Object} [systemMonitor=null] - Optional dependency for system/sensor input (or EnvironmentalSensorHub).
     */
    constructor(telemetrySourceConfig = {}, systemMonitor = null) {
        this.config = { ...ContextualRuntimeMonitor.DEFAULT_CONFIG, ...telemetrySourceConfig };

        this.systemMonitor = systemMonitor; // Can be a SystemMonitor or SensorHub
        this.latencyEMA = new ExponentialMovingAverager(this.config.latencyAlpha);
        
        this.lastUpdateTime = 0;
        
        // Internal telemetry state cache
        this.state = {
            latencyMean_ms: 0,
            stressIndex: 0, // Normalized (0.0 to 1.0)
            telemetryReliability: 1.0,
            lastUpdateDuration_ms: Infinity
        };
    }

    /**
     * Fetches raw inputs, updates the internal state, and recalculates reliability.
     * Executes synchronously and must be extremely fast/O(1).
     */
    updateMetrics() {
        const now = Date.now();
        let updateSuccessful = false;

        try {
            const rawLatency = this._fetchCriticalLatency();
            const rawStressIndex = this._calculateExternalStress();

            this.state.latencyMean_ms = this.latencyEMA.update(rawLatency);
            this.state.stressIndex = parseFloat(rawStressIndex);
            
            this.lastUpdateTime = now;
            updateSuccessful = true;
            
        } catch (e) {
            // Logging omitted for performance, but critical data fetch failure is noted.
        }

        this._updateReliability(now, updateSuccessful);
    }
    
    /**
     * Internal method to calculate and update telemetry reliability based on staleness and fetch success.
     * @param {number} now - Current timestamp.
     * @param {boolean} success - Whether the data update attempt succeeded.
     */
    _updateReliability(now, success) {
        const durationSinceLastUpdate = now - this.lastUpdateTime;
        this.state.lastUpdateDuration_ms = durationSinceLastUpdate;
        
        // 1. Calculate Loss due to Staleness
        const staleRatio = durationSinceLastUpdate / this.config.staleDataThreshold_ms;
        const effectiveStaleLoss = Math.min(1.0, staleRatio) * this.config.RELIABILITY_DECAY_RATE;
        
        // 2. Apply decay, capped by the minimum floor
        let newReliability = Math.max(
            this.config.RELIABILITY_MIN_FLOOR, 
            1.0 - effectiveStaleLoss
        );

        // 3. Apply immediate penalty if the attempted update failed, even if data isn't stale yet.
        if (!success && newReliability > this.config.RELIABILITY_MIN_FLOOR) {
            // 5% immediate reliability reduction upon critical internal fetch failure
            newReliability = Math.max(this.config.RELIABILITY_MIN_FLOOR, newReliability * 0.95);
        }

        this.state.telemetryReliability = newReliability;
    }


    /**
     * Retrieves the last calculated set of environmental metrics.
     * @returns {Object} state 
     */
    getRealtimeMetrics() {
        return { ...this.state }; // Return defensive copy
    }

    // --- Private Fetchers (Data Sources) ---

    _fetchCriticalLatency() {
        // Prefer SystemMonitor/SensorHub for latency, fallback to placeholder if unavailable.
        if (this.systemMonitor && typeof this.systemMonitor.getSystemLatency === 'function') {
            return this.systemMonitor.getSystemLatency();
        }
        return Math.floor(Math.random() * 50) + 5; // Placeholder
    }

    _calculateExternalStress() {
        // Use injected dependency for normalized stress index, fallback to placeholder.
        if (this.systemMonitor && typeof this.systemMonitor.getNormalizedStressIndex === 'function') {
            return this.systemMonitor.getNormalizedStressIndex(); 
        }
        return Math.random().toFixed(2); // Placeholder
    }
    
    // --- Risk Calculation ---

    /**
     * Calculates environmental impact on Risk Floor (S-02), factoring in data reliability.
     * @returns {number} Environmental risk coefficient (0.0 to 1.0).
     */
    calculateEnvironmentalRiskFactor() {
        const { latencyMean_ms, stressIndex, telemetryReliability } = this.state;
        const config = this.config;
        
        // 1. Latency Risk Component
        let latencyRisk = config.RISK_BASE_FACTOR; 
        if (latencyMean_ms > config.criticalLatencyThreshold_ms) {
            const deviation = latencyMean_ms - config.criticalLatencyThreshold_ms;
            
            latencyRisk += Math.min(
                config.RISK_MAX_LATENCY_CONTRIBUTION, 
                deviation * config.RISK_DEVIATION_SCALE
            ); 
        }

        // 2. External Stress Component (Weighted)
        const stressRisk = stressIndex * config.RISK_STRESS_WEIGHT;
        
        // 3. Reliability Amplification (Unreliable data doubles calculated risk)
        const reliabilityAmplificationFactor = 1.0 + (1.0 - telemetryReliability);

        let totalRisk = (latencyRisk + stressRisk) * reliabilityAmplificationFactor;
        
        // Ensure final output remains a valid probability/coefficient
        return Math.min(1.0, Math.max(0.0, totalRisk)); 
    }
}