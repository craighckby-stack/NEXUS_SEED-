/**
 * ConstraintStrategyRegistryKernel.js
 * Manages and provides access to custom validation functions (strategies).
 * It delegates registration and retrieval to an injected IStrategyRegistryToolKernel
 * and initializes core strategies via IValidationStrategyInitializerToolKernel.
 */

class ConstraintStrategyRegistryKernel {
    /**
     * @private {IStrategyRegistryToolKernel}
     */
    strategyRegistryTool;

    /**
     * @private {IValidationStrategyInitializerToolKernel}
     */
    strategyInitializerTool;

    /**
     * @param {IStrategyRegistryToolKernel} strategyRegistryTool
     * @param {IValidationStrategyInitializerToolKernel} strategyInitializerTool
     */
    constructor(strategyRegistryTool, strategyInitializerTool) {
        this.#setupDependencies(strategyRegistryTool, strategyInitializerTool);
    }

    /**
     * Strictly verifies and assigns kernel dependencies.
     * Enforces the synchronous setup extraction mandate.
     * @private
     * @param {IStrategyRegistryToolKernel} strategyRegistryTool
     * @param {IValidationStrategyInitializerToolKernel} strategyInitializerTool
     */
    #setupDependencies(strategyRegistryTool, strategyInitializerTool) {
        // Note: IStrategyRegistryToolKernel methods are expected to be synchronous for fast delegation, 
        // but the Kernel's public interface remains asynchronous.
        if (!strategyRegistryTool || typeof strategyRegistryTool.register !== 'function' || typeof strategyRegistryTool.get !== 'function') {
            throw new Error('Dependency Error: IStrategyRegistryToolKernel is missing or invalid.');
        }
        // Note: IValidationStrategyInitializerToolKernel.registerAll is expected to be asynchronous.
        if (!strategyInitializerTool || typeof strategyInitializerTool.registerAll !== 'function') {
            throw new Error('Dependency Error: IValidationStrategyInitializerToolKernel is missing or invalid.');
        }

        this.strategyRegistryTool = strategyRegistryTool;
        this.strategyInitializerTool = strategyInitializerTool;
    }

    /**
     * Asynchronously initializes the kernel by registering all core strategies.
     * This replaces the synchronous initialization block in the original file.
     * @returns {Promise<void>}
     */
    async initialize() {
        // Delegate strategy definition and registration to the dedicated initializer tool
        await this.strategyInitializerTool.registerAll(this.strategyRegistryTool);
    }

    /**
     * Registers a new constraint strategy function.
     * @param {string} name - The identifier.
     * @param {function} handler - The validation function.
     * @returns {Promise<void>}
     */
    async register(name, handler) {
        // Delegation to the utility plugin, wrapped in Promise.resolve for consistency.
        return Promise.resolve(this.strategyRegistryTool.register(name, handler));
    }

    /**
     * Retrieves a constraint strategy by name.
     * @param {string} name
     * @returns {Promise<function|null>}
     */
    async get(name) {
        return Promise.resolve(this.strategyRegistryTool.get(name));
    }
}

module.exports = ConstraintStrategyRegistryKernel;