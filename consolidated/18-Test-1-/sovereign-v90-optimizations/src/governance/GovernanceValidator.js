/**
 * Governance Settings Schema Validator Kernel (v1.0)
 * Enforces strict bounds, integrity checks, and type constraints on GHM configuration settings.
 */

class GovernanceValidatorKernel {
    /**
     * @param {object} dependencies
     * @param {ISpecValidatorKernel} dependencies.specValidator - Strategic tool for configuration validation.
     * @param {GovernanceSettingsRegistryKernel} dependencies.settingsRegistry - Registry for governance schemas.
     * @param {ILoggerToolKernel} dependencies.logger - Standardized logger.
     */
    constructor({ specValidator, settingsRegistry, logger }) {
        this._schema = null;
        this._specValidator = specValidator;
        this._settingsRegistry = settingsRegistry;
        this._logger = logger;
        this.#setupDependencies();
    }

    #setupDependencies() {
        // ISpecValidatorKernel must be present and expose the required validation method.
        if (!this._specValidator || typeof this._specValidator.validateConfigRules !== 'function') {
            throw new Error('Dependency Missing: ISpecValidatorKernel is required with validateConfigRules method.');
        }
        // GovernanceSettingsRegistryKernel must be present and provide schema retrieval.
        if (!this._settingsRegistry || typeof this._settingsRegistry.getGovernanceSettingsSchema !== 'function') {
            throw new Error('Dependency Missing: GovernanceSettingsRegistryKernel is required.');
        }
        if (!this._logger) {
            throw new Error('Dependency Missing: ILoggerToolKernel is required.');
        }
    }

    /**
     * Loads the required governance schema asynchronously from the registry.
     */
    async initialize() {
        this._schema = await this._settingsRegistry.getGovernanceSettingsSchema();
        if (!this._schema || Object.keys(this._schema).length === 0) {
            this._logger.error('Initialization Failure: Failed to load GHM Governance Schema from registry.', { component: 'GovernanceValidatorKernel' });
            throw new Error('Kernel initialization failed: Missing governance schema.');
        }
    }

    /**
     * Validates a loaded configuration object against defined constraints.
     * 
     * @param {object} settings - The finalized GOVERNANCE_SETTINGS object.
     * @returns {Promise<boolean>} Resolves to true if validation passes.
     * @throws {Error} If any setting violates its constraints (critical failure).
     */
    async validateGovernanceSettings(settings) {
        if (!this._schema) {
            throw new Error('Kernel not initialized. Schema is required for validation.');
        }
        
        // Delegate validation using the injected tool kernel
        const failureReports = await this._specValidator.validateConfigRules(settings, this._schema);

        if (failureReports && failureReports.length > 0) {
            const detailedFailures = failureReports.map(
                (f, i) => `[${i + 1}] ${f.key} (${f.reason || 'Constraint Violation'}): ${f.message}`
            ).join('\n');

            const errorMsg = `GHM Configuration Integrity Failure (${failureReports.length} violations found):\n${detailedFailures}`;

            this._logger.error({
                message: errorMsg,
                violations: failureReports,
                component: 'GovernanceValidatorKernel',
                code: 'CONFIG_INTEGRITY_FAIL'
            });

            // Throw structured error
            const err = new Error(errorMsg);
            err.name = 'ConfigurationIntegrityError';
            err.violations = failureReports;
            throw err;
        }

        this._logger.debug('Governance settings validated successfully (Type & Bounds enforced).', { component: 'GovernanceValidatorKernel' });
        return true;
    }
}

module.exports = GovernanceValidatorKernel;