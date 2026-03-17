import { AbstractKernel } from '@kernel/AbstractKernel';

/**
 * ConfigurationIntegrityKernel is responsible for verifying the structural integrity
 * and cryptographic hash of configuration objects before they are applied or trusted.
 * It delegates hashing and schema validation to specialized high-integrity tools.
 * This component replaces the synchronous ConfigIntegrityMonitor.
 */
class ConfigurationIntegrityKernel extends AbstractKernel {

    /**
     * @param {object} dependencies - Injected dependencies.
     * @param {ILoggerToolKernel} dependencies.ILoggerToolKernel - For auditable logging.
     * @param {HashIntegrityCheckerToolKernel} dependencies.HashIntegrityCheckerToolKernel - For calculating and verifying configuration hashes.
     * @param {ISpecValidatorKernel} dependencies.ISpecValidatorKernel - For validating configuration data against registered schemas.
     * @param {ConfigSchemaRegistryKernel} dependencies.ConfigSchemaRegistryKernel - For retrieving necessary configuration schemas.
     */
    constructor(dependencies) {
        super(dependencies);
    }

    /**
     * Ensures all required dependencies are present and sets internal references.
     * @private
     */
    #setupDependencies() {
        const {
            ILoggerToolKernel,
            HashIntegrityCheckerToolKernel,
            ISpecValidatorKernel,
            ConfigSchemaRegistryKernel
        } = this.dependencies;

        if (!ILoggerToolKernel || !HashIntegrityCheckerToolKernel || !ISpecValidatorKernel || !ConfigSchemaRegistryKernel) {
            throw new Error("ConfigurationIntegrityKernel requires ILoggerToolKernel, HashIntegrityCheckerToolKernel, ISpecValidatorKernel, and ConfigSchemaRegistryKernel.");
        }
        
        this.logger = ILoggerToolKernel;
        this.hashChecker = HashIntegrityCheckerToolKernel;
        this.validator = ISpecValidatorKernel;
        this.schemaRegistry = ConfigSchemaRegistryKernel;
    }

    /**
     * Asynchronously initializes the kernel, setting up dependencies and performing initial readiness checks.
     * @async
     */
    async initialize() {
        this.#setupDependencies();
        this.logger.info('ConfigurationIntegrityKernel initializing...');
        
        // Example: Perform a basic check to ensure the schema registry is accessible.
        try {
            await this.schemaRegistry.isReady();
            this.logger.debug('ConfigurationIntegrityKernel initialized successfully.');
            this.isInitialized = true;
        } catch (error) {
            this.logger.fatal(`ConfigurationIntegrityKernel failed initialization due to registry access error: ${error.message}`);
            throw error;
        }
    }

    /**
     * Verifies the integrity of a configuration object against an expected hash and its registered schema.
     * 
     * @param {string} configId - Identifier used to fetch the schema (e.g., 'GovernanceSettingsSchema').
     * @param {object} configData - The configuration data object to verify.
     * @param {string} expectedHash - The known good hash to compare against.
     * @returns {Promise<{isValid: boolean, validationErrors: Array<string>, calculatedHash: string}>}
     * @async
     */
    async verifyIntegrity(configId, configData, expectedHash) {
        if (!this.isInitialized) {
            throw new Error("ConfigurationIntegrityKernel is not initialized.");
        }
        
        this.logger.trace(`Beginning integrity verification for configuration: ${configId}`);
        const errors = [];
        let calculatedHash = null;

        // 1. Schema Validation (Structural Integrity)
        try {
            const schema = await this.schemaRegistry.getSchema(configId);
            if (schema) {
                const validationResult = await this.validator.validate(schema, configData);
                if (!validationResult.isValid) {
                    this.logger.warn(`Schema validation failed for ${configId}. Structural errors detected.`);
                    errors.push(...validationResult.errors);
                }
            } else {
                this.logger.warning(`No registered schema found for ${configId}. Skipping structural validation.`);
            }
        } catch (e) {
            this.logger.error(`Error during schema retrieval/validation for ${configId}: ${e.message}`);
            errors.push(`Internal schema validation error: ${e.message}`);
        }

        // 2. Hash Integrity Check (Content Integrity)
        try {
            const hashCheckResult = await this.hashChecker.verifyHash(configData, expectedHash);
            calculatedHash = hashCheckResult.calculatedHash; // Record the calculated hash for audit
            
            if (!hashCheckResult.isValid) {
                this.logger.error(`Hash integrity check failed for ${configId}. Hash mismatch.`);
                errors.push(`Configuration hash mismatch. Expected: ${expectedHash}, Calculated: ${calculatedHash}`);
            }
        } catch (e) {
            this.logger.error(`Error during hash verification for ${configId}: ${e.message}`);
            errors.push(`Internal hash verification error: ${e.message}`);
        }

        const isValid = errors.length === 0;

        if (isValid) {
            this.logger.info(`Integrity check successful for ${configId}.`);
        } else {
             // Dispersing audit failure for critical governance configuration check
            await this.logger.audit(`Integrity failure detected for ${configId}.`, { errors, configId, expectedHash, calculatedHash });
        }

        return { isValid, validationErrors: errors, calculatedHash };
    }
}

export { ConfigurationIntegrityKernel };
