// This critical service implements the reactive measures defined in GFRM_Policy.json.

const GFRM_Policy = require('../../config/governance/GFRM_Policy.json');

class PolicyEnforcementEngine {
    constructor(kernelRef) {
        this.policy = GFRM_Policy;
        this.kernel = kernelRef; 
    }

    /**
     * Evaluates a generated risk score against the policy thresholds.
     * @param {string} riskCategory - e.g., 'Existential_Drift'
     * @param {number} score - Measured risk score (0.0 - 1.0)
     */
    evaluateAndEnforce(riskCategory, score) {
        const riskConfig = this.policy.risk_matrix.categories[riskCategory];

        if (riskConfig && score >= riskConfig.threshold) {
            const directiveKey = riskConfig.response_key;
            const directive = this.policy.enforcement_directives[directiveKey];

            if (directive) {
                console.warn(`[GFRM] Policy Violation Detected: ${riskCategory}. Executing ${directiveKey}.`);
                // Dispatch the defined action, highly protected execution zone.
                this.dispatchAction(directive);
                return true;
            }
        }
        return false;
    }

    dispatchAction(directive) {
        // Note: Actual implementation would interface with hardware/kernel APIs.
        if (directive.action.includes('Hard shutdown')) {
            // Highly secured, irreversible command sequence
            this.kernel.system.initiateHardStop();
        } else if (directive.action.includes('Segmented quarantine')) {
            this.kernel.resourceManager.isolateSubsystem();
        }
        // Notify relevant systems
        directive.alert.forEach(target => this.kernel.notifications.send(target, directive.action));
    }
}

module.exports = PolicyEnforcementEngine;