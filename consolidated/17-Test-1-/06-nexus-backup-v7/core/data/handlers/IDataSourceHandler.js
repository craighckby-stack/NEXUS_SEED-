/**
 * @interface IDataSourceHandler
 * Defines the necessary contract for all concrete data source strategy handlers 
 * (e.g., API, Database, Message Bus).
 * 
 * Handlers must ensure connection management, strategy execution, and result normalization.
 */
class IDataSourceHandler {
    
    constructor() {
        // Enforces that this class cannot be instantiated directly, only subclassed.
        if (new.target === IDataSourceHandler) {
            throw new TypeError("Cannot instantiate abstract class IDataSourceHandler directly.");
        }
    }

    /**
     * Executes the specific data interaction strategy.
     * @param {Object} context - Execution context data (e.g., query details, payload, connection info).
     * @returns {Promise<Object>} The normalized result data object.
     */
    async execute(context) {
        throw new Error("Method 'execute(context)' must be implemented by the concrete handler class.");
    }

    /**
     * Optional teardown method for closing persistent connections or cleaning resources.
     */
    async teardown() {
        // Default implementation is a no-op, allowing handlers to ignore if cleanup is not necessary.
    }
}

export { IDataSourceHandler };