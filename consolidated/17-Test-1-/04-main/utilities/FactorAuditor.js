/**
 * UTILITY: FactorAuditor
 * PURPOSE: Standardized logging mechanism for structured calculation inputs, 
 * intermediate factors, and outputs derived by complex indexers (like SCI, VMO).
 * This utility provides ephemeral, high-granularity audit trails necessary for 
 * retrospective analysis and cost model refinement, distinct from operational logs.
 */
class FactorAuditor {
    constructor(storageMechanism) {
        // Storage mechanism might be an in-memory ring buffer, dedicated database, or log stream
        this.storage = storageMechanism;
    }

    /**
     * Logs a complete structured index calculation.
     * @param {string} indexName - e.g., 'C-01', 'VMO-L6'
     * @param {object} metadata - Contextual data (e.g., SST ID, timestamp)
     * @param {object} factors - The full factors object returned by the calculator (e.g., SCI.queryC01().factors)
     */
    logCalculation(indexName, metadata, factors) {
        const record = {
            timestamp: new Date().toISOString(),
            index_id: indexName,
            metadata: metadata,
            factors: factors
        };
        
        // In a real implementation, 'this.storage.save(record)' would handle persistence.
        if (typeof this.storage.save === 'function') {
            this.storage.save(record);
        } else {
            // Fallback for demonstration/testing
            // console.debug(`[FactorAudit] Logged ${indexName}:`, record);
        }

        return record;
    }
    
    // Potential future methods: queryBySST, retrieveLatestFactorSet
}

module.exports = { FactorAuditor };