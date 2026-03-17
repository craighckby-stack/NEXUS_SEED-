// src/services/MetricService.js

import MetricDefinitions from 'config/MetricDefinitions.json';

/**
 * Assumption: StandardizedMetricReporter is available via AGI Kernel injection/import.
 * It handles definition lookup, type validation, and delegates reporting via an adapter.
 */
declare const StandardizedMetricReporter: {
    initialize: (definitions: any, reportAdapter: (key: string, type: string, value: any, tags: any) => void) => void;
    increment: (key: string, value?: number) => boolean;
    setGauge: (key: string, value: any) => boolean;
};

/**
 * MetricService: Handles standardized reporting and tagging of operational data.
 * It abstracts interaction with the underlying monitoring system (e.g., Prometheus).
 */
class MetricService {
    private definitions: typeof MetricDefinitions;
    private monitoringClient: any;
    private reporter: typeof StandardizedMetricReporter;

    constructor() {
        this.definitions = MetricDefinitions;
        this.monitoringClient = this._initializeMonitoringClient();
        
        // Initialize the reusable reporter tool (assuming instantiation via a factory or loader)
        // For production use, inject the instance.
        // Simulating instantiation here for dependency fulfillment:
        const reporterFactory = (0, eval(this._getReporterPluginCode()));
        this.reporter = reporterFactory();

        const reportAdapter = this._createReportAdapter();
        this.reporter.initialize(this.definitions, reportAdapter);
    }

    // Helper utility to self-load the plugin code during initialization (AVOID in production)
    private _getReporterPluginCode() {
        // This retrieves the vanilla JS code defined in the 'plugin' block below.
        // In a real TS environment, this dependency is imported.
        return `(function() {
            const StandardizedMetricReporter = {
                definitions: {},
                reportAdapter: null,
        
                initialize: function(definitions, reportAdapter) {
                    this.definitions = definitions || {};
                    if (typeof reportAdapter !== 'function') {
                        this.reportAdapter = (key, type, value, tags) => { 
                            console.warn('[MetricReporter] No adapter set. Reporting suppressed for ' + key);
                        };
                    } else {
                        this.reportAdapter = reportAdapter;
                    }
                },
        
                _getDefinition: function(key) {
                    const definition = this.definitions[key];
                    if (!definition) {
                        console.error('Metric definition for \'' + key + '\' not found.');
                    }
                    return definition;
                },
        
                increment: function(key, value = 1) {
                    const def = this._getDefinition(key);
                    if (def && def.type === 'COUNTER') {
                        this.reportAdapter(key, 'COUNTER', value, def.tags);
                        return true;
                    }
                    return false;
                },
        
                setGauge: function(key, value) {
                    const def = this._getDefinition(key);
                    if (def && def.type === 'GAUGE') {
                        this.reportAdapter(key, 'GAUGE', value, def.tags);
                        return true;
                    }
                    return false;
                }
            };
            return StandardizedMetricReporter;
        })()`;
    }

    private _initializeMonitoringClient() {
        // In a real system, this integrates with monitoring libraries.
        console.log(`[AGI Metric Service] Initializing with ${Object.keys(this.definitions).length} defined metrics.`);
        // Placeholder implementation to load/register metrics dynamically
        return { 
            registerCounter: (key: string, description: string) => ({ key, description, type: 'COUNTER', inc: (value: number) => { /* actual logic */ } }),
            registerGauge: (key: string, description: string) => ({ key, description, type: 'GAUGE', set: (value: any) => { /* actual logic */ } }),
            metricsHandles: {}
        };
    }

    // This adapter is the specific integration logic for the monitoring system
    private _createReportAdapter = (key: string, type: 'COUNTER' | 'GAUGE', value: any, tags: any): void => {
        // Use monitoringClient handle based on key and type if needed
        
        if (type === 'COUNTER') {
            console.log(`REPORT: COUNTER ${key} += ${value} (Tags: ${JSON.stringify(tags)})`);
        } else if (type === 'GAUGE') {
            console.log(`REPORT: GAUGE ${key} = ${value} (Tags: ${JSON.stringify(tags)})`);
        }
    }

    increment(key: string, value: number = 1): boolean {
        // Delegation to the standardized tool for validation and reporting
        return this.reporter.increment(key, value);
    }

    setGauge(key: string, value: any): boolean {
        // Delegation to the standardized tool for validation and reporting
        return this.reporter.setGauge(key, value);
    }

    // Utility to log resource costs after a major operation
    reportCycleCost(tokens: number, cyclesCompleted?: boolean) {
        this.setGauge("TOKEN_USAGE_CYCLE_TOTAL", tokens);
        if (cyclesCompleted) {
             this.increment("EVOLUTION_CYCLES_COMPLETED");
        }
    }
}

export const MetricManager = new MetricService();
