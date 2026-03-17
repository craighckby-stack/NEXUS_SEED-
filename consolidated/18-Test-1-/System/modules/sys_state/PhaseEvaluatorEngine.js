/**
 * PhaseEvaluatorEngine.js
 * Responsible for reading the sys_phase_controller configuration,
 * processing incoming telemetry streams, applying hysteresis timers,
 * and outputting the current definitive system operational phase.
 * Utilizes HysteresisTimerManager for temporal control.
 */
const HysteresisTimerManager = require('./HysteresisTimerManager'); // Dependency for managing temporal constraints

class PhaseEvaluatorEngine {
    /**
     * @param {object} config - System configuration defining phases, thresholds, and transitions.
     * @param {function} logger - Logging utility (defaults to console).
     */
    constructor(config, logger = console) {
        this.config = config; // Full phase configuration
        this.logger = logger;
        this.currentState = 'NORMAL';
        this.metricCache = {}; // Stores last aggregated metric values
        this.timerManager = new HysteresisTimerManager(logger); // Manages all transition timers
        this.lastUpdateTime = Date.now();
    }

    /**
     * Receives raw telemetry data, updates the internal metric cache, and triggers evaluation.
     * In a robust system, aggregation and normalization would occur here based on config.
     * @param {object} rawMetrics - Incoming telemetry stream data.
     */
    updateMetrics(rawMetrics) {
        // Step 1: Process and normalize metrics (A stub for complex aggregation logic)
        const processedMetrics = this._processMetrics(rawMetrics);
        
        // Step 2: Cache processed metrics
        Object.assign(this.metricCache, processedMetrics);
        this.lastUpdateTime = Date.now();

        // Step 3: Trigger evaluation
        this.evaluatePhaseTransition();
    }
    
    /**
     * Placeholder for metric processing logic (aggregation, unit conversion).
     * @param {object} metrics
     * @returns {object} Normalized metrics
     */
    _processMetrics(metrics) {
        // v94.1 optimization: Assume minimal processing here if aggregation pipeline is upstream
        return metrics;
    }

    /**
     * Core logic for evaluating all potential transitions OUT of the current phase.
     */
    evaluatePhaseTransition() {
        const { currentState, config } = this;
        const currentPhaseConfig = config.phases[currentState];

        if (!currentPhaseConfig) {
            this.logger.error(`Configuration missing for phase: ${currentState}`);
            return;
        }

        let pendingTransition = null;

        // Iterate through all defined transitions for the current state
        for (const targetPhaseName in currentPhaseConfig.transitions) {
            const transitionDefinition = currentPhaseConfig.transitions[targetPhaseName];
            
            // Check if the metric conditions are instantly met
            const meetsInstantCondition = this.checkConditionSet(transitionDefinition.trigger);
            const transitionId = `${currentState}_TO_${targetPhaseName}`;

            if (meetsInstantCondition) {
                const durationMs = transitionDefinition.duration_ms || 0;

                // Check if the condition has held for the required hysteresis duration
                if (this.timerManager.checkAndStartTimer(transitionId, durationMs)) {
                    // Hysteresis met. Prioritize this transition.
                    pendingTransition = targetPhaseName;
                    break; 
                }
            } else {
                // Condition failed: reset the corresponding timer immediately
                this.timerManager.resetTimer(transitionId);
            }
        }
        
        // Commit the transition if a high-priority entry condition was satisfied
        if (pendingTransition) {
            this._commitTransition(pendingTransition);
        } 
    }

    /**
     * Determines if a complex set of conditions (e.g., AND/OR rules) is met.
     * Configuration structure expected: { logic: 'AND'/'ANY', rules: [{...}] }
     * @param {object} conditionSet 
     * @returns {boolean}
     */
    checkConditionSet(conditionSet) {
        if (!conditionSet || !Array.isArray(conditionSet.rules) || conditionSet.rules.length === 0) {
            return false; 
        }

        const evaluationResults = conditionSet.rules.map(rule => this._checkSingleRule(rule));
        
        if (conditionSet.logic === 'ANY') {
            return evaluationResults.some(res => res);
        } else {
            // Default or 'ALL' logic
            return evaluationResults.every(res => res);
        }
    }

    /**
     * Evaluates a single metric rule comparison (e.g., 'cpu_usage' > 90).
     * @param {object} rule 
     */
    _checkSingleRule(rule) {
        const metricValue = this.metricCache[rule.metric];
        if (metricValue === undefined || rule.value === undefined) {
            // Cannot evaluate missing metrics or missing target values
            return false;
        }
        
        // Robust comparison implementation
        switch (rule.operator) {
            case '>': return metricValue > rule.value;
            case '<': return metricValue < rule.value;
            case '>=': return metricValue >= rule.value;
            case '<=': return metricValue <= rule.value;
            case '==': return metricValue == rule.value;
            case '!=': return metricValue != rule.value;
            default:
                this.logger.warn(`Unknown operator in phase config rule: ${rule.operator}`);
                return false;
        }
    }

    /**
     * Executes the state change, cleans up timers, and logs the transition.
     * @param {string} newPhase
     */
    _commitTransition(newPhase) {
        this.logger.info(`[Phase] Transition committed: ${this.currentState} -> ${newPhase}`);
        this.currentState = newPhase;
        
        // Clear all timers as we have successfully entered a new context/phase
        this.timerManager.resetAll();
        
        // V94.1 optimization: Trigger follow-up actions/emit events here.
    }

    getCurrentPhase() {
        return this.currentState;
    }
}

module.exports = PhaseEvaluatorEngine;