/**
 * CFTMValidatorKernel is responsible for asynchronously loading, validating, 
 * and providing typed access to critical Governance Axiom (GAX) constants
 * required for Core Faith and Trust Model (CFTM) calculations.
 * 
 * This kernel replaces synchronous configuration loading and global state access
 * with dependency injection and asynchronous initialization.
 */
export class CFTMValidatorKernel {
    private readonly configRegistry: ICFTMConfigRegistryKernel;
    private readonly rulesRegistry: ICFTMValidationRulesRegistryKernel;
    private readonly specValidator: ISpecValidatorKernel;
    private readonly logger: ILoggerToolKernel;
    
    // Stores validated and immutable constants
    private constants: ReadonlyMap<string, number>;

    /**
     * Rigorous formalization and injection of dependencies.
     * Dependencies: ICFTMConfigRegistryKernel, ICFTMValidationRulesRegistryKernel,
     * ISpecValidatorKernel (replacing INumericalConfigValidator), ILoggerToolKernel.
     */
    constructor(
        configRegistry: ICFTMConfigRegistryKernel,
        rulesRegistry: ICFTMValidationRulesRegistryKernel,
        specValidator: ISpecValidatorKernel,
        logger: ILoggerToolKernel
    ) {
        this.#setupDependencies({ configRegistry, rulesRegistry, specValidator, logger });
        this.constants = new Map();
    }

    /** Isolates synchronous dependency validation and assignment. */
    #setupDependencies(deps: any): void {
        if (!deps.configRegistry || !deps.rulesRegistry || !deps.specValidator || !deps.logger) {
            throw new Error("CFTMValidatorKernel: Missing required dependencies.");
        }
        this.configRegistry = deps.configRegistry;
        this.rulesRegistry = deps.rulesRegistry;
        this.specValidator = deps.specValidator;
        this.logger = deps.logger;
    }

    /**
     * Initializes the kernel by asynchronously loading the configuration,
     * fetching validation rules, executing validation, and freezing the state.
     */
    public async initialize(): Promise<void> {
        this.constants = await this.#loadAndValidate();
        // Ensure state is immutable after initialization
        Object.freeze(this.constants);
    }

    private async #loadAndValidate(): Promise<Map<string, number>> {
        this.logger.debug("Attempting to load CFTM configuration and rules asynchronously.");
        
        // 1. Asynchronously retrieve configuration and rules
        const [configObject, rules] = await Promise.all([
            this.configRegistry.getCFTMConfig(),
            this.rulesRegistry.getValidationRules()
        ]);
        
        // 2. Execute validation using the generalized Spec Validator Tool Kernel
        // Note: Assumes ISpecValidatorKernel has a method that performs validation and constant extraction.
        const result: ValidationResult = await this.specValidator.validateConfigRules({
            configObject,
            rules
        });

        if (!result.isValid) {
            const errorDetails = result.errors.join('; ');
            this.logger.error(`[CFTM] Configuration validation failed: ${errorDetails}`);
            // Throw a structured PolicyError upon critical validation failure
            throw new PolicyError({ 
                message: `Critical CFTM configuration validation failed.`,
                details: errorDetails
            });
        }
        
        this.logger.debug("CFTM configuration validated successfully. Constants extracted.");
        return result.constants;
    }

    /** Retrieves a constant value by its defined key (e.g., 'DENOMINATOR_STABILITY_TAU') */
    public getConstant(key: string): number {
        const value = this.constants.get(key);
        if (value === undefined) {
            this.logger.warn(`[CFTM] Attempted to retrieve unknown constant: ${key}`);
            throw new ReferenceError(`[CFTM] Requested unknown or uninitialized constant: ${key}`);
        }
        return value;
    }
}