// src/services/MetricService.js

import MetricDefinitions from 'config/MetricDefinitions.json';

/**
 * MetricService: Handles standardized reporting and tagging of operational data.
 * It abstracts interaction with the underlying monitoring system (e.g., Prometheus).
 */
class MetricService {
    constructor() {
        this.definitions = MetricDefinitions;
        this.monitoringClient = this._initializeMonitoringClient();
    }

    _initializeMonitoringClient() {
        // In a real system, this integrates with monitoring libraries.
        console.log(`[AGI Metric Service] Initializing with ${Object.keys(this.definitions).length} defined metrics.`);
        // Placeholder implementation to load/register metrics dynamically
        return { 
            registerCounter: (key, description) => ({ key, description, type: 'COUNTER', inc: (value) => { /* actual logic */ } }),
            registerGauge: (key, description) => ({ key, description, type: 'GAUGE', set: (value) => { /* actual logic */ } }),
            metricsHandles: {}
        };
    }

    _getDefinition(key) {
        const definition = this.definitions[key];
        if (!definition) {
            console.error(`Metric definition for '${key}' not found.`);
        }
        return definition;
    }

    increment(key, value = 1) {
        const def = this._getDefinition(key);
        if (def && def.type === 'COUNTER') {
            // Use monitoringClient handle
            // this.monitoringClient.metricsHandles[key].inc(value);
            console.log(`REPORT: COUNTER ${key} += ${value} (Tags: ${def.tags})`);
            return true;
        }
        return false;
    }

    setGauge(key, value) {
        const def = this._getDefinition(key);
        if (def && def.type === 'GAUGE') {
            // Use monitoringClient handle
            // this.monitoringClient.metricsHandles[key].set(value);
            console.log(`REPORT: GAUGE ${key} = ${value} (Tags: ${def.tags})`);
            return true;
        }
        return false;
    }

    // Utility to log resource costs after a major operation
    reportCycleCost(tokens, cyclesCompleted) {
        this.setGauge("TOKEN_USAGE_CYCLE_TOTAL", tokens);
        if (cyclesCompleted) {
             this.increment("EVOLUTION_CYCLES_COMPLETED");
        }
    }
}

export const MetricManager = new MetricService();