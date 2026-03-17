/**
 * AGI-KERNEL: TrustModelConfigurationStoreKernel
 * Role: High-Integrity, Persistent Storage and Retrieval for Governance Model Definitions.
 *
 * This kernel manages dynamic definitions (weights, transformations, metadata) for
 * all models used by the Trust Calculus Engine (TCE). It strictly enforces
 * asynchronous loading, schema validation, and audited persistence.
 */

import { SecureResourceLoaderInterfaceKernel } from '../tools/SecureResourceLoaderInterfaceKernel';
import { ISpecValidatorKernel } from '../tools/ISpecValidatorKernel';
import { CachePersistenceInterfaceKernel } from '../tools/CachePersistenceInterfaceKernel';
import { ILoggerToolKernel } from '../tools/ILoggerToolKernel';
import { PathRegistryKernel } from '../registries/PathRegistryKernel';
import { ConfigSchemaRegistryKernel } from '../registries/ConfigSchemaRegistryKernel';
import { IShallowObjectDiffUtilityToolKernel } from '../tools/IShallowObjectDiffUtilityToolKernel';

// Type Definitions
interface MetricConfig {
    weight: number;
    type: 'PROFIT' | 'RISK';
}

interface ModelDefinition {
    metrics: { [key: string]: MetricConfig };
    description: string;
}

interface ConfigurationCache {
    models: { [modelId: string]: ModelDefinition };
}

const TRUST_MODEL_SCHEMA_ID = 'Governance.TrustModelDefinitionSchema';
const DEFAULT_CONFIG_KEY = 'TRUST_MODEL_CONFIG_PATH';

class TrustModelConfigurationStoreKernel {
    private configCache: ConfigurationCache | null = null;
    private initialized: boolean = false;

    // Injected Dependencies
    private resourceLoader: SecureResourceLoaderInterfaceKernel;
    private specValidator: ISpecValidatorKernel;
    private persistence: CachePersistenceInterfaceKernel;
    private pathRegistry: PathRegistryKernel;
    private schemaRegistry: ConfigSchemaRegistryKernel;
    private logger: ILoggerToolKernel;
    private objectUtil: IShallowObjectDiffUtilityToolKernel;

    constructor(dependencies: {
        resourceLoader: SecureResourceLoaderInterfaceKernel;
        specValidator: ISpecValidatorKernel;
        persistence: CachePersistenceInterfaceKernel;
        pathRegistry: PathRegistryKernel;
        schemaRegistry: ConfigSchemaRegistryKernel;
        logger: ILoggerToolKernel;
        objectUtil: IShallowObjectDiffUtilityToolKernel;
    }) {
        this.#setupDependencies(dependencies);
    }

    #setupDependencies(dependencies: any): void {
        // Enforce high-integrity dependency checks
        if (!dependencies.resourceLoader || !dependencies.specValidator || !dependencies.persistence || !dependencies.logger || !dependencies.pathRegistry || !dependencies.schemaRegistry || !dependencies.objectUtil) {
            throw new Error("[TrustModelConfigurationStoreKernel] Missing critical governance dependencies.");
        }
        this.resourceLoader = dependencies.resourceLoader;
        this.specValidator = dependencies.specValidator;
        this.persistence = dependencies.persistence;
        this.pathRegistry = dependencies.pathRegistry;
        this.schemaRegistry = dependencies.schemaRegistry;
        this.logger = dependencies.logger;
        this.objectUtil = dependencies.objectUtil; // Tool for robust object manipulation
    }

    /**
     * Asynchronously initializes the kernel, loading and validating the configuration.
     * Configuration loading uses the SecureResourceLoader and validation uses ISpecValidatorKernel.
     */
    async initialize(): Promise<void> {
        if (this.initialized) {
            this.logger.warn("[TrustModelConfigurationStoreKernel] Already initialized.");
            return;
        }

        // Retrieve configuration path from Registry
        const path = await this.pathRegistry.get(DEFAULT_CONFIG_KEY) || './trust_models.json';

        try {
            this.logger.info(`[TCCS] Attempting to load governance models from: ${path}`);
            
            // 1. Load Data Securely (replaces mock loading and direct file access)
            const rawConfig = await this.resourceLoader.load(path);

            // 2. Validate against Schema (enforces high integrity)
            const schema = await this.schemaRegistry.get(TRUST_MODEL_SCHEMA_ID);
            const validationResult = await this.specValidator.validate(schema, rawConfig);

            if (!validationResult.isValid) {
                throw new Error(`Configuration failed schema validation: ${validationResult.errors.join(', ')}`);
            }

            this.configCache = rawConfig as ConfigurationCache;
            this.logger.debug(`[TCCS] Successfully loaded and validated ${Object.keys(this.configCache.models).length} trust models.`);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`[TCCS] Initialization failed for path ${path}. Using empty configuration. Error: ${errorMessage}`);
            this.configCache = { models: {} };
        }
        
        this.initialized = true;
    }

    /**
     * Retrieves the current configuration cache. Ensures initialization occurs first.
     */
    async getConfiguration(): Promise<ConfigurationCache> {
        if (!this.initialized) {
            await this.initialize();
        }
        return this.configCache || { models: {} };
    }

    /**
     * Retrieves a specific model definition by ID.
     */
    async getModelDefinition(modelId: string): Promise<ModelDefinition | undefined> {
        const config = await this.getConfiguration();
        return config.models[modelId];
    }

    /**
     * Allows dynamic updates to a specific model configuration using merging and persists the state.
     * Persistence is handled via the CachePersistenceInterfaceKernel.
     * @param {string} modelId 
     * @param {Partial<ModelDefinition>} updates 
     */
    async updateModelConfig(modelId: string, updates: Partial<ModelDefinition>): Promise<boolean> {
        if (!this.initialized) {
            this.logger.error(`[TCCS] Kernel not initialized. Update aborted.`);
            return false;
        }
        
        const config = this.configCache;
        if (!config) {
            this.logger.error(`[TCCS] Configuration cache is empty. Update aborted.`);
            return false;
        }

        const targetModel = config.models[modelId];

        if (!targetModel) {
            this.logger.error(`[TCCS] Model ${modelId} not found in cache. Update failed.`);
            return false;
        }

        try {
            // Use robust deep merging logic (simulated using objectUtil/local implementation based on target structure)
            const mergedMetrics = { ...targetModel.metrics };
            if (updates.metrics) {
                for (const key in updates.metrics) {
                    mergedMetrics[key] = {
                        ...mergedMetrics[key],
                        ...updates.metrics[key]
                    };
                }
            }
            
            const newTargetModel: ModelDefinition = {
                ...targetModel,
                ...updates,
                metrics: mergedMetrics 
            };
            
            // Re-validate the merged configuration (mandatory high-integrity check)
            const schema = await this.schemaRegistry.get(TRUST_MODEL_SCHEMA_ID);
            const validationResult = await this.specValidator.validate(schema, newTargetModel);

            if (!validationResult.isValid) {
                 this.logger.error(`[TCCS] Updated configuration for ${modelId} failed re-validation. Update aborted. Errors: ${validationResult.errors.join(', ')}`);
                 return false;
            }

            // Commit to cache
            config.models[modelId] = newTargetModel;
            
            // Persist the entire cache using high-integrity persistence kernel
            const persistencePath = await this.pathRegistry.get(DEFAULT_CONFIG_KEY) || './trust_models.json';
            await this.persistence.save(persistencePath, config);
            
            this.logger.info(`[TCCS] Deep updated configuration for ${modelId} and persisted successfully.`);
            return true;
        } catch (e) {
            this.logger.error(`[TCCS] Failed to apply updates and persist configuration for ${modelId}:`, e);
            return false;
        }
    }
}

// Exporting the kernel definition is sufficient; instantiation should occur within the kernel composition layer.
export { TrustModelConfigurationStoreKernel, ConfigurationCache, ModelDefinition, MetricConfig };