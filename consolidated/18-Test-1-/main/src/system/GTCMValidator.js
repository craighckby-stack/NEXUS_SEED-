class GTCMValidator {
    /**
     * Initializes the Validator with the GTCM configuration object.
     * @param {Object} config - The GTCM configuration data.
     */
    constructor(config) {
        if (!config || !config.CLASSIFICATION_SETS || !config.ACTIVE_SET_ID) {
            throw new Error("GTCM initialization failed: Invalid or missing configuration structure.");
        }
        const activeSetId = config.ACTIVE_SET_ID;
        this.criteria = config.CLASSIFICATION_SETS[activeSetId].CRITERIA;
        this.handlers = config.RESPONSE_HANDLERS;
    }

    /**
     * Evaluates a system payload against the active classification criteria.
     * @param {Object} payload - The input data to check (e.g., { EFFICACY: 0.9, RISK: 0.1 })
     * @returns {{status: string, metrics: Array|null, handlers?: Object}}
     */
    evaluate(payload) {
        let passed = true;
        const failedMetrics = [];

        for (const criterion of this.criteria) {
            const actualValue = payload[criterion.ID];
            if (actualValue === undefined) {
                console.warn(`Validation skipped: Payload missing required metric ID: ${criterion.ID}`);
                continue; 
            }

            let check = false;
            switch (criterion.OPERATOR) {
                case 'GTE': // Greater Than or Equal (Min Threshold)
                    check = actualValue >= criterion.THRESHOLD;
                    break;
                case 'LTE': // Less Than or Equal (Max Threshold)
                    check = actualValue <= criterion.THRESHOLD;
                    break;
                default:
                    // Future operators can be added here (e.g., 'EQ', 'RANGE')
                    check = true;
            }

            if (!check) {
                passed = false;
                failedMetrics.push({ 
                    id: criterion.ID, 
                    actual: actualValue, 
                    required: `${criterion.OPERATOR} ${criterion.THRESHOLD}` 
                });
            }
        }

        if (passed) {
            return { status: 'PASS', metrics: null };
        } else {
            return { status: 'FAIL', metrics: failedMetrics, handlers: this.handlers.ON_FAILURE };
        }
    }
}

module.exports = GTCMValidator;