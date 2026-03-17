/**
 * src/governance/IMetricConfigurationValidatorToolKernel.js
 *
 * Defines the high-integrity, asynchronous kernel responsible for validating
 * metric configuration objects, ensuring adherence to governance policies
 * (e.g., weight constraints, sum total validation). This replaces the synchronous
 * metricWeightValidator utility function.
 */

import { ISpecValidatorKernel } from '@AGI-KERNEL/ISpecValidatorKernel';
import { ValidationRuleConfigRegistry } from '@AGI-KERNEL/ValidationRuleConfigRegistry';
import { ILoggerToolKernel } from '@AGI-KERNEL/ILoggerToolKernel';

class MetricConfigurationValidatorToolKernel {
    /**
     * @param {ISpecValidatorKernel} specValidator - Kernel for generic specification validation.
     * @param {ValidationRuleConfigRegistry} ruleRegistry - Registry for loading immutable validation rules.
     * @param {ILoggerToolKernel} logger - Auditable logging tool.
     */
    constructor(specValidator, ruleRegistry, logger) {
        // Strict type checking enforcing high-integrity dependencies
        if (!specValidator || !ruleRegistry || !logger) {
            throw new Error("All dependencies (ISpecValidatorKernel, ValidationRuleConfigRegistry, ILoggerToolKernel) are required.");
        }

        this.specValidator = specValidator;
        this.ruleRegistry = ruleRegistry;
        this.logger = logger;
        this.validationSpec = null;
        this.isInitialized = false;
    }

    /**
     * Asynchronously initializes the kernel by loading required validation specifications.
     * @returns {Promise<void>}
     */
    async initialize() {
        // Load metric validation specification rules from the auditable registry
        // The registry is mandated to return immutable specifications.
        this.validationSpec = await this.ruleRegistry.getMetricWeightValidationRules();
        this.isInitialized = true;
        this.logger.logDebug('IMetricConfigurationValidatorToolKernel initialized and specifications loaded.');
    }

    /**
     * Asynchronously validates a metric configuration object against defined governance rules.
     * This enforces high computational efficiency by delegating complex validation logic
     * (e.g., summing weights, range checks) to the specialized ISpecValidatorKernel.
     * 
     * @param {Readonly<Object>} metricConfig - The configuration containing metric weights/parameters.
     * @returns {Promise<Readonly<{isValid: boolean, errors: ReadonlyArray<string>}>>}
     */
    async validateMetricConfiguration(metricConfig) {
        if (!this.isInitialized) {
            throw new Error("Kernel not initialized. Call initialize() first.");
        }

        // Delegation to ISpecValidatorKernel ensures recursive abstraction and auditable validation path
        const results = await this.specValidator.validate(
            metricConfig, 
            this.validationSpec, 
            'MetricWeightConstraints'
        );

        this.logger.logAudit(`Metric configuration validation completed. Valid: ${results.isValid}`);
        
        return Object.freeze(results);
    }
}