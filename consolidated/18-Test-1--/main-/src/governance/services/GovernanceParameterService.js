import { GovernanceSettingsRegistryKernel } from "@kernel/ConfigRegistry/GovernanceSettingsRegistryKernel";
import { ConfigDefaultsRegistryKernel } from "@kernel/ConfigRegistry/ConfigDefaultsRegistryKernel";
import { ConfigSchemaRegistryKernel } from "@kernel/ConfigRegistry/ConfigSchemaRegistryKernel";
import { IRegistryInitializerToolKernel } from "@core/interfaces/IRegistryInitializerToolKernel";

/**
 * AGI-KERNEL: GovernanceParameterKernel
 * 
 * Replaces the synchronous GovernanceParameterService. This kernel manages the
 * asynchronous retrieval and resolution of all core governance parameters by
 * delegating persistence and default handling exclusively to specialized
 * registry kernels. This ensures Maximum Recursive Abstraction (MRA)
 * and adherence to AIA Enforcement Layer mandates for non-blocking I/O.
 */
class GovernanceParameterKernel {
    /**
     * @param {object} dependencies
     * @param {GovernanceSettingsRegistryKernel} dependencies.governanceSettingsRegistryKernel
     * @param {ConfigDefaultsRegistryKernel} dependencies.configDefaultsRegistryKernel
     * @param {ConfigSchemaRegistryKernel} dependencies.configSchemaRegistryKernel
     * @param {IRegistryInitializerToolKernel} dependencies.registryInitializerToolKernel
     */
    constructor({ 
        governanceSettingsRegistryKernel,
        configDefaultsRegistryKernel,
        configSchemaRegistryKernel,
        registryInitializerToolKernel
    }) {
        if (!governanceSettingsRegistryKernel || !configDefaultsRegistryKernel || !registryInitializerToolKernel || !configSchemaRegistryKernel) {
            throw new Error("GovernanceParameterKernel initialization failed: Missing required registry kernels.");
        }
        this.settingsRegistry = governanceSettingsRegistryKernel;
        this.defaultsRegistry = configDefaultsRegistryKernel;
        this.schemaRegistry = configSchemaRegistryKernel;
        this.registryInitializer = registryInitializerToolKernel;
        this.initialized = false;
    }

    /**
     * Mandatory asynchronous initialization, delegating registration to the Tool Kernel.
     */
    async initialize() {
        if (this.initialized) return;

        // Initialize all registry dependencies concurrently and asynchronously.
        await this.registryInitializer.initializeAll([
            this.settingsRegistry,
            this.defaultsRegistry,
            this.schemaRegistry
        ]);

        this.initialized = true;
    }

    /**
     * Retrieves a governance parameter, prioritizing configured settings over defaults.
     * @param {string} key - The parameter key.
     * @returns {Promise<any>}
     */
    async getParameter(key) {
        if (!this.initialized) {
            throw new Error("GovernanceParameterKernel is not initialized.");
        }
        
        // Delegate configuration retrieval to the specialized Governance Settings Registry Kernel.
        let value = await this.settingsRegistry.get(key);

        if (value === undefined || value === null) {
            // Fallback to the Config Defaults Registry Kernel.
            value = await this.defaultsRegistry.get(key);
        }

        return value;
    }

    /**
     * Retrieves the schema definition for a specific parameter or configuration set.
     * @param {string} key - The schema identifier.
     * @returns {Promise<object>}
     */
    async getParameterSchema(key) {
        if (!this.initialized) {
            throw new Error("GovernanceParameterKernel is not initialized.");
        }
        return this.schemaRegistry.getSchema(key);
    }

    // Future methods will delegate complex configuration operations (e.g., merging, validation) 
    // entirely to the specialized registry kernels.
}

export { GovernanceParameterKernel };