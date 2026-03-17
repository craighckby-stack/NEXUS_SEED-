/**
 * Migration Cost Modeler (MCM) V1.0
 * Predicts CPU, Memory, I/O, and Time complexity for schema migrations based on
 * structural difference metrics provided by the SchemaAnalyzer.
 */
export class MigrationCostModeler {

    /**
     * Creates a new Cost Modeler instance.
     * @param {object} configuration - Configuration specifying environmental constants (e.g., typical IO throughput).
     */
    constructor(configuration = {}) {
        this.config = { 
            ioFactor: configuration.ioFactor || 1.2,
            cpuFactor: configuration.cpuFactor || 0.85,
            baseOverheadMs: configuration.baseOverheadMs || 500
        };
    }

    /**
     * Estimates the full migration cost profile based on analysis inputs.
     * @param {object} diffAnalysis - The output structure from SchemaMigrationSimulationEngine.analyzeDifferential.
     * @returns {{durationMs: number, resources: {cpu: number, memory: number, io: number}}}
     */
    estimateCosts(diffAnalysis) {
        const complexity = diffAnalysis.complexityScore;
        const breakingChanges = diffAnalysis.breakingChangesCount;

        // Cost Modeling Formula: Base Overhead + (Complexity * CPU Factor) + (Breaking Changes * IO Factor)
        
        // 1. Time Duration Estimate
        const estimatedTime = this.config.baseOverheadMs + 
                              (complexity * 1500 * this.config.cpuFactor) + 
                              (breakingChanges * 500 * this.config.ioFactor);

        // 2. Resource Estimation (Simplified scale 0.0 to 10.0 relative to baseline server)
        const cpuUsage = (complexity * 0.1) + (breakingChanges * 0.5);
        const memoryUsage = (complexity * 0.05) + (breakingChanges * 0.3);
        // I/O is heavily influenced by data transformation needs
        const ioUsage = diffAnalysis.dataTransformationRequired ? 
                        (breakingChanges * 1.5) + (complexity * 0.1) : 
                        (complexity * 0.05);

        return {
            durationMs: Math.ceil(estimatedTime),
            resources: {
                cpu: Math.min(10.0, cpuUsage), 
                memory: Math.min(10.0, memoryUsage), 
                io: Math.min(10.0, ioUsage) 
            }
        };
    }
}