/**
 * Component ID: RTM-K
 * Name: Runtime Threshold Manager Kernel
 * Function: Manages persistent storage, validation, and real-time distribution of the system's
 *           governance parameters (weights, thresholds, severity boosts).
 * Rationale: Ensures that constraint evaluation is driven by a single, dynamically configurable source of truth,
 *            decoupling constraint values from application code defaults, in compliance with kernel mandates.
 */

// --- Strategic Kernel and Interface Imports ---
const ISpecValidatorKernel = "ISpecValidatorKernel";
const SecureResourceLoaderInterfaceKernel = "SecureResourceLoaderInterfaceKernel";
const ILoggerToolKernel = "ILoggerToolKernel";
// Conceptual Registry Kernel for externalizing configuration paths and schemas.
const IRuntimeThresholdConfigRegistryKernel = "IRuntimeThresholdConfigRegistryKernel"; 

class RuntimeThresholdManagerKernel {
    #secureLoader;
    #validator;
    #logger;
    #configRegistry;

    #currentConstraints = {};
    #isLoaded = false;
    #configPath;
    #constraintSchema;

    /**
     * @param {object} dependencies
     * @param {SecureResourceLoaderInterfaceKernel} dependencies.secureLoader High integrity resource loader.
     * @param {ISpecValidatorKernel} dependencies.validator High integrity specification validator.
     * @param {ILoggerToolKernel} dependencies.logger Standard logging tool.
     * @param {IRuntimeThresholdConfigRegistryKernel} dependencies.configRegistry Registry for configuration paths and schemas.
     */
    constructor(dependencies) {
        this.#setupDependencies(dependencies);
    }

    #setupDependencies(dependencies) {
        if (!dependencies.secureLoader || !dependencies.validator || !dependencies.logger || !dependencies.configRegistry) {
            throw new Error("RTM Kernel initialization failed: Missing required dependencies (secureLoader, validator, logger, configRegistry).");
        }
        this.#secureLoader = dependencies.secureLoader;
        this.#validator = dependencies.validator;
        this.#logger = dependencies.logger;
        this.#configRegistry = dependencies.configRegistry;
    }

    /**
     * Asynchronously initializes the kernel by loading configuration path and schema, and triggering constraints loading.
     * @async
     */
    async initialize() {
        this.#logger.debug("[RTM] Initializing Kernel: Retrieving configuration metadata.");
        
        // 1. Load path and schema from Registry Kernel (asynchronously)
        const config = await this.#configRegistry.getConstraintConfiguration();
        
        if (!config || !config.path || !config.schema) {
            this.#logger.error("RTM Kernel failed initialization: Could not retrieve path or schema from config registry.");
            throw new Error("Configuration metadata missing.");
        }

        this.#configPath = config.path;
        this.#constraintSchema = config.schema;
        
        // 2. Load constraints using the retrieved path/schema
        await this.loadConfiguration();
    }

    /**
     * Loads constraints from the persistent layer, safely parses, and validates them.
     * @async
     */
    async loadConfiguration() {
        let rawConfigData;
        try {
            // Use SecureResourceLoaderInterfaceKernel for high-integrity resource reading
            rawConfigData = await this.#secureLoader.readResource(this.#configPath);
        } catch (readError) {
            this.#logger.error(`[RTM] Failed to read raw constraint configuration from ${this.#configPath}. Falling back.`, { error: readError });
            this.#currentConstraints = {}; 
            this.#isLoaded = false;
            return;
        }

        let parsedConfig;
        try {
            // Assuming the raw data is a string/buffer containing JSON
            parsedConfig = JSON.parse(rawConfigData.toString());
        } catch (parseError) {
            this.#logger.error(`[RTM] Failed to parse configuration data.`, { error: parseError });
            this.#currentConstraints = {}; 
            this.#isLoaded = false;
            return;
        }
        
        // Use ISpecValidatorKernel for high-integrity validation
        const validationResult = await this.#validator.validate(this.#constraintSchema, parsedConfig);
        
        if (validationResult.isValid) {
            this.#currentConstraints = parsedConfig;
            this.#isLoaded = true;
            this.#logger.info("[RTM] Constraints loaded and validated successfully.");
        } else {
            this.#logger.error(`[RTM] Constraint configuration failed validation. Errors:`, validationResult.errors);
            this.#currentConstraints = {}; 
            this.#isLoaded = false;
        }
    }

    /**
     * Retrieves the current, validated governance constraints.
     * @returns {Record<string, any>} A defensive copy of the configuration object.
     */
    getConstraints() {
        return { ...this.#currentConstraints };
    }

    /**
     * Updates a single constraint parameter.
     * @async
     * @param {string} metricKey
     * @param {Record<string, any>} newParams { threshold, weight, severity_boost }
     */
    async updateConstraint(metricKey, newParams) {
        if (!this.#currentConstraints[metricKey]) {
            this.#logger.warn(`Attempted update for unknown metric key: ${metricKey}. Ignoring.`);
            return;
        }
        
        // In a real scenario, full validation against schema would occur here before assignment.
        this.#currentConstraints[metricKey] = { ...this.#currentConstraints[metricKey], ...newParams };
        this.#logger.info(`[RTM] Constraint updated for ${metricKey}. Persistence update required (simulation).`);
    }
}

module.exports = RuntimeThresholdManagerKernel;
