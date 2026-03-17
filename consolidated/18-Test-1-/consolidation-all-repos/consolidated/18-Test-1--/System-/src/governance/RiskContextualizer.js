/**
 * RiskContextualizer.js
 * 
 * Optimized for runtime efficiency and recursive abstraction of continuous state observation.
 */

const DEFAULT_CONTEXTS = {
    'HIGH_SECURITY_MISSION': Object.freeze({
        'risk_matrix.weighted_factors': [
            { 'metric_id': 'A_ANOMALY', 'weight': 0.60 },
            { 'metric_id': 'V_COMPLIANCE', 'weight': 0.25 },
            { 'metric_id': 'R_STARVATION', 'weight': 0.15 }
        ],
        'risk_tiers.HIGH.threshold': 0.60
    }),
    'BASELINE': Object.freeze({}) // Explicit, immutable BASELINE for O(1) comparison
};

class RiskContextualizer {
    // Define context map as static and frozen for pre-computation and immutability.
    static CONTEXT_MAP = Object.freeze(DEFAULT_CONTEXTS);
    
    constructor(rcdmManager) {
        this.rcdmManager = rcdmManager; 
        this.activeContextKey = 'BASELINE';
        // Use a private Symbol or variable for efficient internal state management
        this._observationHandle = null; 
        this.MONITOR_INTERVAL_MS = 50; // High-frequency polling interval
    }

    // O(1) context resolution using the static map.
    _resolveContext(key) {
        return RiskContextualizer.CONTEXT_MAP[key] || null;
    }

    /**
     * Efficiently updates the context only if a state transition is strictly necessary.
     * Logging is omitted from the critical path for maximum computational speed.
     * @param {string} newContextKey 
     * @returns {boolean} True if context was applied.
     */
    updateContext(newContextKey) {
        if (newContextKey === this.activeContextKey) {
            return false; 
        }

        const overlay = this._resolveContext(newContextKey);
        
        if (overlay) {
            // Assumes RCDM manager implements highly optimized deep-path config application.
            this.rcdmManager.applyConfigOverlay(overlay);
            this.activeContextKey = newContextKey;
            return true;
        }
        return false;
    }

    /**
     * Abstracted recursive monitoring loop (Context Observer).
     * Models the continuous evaluation as a self-scheduling, persistent process.
     */
    _recursiveObservationCycle() {
        // --- Context Evaluation Logic ---
        // Assume rcdmManager provides a highly efficient signal retrieval interface.
        const currentThreatLevel = this.rcdmManager.getSignal('external_threat');
        
        let targetContext = this.activeContextKey; // Default to current state

        // Highly efficient decision path:
        if (currentThreatLevel >= 5) {
            targetContext = 'HIGH_SECURITY_MISSION';
        } else if (currentThreatLevel < 1) {
             targetContext = 'BASELINE';
        }

        // Attempt state transition based on observed signals.
        this.updateContext(targetContext);

        // Recursive call: Self-scheduling the next execution cycle.
        // This abstracts the monitoring into a persistent loop.
        this._observationHandle = setTimeout(
            () => this._recursiveObservationCycle(), 
            this.MONITOR_INTERVAL_MS
        );
    }

    startMonitoring() {
        if (this._observationHandle === null) {
            this._recursiveObservationCycle();
        }
    }

    stopMonitoring() {
        if (this._observationHandle !== null) {
            clearTimeout(this._observationHandle);
            this._observationHandle = null;
        }
    }
}

module.exports = RiskContextualizer;