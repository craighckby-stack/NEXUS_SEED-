/**
 * @interface IResolutionStrategy
 * Defines the contract for components responsible for resolving identifiers
 * (e.g., service keys, configuration tokens) into concrete instances or values.
 *
 * This interface promotes computational efficiency by enforcing `canResolve` checks
 * before attempting the potentially expensive `resolve` operation.
 */
class IResolutionStrategy {
    /**
     * Determines if this strategy is capable of resolving the provided identifier.
     * @param {string | symbol | object} identifier The key, token, or type to check.
     * @returns {boolean} True if the strategy can handle this identifier.
     */
    canResolve(identifier) {
        throw new Error("IResolutionStrategy::canResolve must be implemented by derived classes.");
    }

    /**
     * Resolves the identifier into a concrete instance or value.
     * 
     * Must only be called if `canResolve(identifier)` returns true.
     * 
     * @param {string | symbol | object} identifier The key, token, or type to resolve.
     * @param {Array<any>} [contextArgs=[]] Optional context arguments required for resolution (e.g., factory parameters).
     * @returns {Promise<any> | any} The resolved instance or a Promise resolving to the instance.
     */
    resolve(identifier, contextArgs = []) {
        throw new Error("IResolutionStrategy::resolve must be implemented by derived classes.");
    }
}

module.exports = IResolutionStrategy;