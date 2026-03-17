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

class PhaseEvaluatorEngine extends EventEmitter {
    
    // Tool dependency definition for AGI-Kernel
    // We rely on 'ConstraintEvaluator' for processing complex rule sets.
    private plugins: { ConstraintEvaluator: any }; 
    private config: any;
    private logger: any;
    private currentState: string;
    private metricCache: Record<string, any>;
    private timerManager: any;
    private lastUpdateTime: number;

    /**
     * @param {object} config - System configuration defining phases, thresholds, transitions, and optional initialState.
     * @param {function} logger - Logging utility.
     */
    constructor(config: any, logger = console) {
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
        
        // Initialize tool reference
        this.plugins = {
            ConstraintEvaluator: null,
        };
    }
    
    // AGI-Kernel injection point: Must be defined for extracted tools usage
    public injectPlugin(name: string, instance: any) {
        if (this.plugins.hasOwnProperty(name)) {
            this.plugins[name] = instance;
        }
    }


    /**
     * Receives pre-processed, aggregated, and normalized metrics.
     * This expects clean data, offloading raw telemetry processing to an upstream service.
     * @param {object} processedMetrics - Incoming aggregated and normalized metrics.
     */
    updateMetrics(processedMetrics: Record<string, any>) {
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

        let pendingTransition: string | null = null;
        let highestPriority = -Infinity; 

        // Iterate through all defined transitions for the current state
        for (const targetPhaseName in currentPhaseConfig.transitions) {
            const transitionDefinition = currentPhaseConfig.transitions[targetPhaseName];
            
            // Step 1: Check if the metric conditions are instantly met using the external plugin
            const meetsInstantCondition = this._checkConditionsUsingPlugin(transitionDefinition.trigger);
            
            const transitionId = `${currentState}_TO_${targetPhaseName}`;

            if (meetsInstantCondition) {
                const durationMs = transitionDefinition.duration_ms || 0;
                const priority = transitionDefinition.priority || 0; // Default priority 0

                // Step 2: Check if the condition has held for the required hysteresis duration
                if (this.timerManager.checkAndStartTimer(transitionId, durationMs)) {
                    // Hysteresis met. Step 3: Check against priority.
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
     * Helper to wrap the ConstraintEvaluator plugin execution.
     * @param {object} conditionSet 
     * @returns {boolean}
     */
    private _checkConditionsUsingPlugin(conditionSet: any): boolean {
        const evaluator = this.plugins.ConstraintEvaluator;
        
        if (!evaluator || typeof evaluator.execute !== 'function') {
            // Fallback warning if plugin wasn't injected correctly or is incomplete
            this.logger.warn("ConstraintEvaluator plugin not initialized or missing 'execute' method. Condition checking skipped.");
            return false;
        }

        return evaluator.execute({
            metricCache: this.metricCache,
            conditionSet: conditionSet
        });
    }

    /**
     * Executes the state change, cleans up timers, and emits the transition event.
     * @param {string} newPhase
     */
    _commitTransition(newPhase: string) {
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

    getCurrentPhase(): string {
        return this.currentState;
    }
}

module.exports = PhaseEvaluatorEngine;