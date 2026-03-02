const IntegrityService = require('../utilities/integrityService');

// Initialize the dependency immediately upon module load.
// This approach simplifies the structure, eliminates internal static state tracking,
// and ensures the utility is ready immediately, improving call efficiency.
const integrityProvider = new IntegrityService();

/**
 * Generates unique, content-based immutable identifiers (IIDs).
 * This service provides a static interface for deterministic identification 
 * leveraging a stable hashing algorithm.
 */
class ImmutableIdGenerator {
    
    /**
     * Generates a stable, content-based ID (SHA-256 hash) for a data structure.
     * 
     * @param {object|string} data The data structure or content to identify.
     * @returns {string} The content-based Immutable ID (IID).
     */
    static generateId(data) {
        // The complexity of serialization and hashing is abstracted to the provider.
        return integrityProvider.calculateStableHash(data);
    }

    /**
     * Creates a resource stamp structure containing the immutable ID and runtime metadata.
     * 
     * NOTE: Although the 'immutableId' component is deterministic, the addition of 
     * 'timestamp' makes the resulting overall stamp non-deterministic across executions. 
     * Use this structure for runtime resource tracking and versioning, not content verification.
     * 
     * @param {string} resourceName - Name or type of the resource/structure.
     * @param {object} data - The data structure used to generate the IID.
     * @returns {{resource: string, immutableId: string, timestamp: number}} The stamp object.
     */
    static stampStructure(resourceName, data) {
        const immutableId = this.generateId(data);
        return {
            resource: resourceName,
            immutableId: immutableId,
            timestamp: Date.now()
        };
    }
}

module.exports = ImmutableIdGenerator;