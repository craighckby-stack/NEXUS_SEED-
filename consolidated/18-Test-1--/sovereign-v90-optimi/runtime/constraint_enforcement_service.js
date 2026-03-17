/**
 * ConstraintEnforcementKernel
 * This service manages module contract integrity, efficient lookup, and constraint evaluation.
 * It abstracts the complex interactions between caching/integrity utilities and the evaluation engine.
 */
class ConstraintEnforcementKernel {
    
    #contractCacheUtility;
    #evaluationEngine;
    // Internal state required by the delegated utility's API for dynamic cycle detection.
    #activeContractMap;

    /**
     * Initializes the service, retrieving necessary kernel utilities.
     * @param {Object} [deps] Optional dependencies for testing/injection.
     */
    constructor(deps = {}) {
        this.#setupDependencies(deps);
        this.#activeContractMap = new Map(); 
    }

    /**
     * (Strategic Goal: Synchronous Setup Extraction)
     * Handles dependency validation and assignment.
     */
    #setupDependencies(deps) {
        this.#contractCacheUtility = deps.contractCacheUtility || globalThis.ContractIntegrityAndCacheUtility;
        this.#evaluationEngine = deps.evaluationEngine || globalThis.ConstraintEvaluationEngineTool;

        if (!this.#contractCacheUtility) {
            this.#throwSetupError("Dependency ContractIntegrityAndCacheUtility missing.");
        }
        if (!this.#evaluationEngine) {
            this.#throwSetupError("Dependency ConstraintEvaluationEngineTool missing.");
        }
    }

    /**
     * (Strategic Goal: I/O Proxy Creation)
     * Throws initialization errors.
     */
    #throwSetupError(message) {
        throw new Error(`ConstraintEnforcementKernel Initialization Failure: ${message}`);
    }

    /**
     * (Strategic Goal: I/O Proxy Creation - State Management)
     * Clears the context map for a fresh dependency check scope.
     */
    #clearActiveContractMap() {
        this.#activeContractMap.clear();
    }

    /**
     * (Strategic Goal: I/O Proxy Creation - External Delegation)
     * Delegates efficient storage, caching, and integrity checks.
     * NOTE: State clearing must be handled by the caller (getValidatedContract).
     */
    #delegateToContractCacheUtility(moduleId) {
        // Utility handles caching, efficient lookup, and cycle detection.
        return this.#contractCacheUtility.execute({ 
            moduleId: moduleId,
            contractMap: this.#activeContractMap // Context provided to the utility
        });
    }

    /**
     * (Strategic Goal: I/O Proxy Creation - External Delegation)
     * Delegates to the evaluation engine to check constraints and calculate safety index.
     */
    #delegateToEvaluationEngine(contract, runtimeData) {
        return this.#evaluationEngine.execute({ 
            contract: contract,
            data: runtimeData
        });
    }

    /**
     * (Strategic Goal: I/O Proxy Creation - Logging)
     * Handles logging for integrity failures.
     */
    #logIntegrityFailure(moduleId, error) {
        console.warn(`Constraint Enforcement Failure for module ${moduleId}: ${error.message}`);
    }

    /**
     * (Strategic Goal: I/O Proxy Creation - Control Flow/Formatting)
     * Formats a standardized failure result object.
     */
    #formatIntegrityFailureResult(error) {
        return {
            safetyIndex: 0.0,
            results: [{
                name: "IntegrityCheck",
                isValid: false,
                message: `Contract retrieval or integrity check failed: ${error.message}`
            }],
            isCompliant: false
        };
    }

    /**
     * Retrieves and validates the contract for a given module ID.
     * 
     * @param {string} moduleId 
     * @returns {Object} The validated contract definition.
     * @throws {Error} If a circular dependency or missing contract is found.
     */
    getValidatedContract(moduleId) {
        // Ensure the context map is clear for a fresh dependency check scope, 
        // as required by the ContractIntegrityAndCacheUtility API contract.
        this.#clearActiveContractMap(); 
        return this.#delegateToContractCacheUtility(moduleId);
    }

    /**
     * Core method to evaluate runtime data against module constraints and calculate the Safety Index.
     *
     * @param {string} moduleId The ID of the module whose constraints are being enforced.
     * @param {Object} runtimeData The data object to validate against the contract.
     * @returns {{safetyIndex: number, results: Array, isCompliant: boolean}} Enforcement results.
     */
    enforce(moduleId, runtimeData) {
        try {
            // 1. Integrity Check and Contract Retrieval
            const contract = this.getValidatedContract(moduleId);

            // 2. Constraint Evaluation (Delegated logic)
            const evaluationResult = this.#delegateToEvaluationEngine(contract, runtimeData);

            return {
                safetyIndex: evaluationResult.safetyIndex,
                results: evaluationResult.constraintResults,
                isCompliant: evaluationResult.isCompliant
            };

        } catch (error) {
            // Handle integrity breaches (e.g., Circular Dependency, missing contract)
            this.#logIntegrityFailure(moduleId, error);
            return this.#formatIntegrityFailureResult(error);
        }
    }
}

// Expose the service
globalThis.ConstraintEnforcementKernel = ConstraintEnforcementKernel;