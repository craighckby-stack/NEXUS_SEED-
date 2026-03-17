import { ILoggerToolKernel } from './interfaces/ILoggerToolKernel';
import { IThresholdLookupValidatorToolKernel } from './interfaces/IThresholdLookupValidatorToolKernel';
import { ConfigDefaultsRegistryKernel } from './registry/ConfigDefaultsRegistryKernel';

/**
 * AGI-KERNEL v7.11.3 [STRATEGIC_AGENCY]
 * ResourceThresholdsConfigRegistryKernel (RTC-G02 Refactored)
 *
 * Strategic Mandate: Decouple static configuration, ensure asynchronous loading, 
 * and formalize dependency injection for high-integrity governance thresholds.
 */
class ResourceThresholdsConfigRegistryKernel {
    private logger: ILoggerToolKernel;
    private thresholdValidator: IThresholdLookupValidatorToolKernel;
    private configRegistry: ConfigDefaultsRegistryKernel;

    private activeVersion: string = 'V1';
    private activeConfig: Readonly<Record<string, number>> = {};
    private readonly configKey: string = 'GOVERNANCE_RESOURCE_THRESHOLDS'; // Standardized registry key

    /**
     * @param logger High-integrity logging tool (conceptual dependency).
     * @param thresholdValidator Specialized tool for strict threshold lookup and validation.
     * @param configRegistry Registry for asynchronous retrieval of default configuration data.
     */
    constructor(
        logger: ILoggerToolKernel,
        thresholdValidator: IThresholdLookupValidatorToolKernel,
        configRegistry: ConfigDefaultsRegistryKernel
    ) {
        this.logger = logger;
        this.thresholdValidator = thresholdValidator;
        this.configRegistry = configRegistry;
        this.#setupDependencies();
    }

    /**
     * Ensures all critical dependencies are instantiated and ready for use.
     * Isolated synchronous setup.
     * @private
     */
    #setupDependencies(): void {
        if (!this.logger || !this.thresholdValidator || !this.configRegistry) {
            throw new Error('ResourceThresholdsConfigRegistryKernel initialization failed: Missing required dependencies.');
        }
    }

    /**
     * Initializes the kernel asynchronously by loading the default configuration.
     * Configuration loading moved from synchronous constructor to async initialization.
     * @param {string} [initialVersion='V1'] - The governance threshold version to enforce.
     */
    public async initialize(initialVersion: string = 'V1'): Promise<void> {
        this.activeVersion = initialVersion;
        await this.reload(initialVersion);
    }

    /**
     * Loads the specific threshold configuration version asynchronously from the registry.
     * @private
     * @param {string} version 
     * @returns {Promise<Readonly<Record<string, number>>>}
     */
    private async _loadVersion(version: string): Promise<Readonly<Record<string, number>>> {
        try {
            // Configuration is retrieved asynchronously from the centralized registry.
            const allConfigs = await this.configRegistry.get(this.configKey);
            const configKeyUpper = version.toUpperCase();

            if (allConfigs && allConfigs[configKeyUpper]) {
                return Object.freeze(allConfigs[configKeyUpper]);
            }

            // Violation corrected: Replaced console.warn with injected logger.
            this.logger.warn(`RTC Warning: Unknown threshold version '${version}'. Falling back to V1.`, { 
                component: 'ResourceThresholdsConfigRegistryKernel', version 
            });
            
            if (allConfigs && allConfigs['V1']) {
                return Object.freeze(allConfigs['V1']);
            }
            
            // Critical failure: V1 default is mandatory and missing.
            throw new Error(`Critical failure: Cannot load resource thresholds for version ${version}. V1 fallback is also missing.`);

        } catch (error) {
            this.logger.error(`Error loading resource thresholds configuration: ${error.message}`, { version, key: this.configKey });
            // Re-throw critical errors to halt initialization/operation
            throw error;
        }
    }

    /**
     * Retrieves a specific threshold value, delegating strict validation to the specialized tool kernel.
     * @param {string} key - The threshold identifier (e.g., 'CPU_CORE_BASELINE').
     * @returns {number} The numerical threshold value.
     * @throws {Error} If the key is missing or validation fails.
     */
    public get(key: string): number {
        // Delegate the strict access and validation logic to the specialized injected tool kernel.
        return this.thresholdValidator.execute({
            config: this.activeConfig,
            key: key,
            version: this.activeVersion
        });
    }

    /**
     * Reloads thresholds, facilitating dynamic runtime reconfiguration asynchronously.
     * @param {string} version 
     */
    public async reload(version: string): Promise<void> {
        this.activeVersion = version;
        this.activeConfig = await this._loadVersion(version);
        this.logger.info(`Resource thresholds reloaded successfully for version: ${version}`, { component: 'ResourceThresholdsConfigRegistryKernel' });
    }
}

export = ResourceThresholdsConfigRegistryKernel;