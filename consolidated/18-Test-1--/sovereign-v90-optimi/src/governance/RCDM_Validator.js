import { ISpecValidatorKernel } from '@core/validation/ISpecValidatorKernel';
import { HashIntegrityCheckerToolKernel } from '@core/integrity/HashIntegrityCheckerToolKernel';
import { ConfigSchemaRegistryKernel } from '@core/registry/ConfigSchemaRegistryKernel';
import { CachePersistenceInterfaceKernel } from '@core/cache/CachePersistenceInterfaceKernel';
import { ILoggerToolKernel } from '@core/utility/ILoggerToolKernel';

// Standard key for the RCDM Schema retrieved from the registry
const RCDM_SCHEMA_KEY = 'Governance.RCDM.ConfigurationSchema'; 

/**
 * Type definition for validation result aligned with external interfaces.
 */
interface ValidationResult {
    valid: boolean;
    errors: any[] | null;
}

/**
 * RCDMValidatorKernel: Recursive Configuration Data Model Validator Kernel
 * 
 * Enforces architectural mandates by utilizing asynchronous initialization,
 * strict dependency injection, and leveraging high-integrity strategic kernels
 * for validation, hashing, configuration retrieval, and cache management.
 */
class RCDMValidatorKernel {
    private schema: object | null = null;
    private schemaId: string | null = null;
    private instanceId: string;

    // Injected Dependencies
    private readonly specValidatorKernel: ISpecValidatorKernel;
    private readonly hashIntegrityCheckerTool: HashIntegrityCheckerToolKernel;
    private readonly configSchemaRegistry: ConfigSchemaRegistryKernel;
    private readonly cachePersistenceKernel: CachePersistenceInterfaceKernel;
    private readonly logger: ILoggerToolKernel; 

    /**
     * @param dependencies Dependencies injected via the IoC container.
     */
    constructor(dependencies: {
        specValidatorKernel: ISpecValidatorKernel,
        hashIntegrityCheckerTool: HashIntegrityCheckerToolKernel,
        configSchemaRegistry: ConfigSchemaRegistryKernel,
        cachePersistenceKernel: CachePersistenceInterfaceKernel,
        logger: ILoggerToolKernel
    }) {
        // Generates a unique instance ID for logging and tracing (replaces TraceableIdGenerator usage)
        this.instanceId = `RCDM_VAL_KRNL_${Date.now()}`;
        this.#setupDependencies(dependencies);
    }

    /**
     * Isolates synchronous dependency assignment and validation, satisfying the architectural mandate.
     */
    #setupDependencies(dependencies: any): void {
        const missingDeps = ['specValidatorKernel', 'hashIntegrityCheckerTool', 'configSchemaRegistry', 'cachePersistenceKernel', 'logger']
            .filter(key => !dependencies[key]);
        
        if (missingDeps.length > 0) {
            throw new Error(`RCDMValidatorKernel failed dependency injection setup. Missing: ${missingDeps.join(', ')}`);
        }

        this.specValidatorKernel = dependencies.specValidatorKernel;
        this.hashIntegrityCheckerTool = dependencies.hashIntegrityCheckerTool;
        this.configSchemaRegistry = dependencies.configSchemaRegistry;
        this.cachePersistenceKernel = dependencies.cachePersistenceKernel;
        this.logger = dependencies.logger;
    }

    /**
     * Asynchronously initializes the kernel by loading the required RCDM schema
     * from the configuration registry and calculating its stable hash ID.
     * This replaces synchronous schema loading and ad-hoc hashing.
     */
    public async initialize(): Promise<void> {
        this.logger.debug(`[${this.instanceId}] Initializing RCDMValidatorKernel...`);
        try {
            // 1. Load the RCDM schema asynchronously from the strategic registry
            const schema = await this.configSchemaRegistry.getSchema(RCDM_SCHEMA_KEY);
            
            if (!schema) {
                const msg = `Required RCDM schema key not found: ${RCDM_SCHEMA_KEY}`;
                this.logger.fatal(msg);
                throw new Error(msg);
            }
            
            this.schema = schema;

            // 2. Calculate the stable schema ID (replaces CanonicalHashingTool usage)
            this.schemaId = await this.hashIntegrityCheckerTool.generateStableHash(this.schema);
            
            // 3. Register the schema with the high-integrity validator kernel for compilation
            await this.specValidatorKernel.registerSchema(this.schemaId, this.schema);

            this.logger.info(`[${this.instanceId}] Initialized successfully. Schema ID: ${this.schemaId}`);
            
        } catch (error) {
            this.logger.fatal(`[${this.instanceId}] Initialization error.`, { error: error.message });
            throw error;
        }
    }

    /**
     * Asynchronously validates the input data against the current RCDM schema.
     * Replaces the synchronous validate() method.
     * 
     * @param data The configuration data payload.
     * @returns Promise<ValidationResult>
     */
    public async validate(data: any): Promise<ValidationResult> {
        if (!this.schemaId) {
            this.logger.error(`[${this.instanceId}] Validation failed: Schema not initialized.`);
            return { valid: false, errors: [{ code: 'RCDM_E_001', message: "RCDM Schema not initialized. Call initialize() first." }] };
        }
        
        // Delegate high-performance, cached validation to the ISpecValidatorKernel.
        try {
            const result = await this.specValidatorKernel.validate(this.schemaId, data);
            
            return {
                valid: result.isValid,
                errors: result.errors || null
            };
        } catch (e) {
             this.logger.error(`[${this.instanceId}] Validation execution failed.`, { error: e.message });
             return { valid: false, errors: [{ code: 'RCDM_E_002', message: `Validation execution failed: ${e.message}` }] };
        }
    }

    /**
     * Invalidates all cached validation results associated with the RCDM schema scope.
     * Uses the strategic Cache Persistence Kernel for high-integrity cache manipulation.
     */
    public async invalidateCache(): Promise<void> {
        this.logger.warn(`[${this.instanceId}] Triggering RCDM validation cache invalidation for scope.`);
        
        const scopeId = this.schemaId || RCDM_SCHEMA_KEY;
        
        // Purge entries based on the schema's unique ID or key, aligning with the original sweeping cache clear functionality.
        await this.cachePersistenceKernel.purgeByScope(scopeId);
    }
}

export { RCDMValidatorKernel };