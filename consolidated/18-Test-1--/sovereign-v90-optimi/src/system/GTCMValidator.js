import { MetricThresholdEvaluator } from '@kernel/plugins'; // Placeholder for tool import

class GTCMValidator {
    private criteria: any[];
    private handlers: any;
    private readonly metricEvaluator: any; // Tool instance

    /**
     * Initializes the Validator with the GTCM configuration object.
     * @param {Object} config - The GTCM configuration data.
     */
    constructor(config: any) {
        if (!config || !config.CLASSIFICATION_SETS || !config.ACTIVE_SET_ID) {
            throw new Error("GTCM initialization failed: Invalid or missing configuration structure.");
        }
        
        // Access the MetricThresholdEvaluator plugin (assuming import or static access)
        this.metricEvaluator = MetricThresholdEvaluator; 

        const activeSetId = config.ACTIVE_SET_ID;
        
        const activeSet = config.CLASSIFICATION_SETS[activeSetId];
        if (!activeSet || !activeSet.CRITERIA) {
             throw new Error(`GTCM initialization failed: Active classification set '${activeSetId}' is invalid or missing criteria.`);
        }

        this.criteria = activeSet.CRITERIA;
        this.handlers = config.RESPONSE_HANDLERS;
    }

    /**
     * Evaluates a system payload against the active classification criteria.
     * @param {Object} payload - The input data to check (e.g., { EFFICACY: 0.9, RISK: 0.1 })
     * @returns {{status: string, metrics: Array|null, handlers?: Object}}
     */
    evaluate(payload: any): { status: string, metrics: any[] | null, handlers?: any } {
        
        // Delegate core comparison logic to the extracted plugin
        const evaluation = this.metricEvaluator.execute({
            payload: payload,
            criteria: this.criteria
        });

        if (evaluation.passed) {
            return { status: 'PASS', metrics: null };
        } else {
            const onFailureHandlers = this.handlers ? this.handlers.ON_FAILURE : undefined;
            
            return { 
                status: 'FAIL', 
                metrics: evaluation.failedMetrics, 
                handlers: onFailureHandlers
            };
        }
    }
}

module.exports = GTCMValidator;