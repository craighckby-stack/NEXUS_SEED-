/**
 * @fileoverview Concrete implementation of ConfigValidator that runs a series of ordered
 * sub-validators (GRCMs) and aggregates their results.
 */

const { ConfigValidator } = require('../interfaces/ConfigValidator');

/**
 * CompositeConfigValidator
 * Purpose: Executes an ordered sequence of granular rule checking modules (GRCMs) 
 * to ensure comprehensive validation coverage.
 */
class CompositeConfigValidator extends ConfigValidator {
    /**
     * @param {ConfigValidator[]} validators - An array of concrete validator instances (GRCMs).
     */
    constructor(validators = []) {
        super();
        if (!Array.isArray(validators)) {
            throw new Error("CompositeConfigValidator expects an array of validators.");
        }
        // Filters out non-validator instances if stricter checks are necessary later.
        this.validators = validators;
        console.log(`Composite Validator initialized with ${this.validators.length} modules.`);
    }

    /**
     * @override
     * @param {Object} config - The configuration object to validate.
     * @returns {Promise<import('../interfaces/ConfigValidator').GOV_ValidationResult>}
     */
    async validate(config) {
        const allErrors = [];

        // Execute validators sequentially to potentially save on expensive subsequent checks
        // if an early critical failure is detected.
        for (const validator of this.validators) {
            // Note: Parallel execution (Promise.all) might be faster, but sequential 
            // execution often allows for earlier failure return and dependency ordering.
            const result = await validator.validate(config);
            
            if (!result.isValid) {
                allErrors.push(...result.errors);
            }
            
            // Fail fast mechanism: Optional based on governance requirements, 
            // but often preferred to prevent processing deeply flawed config.
            // if (allErrors.length > 5) break; // Example implementation of soft fail-fast
        }

        return {
            isValid: allErrors.length === 0,
            errors: allErrors,
        };
    }
}

module.exports = CompositeConfigValidator;
