/**
 * UTILITY: FactorAuditor
 * PURPOSE: Standardized logging mechanism for structured calculation inputs,
 * intermediate factors, and outputs derived by complex indexers (like SCI, VMO).
 * This utility provides ephemeral, high-granularity audit trails necessary for
 * retrospective analysis and cost model refinement, distinct from operational logs.
 * 
 * Utilizes the AuditRecordCanonicalizer (or similar tool) for canonicalizing audit structure.
 */
class FactorAuditor {
    /**
     * @param {object} storageMechanism - Object with a 'save(record)' method.
     * @param {object} auditCanonicalizer - Tool interface providing a 'generate(eventType, context, data)' method (e.g., AuditRecordCanonicalizer).
     */
    constructor(storageMechanism, auditCanonicalizer) {
        // Storage mechanism might be an in-memory ring buffer, dedicated database, or log stream
        this.storage = storageMechanism;
        
        // The tool responsible for generating canonical, timestamped audit records.
        if (typeof auditCanonicalizer?.generate !== 'function') {
             throw new Error("FactorAuditor requires a canonicalizer with a 'generate' method.");
        }
        this.auditCanonicalizer = auditCanonicalizer;
    }

    /**
     * Logs a complete structured index calculation.
     * NOTE: Assumes the storage mechanism's 'save' method may be asynchronous.
     * @param {string} indexName - e.g., 'C-01', 'VMO-L6'
     * @param {object} metadata - Contextual data (e.g., SST ID, timestamp)
     * @param {object} factors - The full factors object returned by the calculator (e.g., SCI.queryC01().factors)
     * @returns {Promise<object>} The canonical audit record generated.
     */
    async logCalculation(indexName, metadata, factors) {
        
        if (!indexName || typeof indexName !== 'string' || indexName.trim() === '') {
            throw new Error("FactorAuditor: indexName must be a non-empty string.");
        }

        // 1. Prepare payload specific to the factor calculation
        const calculationPayload = { 
            index_id: indexName, 
            factors: factors 
        };

        // 2. Use the injected Canonicalizer to generate a standardized, timestamped record.
        const eventType = `FACTOR_CALCULATION:${indexName}`; 

        // Assuming AuditRecordCanonicalizer.generate(eventType, context, data) signature
        const record = this.auditCanonicalizer.generate(
            eventType,
            metadata,
            calculationPayload
        );
        
        // 3. Delegate persistence, awaiting the result if save is present and potentially async.
        if (typeof this.storage.save === 'function') {
            await this.storage.save(record);
        } else {
            // Silent fail / Debug path for persistence if storage mechanism lacks 'save'
        }

        return record;
    }
    
    // Potential future methods: queryBySST, retrieveLatestFactorSet
}

module.exports = { FactorAuditor };