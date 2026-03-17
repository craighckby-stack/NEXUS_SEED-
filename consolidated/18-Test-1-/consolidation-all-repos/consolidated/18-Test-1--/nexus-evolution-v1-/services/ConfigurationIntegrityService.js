import { validateSchema, applyPolicyConstraints, migrationHooks } from './schemaUtilities';

/**
 * ConfigurationIntegrityService: Ensures all persistent configuration objects adhere
 * to AGCA_PCTM_V1 (or higher) standards and manages version migration dynamically.
 * Optimizes computational flow by integrating validation and migration into a recursive pipeline.
 */
export class ConfigurationIntegrityService {
  #currentSchema;

  constructor(schemaVersion = 'v1.1') {
    this.#currentSchema = schemaVersion;
  }

  /**
   * Validates a loaded configuration object against the current schema definition.
   * This function serves as the primary entry point for integrity checking, 
   * recursively triggering migration if the schema version is outdated.
   * @param {object} configData - The configuration object to validate.
   */
  async validate(configData) {
    const metadata = configData?.metadata;
    const targetSchema = this.#currentSchema;

    if (!metadata || metadata.schemaVersion === undefined) {
      throw new Error('Configuration lacks required metadata.');
    }

    // Computational Efficiency: Check version first. Trigger migration pipeline if needed.
    // This integrates the version check and migration initiation into the primary validation step.
    if (metadata.schemaVersion < targetSchema) {
      return this.migrate(configData); 
    }
    
    // Direct validation for current or newer versions.
    const validationResult = validateSchema(configData, targetSchema);
    
    if (!validationResult.isValid) {
      throw new Error(`Configuration invalid: ${validationResult.errors}`);
    }

    // Efficiency: Return validated data directly (validationResult.data is typically the cleaned object)
    return validationResult.data || configData;
  }

  /**
   * Attempts to gracefully migrate an older configuration to the current standard.
   * Uses recursive abstraction by calling `validate` to ensure the migrated output 
   * immediately passes integrity checks.
   * @param {object} oldConfig - The configuration object requiring migration.
   */
  async migrate(oldConfig) {
    // Optimization: Skip migration overhead if version is already current or newer (defense in depth)
    if (oldConfig.metadata.schemaVersion >= this.#currentSchema) {
        return oldConfig;
    }

    console.log(`Migrating configuration from ${oldConfig.metadata.schemaVersion} to ${this.#currentSchema}...`);
    
    // Computational Efficiency: Execute migration logic
    const newConfig = migrationHooks.execute(oldConfig, this.#currentSchema);
    
    // Recursive Abstraction: Re-validate the newly migrated object using the core pipeline.
    return this.validate(newConfig); 
  }

  /**
   * Applies mandatory runtime policy constraints defined in the schema.
   */
  async enforceRuntimePolicy(configData) {
    return applyPolicyConstraints(configData.policy);
  }
}