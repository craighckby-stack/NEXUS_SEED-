const ImmutableIdGenerator = require('./ImmutableIdGenerator');

/**
 * Service dedicated to creating, managing, and verifying versioned resource snapshots.
 * This service separates the concerns of pure ID generation from complex resource lifecycle tracking.
 */
class VersioningService {

    /**
     * Creates a complete, traceable snapshot package for a resource.
     * It calculates the IID and stamps it with necessary metadata, including a second
     * hash (versionHash) to verify the integrity of the *metadata* itself, independent of the timestamp.
     * 
     * @param {string} resourceName - Name of the resource.
     * @param {object} data - The resource data content.
     * @returns {{resource: string, immutableId: string, timestamp: number, versionHash: string}}
     */
    static createSnapshot(resourceName, data) {
        const immutableId = ImmutableIdGenerator.generateId(data);
        
        const snapshot = {
            resource: resourceName,
            immutableId: immutableId,
            timestamp: Date.now(), // Dynamic field for creation time
        };
        
        // Create a verifiable hash over the deterministic snapshot components (resource + IID)
        // This allows validating the snapshot linkage without dependency on execution time.
        const deterministicBase = {
             resource: snapshot.resource,
             immutableId: snapshot.immutableId
        };
        
        snapshot.versionHash = ImmutableIdGenerator.generateId(deterministicBase);
        
        return snapshot;
    }
    
    // Future methods could include rollback tracking, history indexing, or verification routines.
}

module.exports = VersioningService;