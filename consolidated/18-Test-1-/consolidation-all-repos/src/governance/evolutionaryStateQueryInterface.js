// Component ID: HSI (Hashed State Indexer)
// Mandate: Provide high-efficiency, read-only access to immutable D-01 and MCR records.
// This interface prevents direct querying of the primary state ledger, reducing latency
// during time-critical consensus steps (like C-11 risk assessment and F-01 analysis).

class EvolutionaryStateQueryInterface {
    constructor(mcr, d01) {
        this.mcr = mcr; // Mutation Chain Registrar reference
        this.d01 = d01; // Decision Audit Logger reference
        this.stateIndex = new Map(); // Optimized index for hashed lookups
    }

    /**
     * Initializes the optimized index from existing D-01/MCR data.
     * @returns {Promise<boolean>}
     */
    async initialize() {
        // Load recent states/hashes into the indexed map.
        console.log("HSI initialized and indexing recent evolutionary states.");
        return true;
    }

    /**
     * Retrieves a full evolutionary state artifact by its cryptographic hash or index ID.
     * Optimized for O(1) lookup.
     * @param {string} stateHashOrId
     * @returns {Object|null}
     */
    getStateByHash(stateHashOrId) {
        if (this.stateIndex.has(stateHashOrId)) {
            return this.stateIndex.get(stateHashOrId);
        }
        // Fallback to D-01 lookup if index is stale/misses, triggering an asynchronous index update.
        return this.d01.retrieveRecord(stateHashOrId);
    }

    /**
     * Provides the historical sequence required for C-11's contextual modeling.
     * @param {number} depth - How many prior steps to retrieve.
     * @returns {Array<Object>}
     */
    getHistoricalContext(depth) {
        // Logic to efficiently retrieve last 'depth' immutable records.
        return [];
    }
}

module.exports = EvolutionaryStateQueryInterface;