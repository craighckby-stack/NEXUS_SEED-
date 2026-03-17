/**
 * AGI-KERNEL Refactored Module: Ensures rigorous architectural separation and encapsulation.
 */

class ValidateProposalModuleImpl {
    static #validateProposalFunction;

    /**
     * Extracts synchronous dependencies and initializes the bound validator.
     * Satisfies the synchronous setup extraction goal.
     * @private
     */
    static #setupDependencies() {
        if (ValidateProposalModuleImpl.#validateProposalFunction) {
            return;
        }

        const getProposalValidator = ValidateProposalModuleImpl.#resolveDependency('../config/proposalSchemaFactory', 'getProposalValidator');
        const createBoundValidator = ValidateProposalModuleImpl.#resolveDependency('@plugin/ValidatorBinderUtility', 'createBoundValidator');
        
        // Isolate the composition (binding) step
        ValidateProposalModuleImpl.#validateProposalFunction = ValidateProposalModuleImpl.#delegateToBindingTool(createBoundValidator, getProposalValidator);
    }
    
    /**
     * Isolates dependency resolution (synchronous require).
     * @param {string} modulePath 
     * @param {string} exportName 
     * @private
     */
    static #resolveDependency(modulePath, exportName) {
        try {
            // I/O Proxy: Dependency resolution
            const dependency = require(modulePath)[exportName];
            if (!dependency) {
                ValidateProposalModuleImpl.#throwDependencyError(`Missing required export '${exportName}' in module '${modulePath}'.`);
            }
            return dependency;
        } catch (error) {
            ValidateProposalModuleImpl.#throwDependencyError(`Failed to load dependency '${modulePath}': ${error.message}`);
        }
    }

    /**
     * Isolates the execution of the external binding tool.
     * @param {function} createBoundValidatorTool 
     * @param {function} validatorFactory 
     * @private
     */
    static #delegateToBindingTool(createBoundValidatorTool, validatorFactory) {
        try {
            // I/O Proxy: External tool execution
            return createBoundValidatorTool(validatorFactory);
        } catch (error) {
            ValidateProposalModuleImpl.#throwDependencyError(`Failed during validator binding: ${error.message}`);
        }
    }

    /**
     * Isolates error throwing.
     * @param {string} message 
     * @private
     */
    static #throwDependencyError(message) {
        // I/O Proxy: Error throwing
        throw new Error(`[ValidateProposalModule] ${message}`);
    }

    /**
     * Validates a proposed governance object against the configured schema.
     * @param {object} proposalData - The raw data object submitted as a proposal (Immutable input).
     * @returns {{isValid: boolean, errors: array, canonicalData: object | null}}
     */
    static validateProposal(proposalData) {
        // Defensive check, setup should already have run immediately on load.
        if (!ValidateProposalModuleImpl.#validateProposalFunction) {
             ValidateProposalModuleImpl.#setupDependencies(); 
        }
        
        // I/O Proxy: Delegation to the composed validation function
        return ValidateProposalModuleImpl.#delegateToValidationExecution(proposalData);
    }
    
    /**
     * Executes the pre-bound validation function.
     * @param {object} proposalData
     * @private
     */
    static #delegateToValidationExecution(proposalData) {
        // I/O Proxy: External execution
        return ValidateProposalModuleImpl.#validateProposalFunction(proposalData);
    }
}

// Run synchronous setup immediately to mimic original module loading behavior (dependency composition).
ValidateProposalModuleImpl.#setupDependencies();

module.exports = {
    validateProposal: ValidateProposalModuleImpl.validateProposal
};
