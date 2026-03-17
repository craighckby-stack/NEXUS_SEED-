class ProposalSchemaFactoryImpl {
    #GSC_SST_Schema;
    #validatorFactory;

    constructor() {
        this.#setupDependencies();
    }

    /**
     * Extracts synchronous dependency resolution and initialization (schema loading 
     * and validator factory resolution).
     * Satisfies: synchronous setup extraction goal.
     * @private
     */
    #setupDependencies() {
        this.#GSC_SST_Schema = this.#loadSchema();
        this.#validatorFactory = this.#resolveValidatorFactory();
    }

    /**
     * I/O Proxy: Synchronously loads the Proposal Schema JSON file using relative path.
     * Satisfies: I/O proxy creation goal.
     * @private
     */
    #loadSchema() {
        // Using require inside the proxy to encapsulate file I/O.
        return require('../GSC_SST_Proposal_Schema.json');
    }

    /**
     * I/O Proxy: Resolves the HighIntegrityProposalValidatorFactory from Kernel Plugins.
     * Satisfies: I/O proxy creation goal.
     * @private
     */
    #resolveValidatorFactory() {
        // We require the package here to isolate the I/O of dependency resolution
        const KernelPlugins = require('@agi-kernel/plugins');
        return KernelPlugins.HighIntegrityProposalValidatorFactory;
    }

    /**
     * I/O Proxy: Delegates schema compilation to the resolved factory service.
     * This execution is synchronous.
     * Satisfies: I/O proxy creation goal.
     * @param {object} schema - The loaded JSON schema object.
     * @returns {function} The compiled validation function.
     * @private
     */
    #delegateToFactoryExecution(schema) {
        // The factory internally applies security settings (e.g., removeAdditional: true)
        return this.#validatorFactory.execute({ schema });
    }

    /**
     * Initializes and returns a compiled Ajv validator instance for proposals 
     * using the configured high-integrity factory service.
     * @returns {function} A compiled validation function.
     */
    getProposalValidator() {
        const validate = this.#delegateToFactoryExecution(this.#GSC_SST_Schema);
        return validate;
    }
}

// Exporting the API via a private singleton instance to maintain the original static function signature.
const factoryInstance = new ProposalSchemaFactoryImpl();

module.exports = { 
    getProposalValidator: () => factoryInstance.getProposalValidator() 
};