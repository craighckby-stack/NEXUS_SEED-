/**
 * AGI-KERNEL ConceptualPolicyRegistryKernel
 * 
 * Manages the registration and retrieval of conceptual policies, ensuring
 * integrity via configuration freezing and O(1) lookup efficiency, using
 * dependency injection for all underlying utilities.
 */

/**
 * @typedef {Object} Policy
 * @property {string} name - Human readable name.
 * @property {string} description - What the policy governs.
 * @property {Object} config - The configuration payload enforced by the policy.
 */

class ConceptualPolicyRegistryKernel {
    /** @type {IInMemoryMapStoreToolKernel<Policy>} */
    #policyStore;

    /** @type {IObjectImmutabilityToolKernel} */
    #immutabilityEnforcer;

    /**
     * @param {{ policyStore: IInMemoryMapStoreToolKernel<Policy>, immutabilityEnforcer: IObjectImmutabilityToolKernel }} dependencies
     */
    constructor({ policyStore, immutabilityEnforcer }) {
        this.#policyStore = policyStore;
        this.#immutabilityEnforcer = immutabilityEnforcer;
        this.#setupDependencies();
    }

    /**
     * Rigorously enforces synchronous dependency assignment and validation,
     * satisfying the synchronous setup extraction mandate.
     */
    #setupDependencies() {
        if (!this.#policyStore || typeof this.#policyStore.register !== 'function') {
            throw new Error("Dependency Injection Error: IInMemoryMapStoreToolKernel ('policyStore') is missing or invalid.");
        }
        if (!this.#immutabilityEnforcer || typeof this.#immutabilityEnforcer.freeze !== 'function') {
            throw new Error("Dependency Injection Error: IObjectImmutabilityToolKernel ('immutabilityEnforcer') is missing or invalid.");
        }
    }

    /**
     * Initializes the kernel. Required by the strategic mandate.
     * @returns {Promise<void>}
     */
    async initialize() {
        // No asynchronous configuration loading needed here, as registration is external.
    }

    /**
     * Registers a new conceptual policy.
     * 
     * Delegates freezing to the injected immutability tool and storage to the injected map store.
     * 
     * @param {string} policyId - Unique identifier for the policy.
     * @param {Policy} policy - The policy object.
     * @returns {Promise<void>}
     */
    async registerPolicy(policyId, policy) {
        if (!policy || typeof policy.config === 'undefined') {
            throw new Error(`Integrity Error: Policy registration for ID: ${policyId} failed. Policy structure must contain a 'config' payload.`);
        }
        
        // Delegate freezing to the injected tool
        const immutablePolicy = this.#immutabilityEnforcer.freeze(policy);
        
        this.#policyStore.register(policyId, immutablePolicy);
    }

    /**
     * Retrieves a registered policy by its ID.
     * 
     * @param {string} policyId - The unique identifier of the policy.
     * @returns {Promise<Policy | undefined>}
     */
    async getPolicy(policyId) {
        return this.#policyStore.get(policyId);
    }

    /**
     * Retrieves the configuration payload for a specific policy.
     * 
     * @param {string} policyId - The unique identifier of the policy.
     * @returns {Promise<Object | undefined>} The configuration payload.
     */
    async getPolicyConfig(policyId) {
        const policy = await this.getPolicy(policyId);
        return policy ? policy.config : undefined;
    }

    /**
     * Checks if a policy is registered.
     * @param {string} policyId - The unique identifier of the policy.
     * @returns {Promise<boolean>}
     */
    async hasPolicy(policyId) {
        return this.#policyStore.has(policyId);
    }

    /**
     * Returns an iterable of all registered policy IDs.
     * @returns {Promise<IterableIterator<string>>}
     */
    async keys() {
        return this.#policyStore.keys();
    }
    
    /**
     * Clears all registered policies. Use only for controlled environment reset.
     * @returns {Promise<void>}
     */
    async clear() {
        this.#policyStore.clear();
    }
}

export { ConceptualPolicyRegistryKernel };