/**
 * PhaseEvaluatorEngine.js
 * Responsible for reading the sys_phase_controller configuration,
 * processing incoming aggregated telemetry streams, applying hysteresis timers,
 * and outputting the current definitive system operational phase via events.
 * Utilizes HysteresisTimerManager for temporal control.
 */
const HysteresisTimerManager = require('./HysteresisTimerManager'); 
const EventEmitter = require('events'); // Core module for emitting phase changes

// Constants for robust logic evaluation
const DEFAULT_STATE = 'IDLE';
const LOGIC_TYPE = {
    ALL: 'ALL',
    ANY: 'ANY'
};

class PhaseEvaluatorEngine extends EventEmitter {
    /**
     * @param {object} config - System configuration defining phases, thresholds, transitions, and optional initialState.
     * @param {function} logger - Logging utility.
     */
    constructor(config, logger = console) {
        super(); // Initialize EventEmitter
        
        if (!config || !config.phases) {
            throw new Error("PhaseEvaluatorEngine requires a valid 'phases' configuration object.");
        }

        this.config = config; 
        this.logger = logger;
        
        // Default state fallback
        const initialPhaseName = Object.keys(config.phases)[0];
        this.currentState = config.initialState || initialPhaseName || DEFAULT_STATE;
        
        this.metricCache = {}; // Stores last aggregated metric values
        this.timerManager = new HysteresisTimerManager(logger); 
        this.lastUpdateTime = Date.now();

        // Optimized operator function map for rule checking
        this._ruleOperators = {
            '>': (a, b) => a > b,
            '<': (a, b) => a < b,
            '>=': (a, b) => a >= b,
            '<=': (a, b) => a <= b,
            '==': (a, b) => a == b,
            '!=': (a, b) => a != b
        };
    }

    /**
     * Receives pre-processed, aggregated, and normalized metrics.
     * This expects clean data, offloading raw telemetry processing to an upstream service.
     * @param {object} processedMetrics - Incoming aggregated and normalized metrics.
     */
    updateMetrics(processedMetrics) {
        // Step 1: Cache processed metrics efficiently
        Object.assign(this.metricCache, processedMetrics);
        this.lastUpdateTime = Date.now();

        // Step 2: Trigger evaluation
        this.evaluatePhaseTransition();
    }
    
    /**
     * Core logic for evaluating all potential transitions OUT of the current phase.
     * Now supports optional 'priority' attribute on transitions (higher is better).
     */
    evaluatePhaseTransition() {
        const { currentState, config } = this;
        const currentPhaseConfig = config.phases[currentState];

        if (!currentPhaseConfig) {
            this.logger.error(`Configuration missing for current phase: ${currentState}. System state is potentially undefined.`);
            return;
        }
        
        // Optimization: Early exit if no transitions defined
        if (!currentPhaseConfig.transitions) return;

        let pendingTransition = null;
        let highestPriority = -Infinity; 

        // Iterate through all defined transitions for the current state
        for (const targetPhaseName in currentPhaseConfig.transitions) {
            const transitionDefinition = currentPhaseConfig.transitions[targetPhaseName];
            
            // Check if the metric conditions are instantly met
            const meetsInstantCondition = this.checkConditionSet(transitionDefinition.trigger);
            
            const transitionId = `${currentState}_TO_${targetPhaseName}`;

            if (meetsInstantCondition) {
                const durationMs = transitionDefinition.duration_ms || 0;
                const priority = transitionDefinition.priority || 0; // Default priority 0

                // Check if the condition has held for the required hysteresis duration
                if (this.timerManager.checkAndStartTimer(transitionId, durationMs)) {
                    // Hysteresis met. Check against priority.
                    if (priority >= highestPriority) { 
                        highestPriority = priority;
                        pendingTransition = targetPhaseName;
                    }
                } 
            } else {
                // Condition failed: reset the corresponding timer immediately
                this.timerManager.resetTimer(transitionId);
            }
        }
        
        // Commit the transition if found (highest priority takes precedence)
        if (pendingTransition && pendingTransition !== currentState) {
            this._commitTransition(pendingTransition);
        } 
    }

    /**
     * Determines if a complex set of conditions (e.g., AND/OR rules) is met.
     * Handles undefined/empty rulesets gracefully.
     * @param {object} conditionSet 
     * @returns {boolean}
     */
    checkConditionSet(conditionSet) {
        if (!conditionSet || !Array.isArray(conditionSet.rules) || conditionSet.rules.length === 0) {
            return false; 
        }

        // Normalize logic type or default to ALL
        const logic = conditionSet.logic ? conditionSet.logic.toUpperCase() : LOGIC_TYPE.ALL;
        const evaluationResults = conditionSet.rules.map(rule => this._checkSingleRule(rule));
        
        if (logic === LOGIC_TYPE.ANY) {
            return evaluationResults.some(res => res);
        } else { 
            return evaluationResults.every(res => res);
        }
    }

    /**
     * Evaluates a single metric rule comparison using a lookup map for speed and strict type checking.
     * Forces numeric conversion to ensure valid comparison for operators like > and <.
     * @param {object} rule 
     * @returns {boolean}
     */
    _checkSingleRule(rule) {
        const metricValue = this.metricCache[rule.metric];
        const targetValue = rule.value;
        const operatorFunc = this._ruleOperators[rule.operator];

        if (metricValue === undefined || targetValue === undefined || !operatorFunc) {
            return false;
        }
        
        const v1 = parseFloat(metricValue);
        const v2 = parseFloat(targetValue);
        
        // Ensure both values are valid numbers before comparison
        if (isNaN(v1) || isNaN(v2)) {
            this.logger.warn(`Non-numeric data detected for rule '${rule.metric} ${rule.operator} ${rule.value}'. Skipping comparison.`);
            return false;
        }

        return operatorFunc(v1, v2);
    }

    /**
     * Executes the state change, cleans up timers, and emits the transition event.
     * @param {string} newPhase
     */
    _commitTransition(newPhase) {
        const oldPhase = this.currentState;

        this.logger.info(`[Phase] Transition committed: ${oldPhase} -> ${newPhase}`);
        this.currentState = newPhase;
        
        // Clear all timers as we are starting fresh in a new phase context
        this.timerManager.resetAll();
        
        // Emit structured event for external subscribers (Actuators, Loggers)
        this.emit('phaseTransition', {
            newPhase: newPhase,
            oldPhase: oldPhase,
            timestamp: Date.now(),
            metricsSnapshot: {...this.metricCache} // Provide snapshot for debug/context
        });
    }

    getCurrentPhase() {
        return this.currentState;
    }
}

module.exports = PhaseEvaluatorEngine;