/**
 * @fileoverview Manages and orchestrates the execution of multiple concrete ConfigValidator implementations.
 */

const { ConfigValidator, ValidationResult } = require('../interfaces/ConfigValidator');

/**
 * Service responsible for registering Governance Rule Checking Modules (GRCMs)
 * and aggregating their validation results into a single system report.
 */
class ValidationOrchestrator {
    constructor() {
        /** @type {ConfigValidator[]} */
        this.validators = [];
    }

    /**
     * Registers a concrete governance validator module.
     * @param {ConfigValidator} validatorInstance - An instance of a concrete ConfigValidator subclass.
     */
    registerValidator(validatorInstance) {
        if (!(validatorInstance instanceof ConfigValidator)) {
            throw new Error("Attempted to register non-ConfigValidator object.");
        }
        this.validators.push(validatorInstance);
        console.log(`[ValidationOrchestrator] Registered validator: ${validatorInstance.constructor.name}`);
    }

    /**
     * Executes all registered validators against the proposed configuration concurrently.
     * @param {Object} config - The configuration payload to validate.
     * @returns {Promise<ValidationResult>} Unified validation results.
     */
    async validateSystemConfig(config) {
        if (this.validators.length === 0) {
            console.warn("[ValidationOrchestrator] No validators registered. Configuration passed by default.");
            return { isValid: true, errors: [] };
        }

        // Execute all validators concurrently
        const results = await Promise.allSettled(
            this.validators.map(v => v.validate(config))
        );

        const finalResult = { isValid: true, errors: [] };

        results.forEach(res => {
            if (res.status === 'fulfilled') {
                const validationResult = res.value;
                if (!validationResult.isValid) {
                    finalResult.isValid = false;
                    finalResult.errors.push(...validationResult.errors);
                }
            } else if (res.status === 'rejected') {
                // Critical failure in a validator itself (e.g., DB connection loss)
                finalResult.isValid = false;
                finalResult.errors.push({
                    ruleId: 'ORCH-CRIT-FAIL',
                    message: `Validator failed execution: ${res.reason.message || String(res.reason)}`,
                    path: null
                });
            }
        });

        return finalResult;
    }
}

module.exports = ValidationOrchestrator;
