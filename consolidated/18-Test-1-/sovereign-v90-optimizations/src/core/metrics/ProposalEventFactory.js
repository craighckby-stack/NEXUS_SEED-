import { AbstractKernel } from '../kernel/AbstractKernel';

/**
 * @typedef {object} ProposalEventFactoryInterface
 * @property {(eventData: object) => Promise<object>} create
 */

/**
 * Kernel responsible for generating, validating, and standardizing immutable Proposal Event objects.
 * This replaces the synchronous functional export pattern with a dedicated, dependency-injected kernel.
 */
export class ProposalEventFactoryKernel extends AbstractKernel {
    /** @type {IMetricsSchemaConfigRegistryKernel} */
    #metricsConfigRegistry;
    /** @type {IEventFactoryGeneratorToolKernel} */
    #factoryGenerator;
    /** @type {ProposalEventFactoryInterface | null} */ 
    #internalFactoryInstance = null; 

    /**
     * @param {IMetricsSchemaConfigRegistryKernel} metricsConfigRegistry - Registry for metrics schemas and constants.
     * @param {IEventFactoryGeneratorToolKernel} factoryGenerator - Tool to abstract factory generation logic.
     */
    constructor(metricsConfigRegistry, factoryGenerator) {
        super();
        this.#metricsConfigRegistry = metricsConfigRegistry;
        this.#factoryGenerator = factoryGenerator;
        this.#setupDependencies();
    }

    #setupDependencies() {
        if (!this.#metricsConfigRegistry || typeof this.#metricsConfigRegistry.getProposalEventValidator !== 'function') {
            throw new Error('Dependency validation failed: IMetricsSchemaConfigRegistryKernel is required.');
        }
        if (!this.#factoryGenerator || typeof this.#factoryGenerator.createFactory !== 'function') {
            throw new Error('Dependency validation failed: IEventFactoryGeneratorToolKernel is required.');
        }
    }

    async initialize() {
        await super.initialize();
        
        // Asynchronously retrieve configuration required for factory generation
        const [validatorFunction, PROPOSAL_STATUS_ENUM] = await Promise.all([
            this.#metricsConfigRegistry.getProposalEventValidator(),
            this.#metricsConfigRegistry.getProposalStatusEnum()
        ]);
        
        if (!validatorFunction || !PROPOSAL_STATUS_ENUM || typeof PROPOSAL_STATUS_ENUM.PENDING === 'undefined') {
             throw new Error("Initialization failed: Required schema definitions (Validator or PENDING status) not retrieved.");
        }

        // Use the injected tool to create the specialized factory instance
        const factory = await this.#factoryGenerator.createFactory({
            validatorFunction: validatorFunction,
            defaultStatus: PROPOSAL_STATUS_ENUM.PENDING
        });

        if (typeof factory.create !== 'function') { 
             throw new Error("Factory generation error: Internal factory instance lacks a required 'create' method.");
        }
        
        this.#internalFactoryInstance = factory;
    }

    /**
     * Creates a validated and standardized Proposal Event object, ensuring schema adherence.
     * @param {object} eventData - Raw data for the event.
     * @returns {Promise<object>} The immutable Proposal Event object.
     */
    async create(eventData) {
        if (!this.#internalFactoryInstance) {
            // Standard safety check, relying on upstream initialization if possible
            await this.initialize();
        }
        return this.#internalFactoryInstance.create(eventData);
    }
}