/**
 * IResolutionStrategy Interface Definition
 * 
 * Defines the structural contract that all dynamically loaded resolution strategies must adhere to.
 * This ensures consistency across different constraint handling algorithms and facilitates testing.
 */
class IResolutionStrategy {
    /**
     * @param {object} initializationParameters - Parameters defined in the engine config for this strategy.
     */
    constructor(initializationParameters = {}) {
        if (new.target === IResolutionStrategy) {
            throw new TypeError("Cannot instantiate abstract class IResolutionStrategy directly.");
        }
        this.params = initializationParameters;
    }

    /**
     * Executes the core resolution logic based on the provided context and constraints.
     * 
     * @param {object} resolutionContext - Data context relevant for the resolution (e.g., current state, conflicting values).
     * @param {Array<object>} constraints - The set of constraints applicable to this resolution step.
     * @returns {Promise<object>} The resolved state or value.
     */
    async resolve(resolutionContext, constraints) {
        throw new Error("Method 'resolve(resolutionContext, constraints)' must be implemented by the concrete strategy.");
    }
    
    /**
     * Optional method for post-instantiation setup or async resource loading.
     * This method is automatically called by the ResolutionStrategyLoader after instantiation.
     */
    async initialize() {
        // Concrete strategies can override this for complex setup
        return true; 
    }
}

export default IResolutionStrategy;