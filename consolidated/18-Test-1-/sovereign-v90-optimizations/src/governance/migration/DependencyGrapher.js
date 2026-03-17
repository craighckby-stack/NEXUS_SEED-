/**
 * AGI-KERNEL: DependencyGrapherKernel (v7.11.3)
 * Specialized Tool Kernel responsible for constructing a directed graph of schema entities
 * and calculating structural cascade risk metrics.
 * 
 * Adheres to AIA Enforcement Layer mandates for asynchronous execution and auditable dependency injection.
 */
export class DependencyGrapherKernel {

    /**
     * @private
     * The specialized kernel for deep graph analysis, replacing the synchronous GraphReachabilityAnalyzer.
     * @type {ISchemaReachabilityAnalyzerToolKernel}
     */
    #reachabilityAnalyzer;

    /**
     * @param {ISchemaReachabilityAnalyzerToolKernel} reachabilityAnalyzer 
     */
    constructor(reachabilityAnalyzer) {
        if (!reachabilityAnalyzer || typeof reachabilityAnalyzer.analyze !== 'function') {
            throw new Error("DependencyGrapherKernel requires a valid ISchemaReachabilityAnalyzerToolKernel instance.");
        }
        this.#reachabilityAnalyzer = reachabilityAnalyzer;
    }

    /**
     * Processes a normalized schema structure to build a dependency adjacency list.
     * If Entity A references Entity B, the graph tracks: B (Required) -> [A (Dependent)].
     * 
     * @param {Readonly<object>} schema - The normalized schema representation.
     * @returns {Promise<Readonly<Record<string, ReadonlyArray<string>>>>} A promise resolving to the graph representation (Adjacency List).
     */
    async buildGraph(schema) {
        if (!schema || typeof schema !== 'object') {
            return Object.freeze({});
        }

        const graph = {};

        for (const entityName in schema) {
            if (!schema.hasOwnProperty(entityName)) continue;
            
            // Initialize all entities as nodes
            if (!graph[entityName]) {
                graph[entityName] = [];
            }

            const entity = schema[entityName];
            
            if (entity && entity.properties) {
                for (const propName in entity.properties) {
                    if (!entity.properties.hasOwnProperty(propName)) continue;
                    
                    const property = entity.properties[propName];
                    
                    // Check for structural dependency definition
                    if (property && property.references && property.references.entity) {
                        const referencedEntity = property.references.entity;

                        if (!graph[referencedEntity]) {
                            graph[referencedEntity] = [];
                        }
                        
                        if (!graph[referencedEntity].includes(entityName)) {
                            graph[referencedEntity].push(entityName);
                        }
                    }
                }
            }
        }
        
        // Ensure deep immutability
        const immutableGraph = {};
        for (const node in graph) {
            if (graph.hasOwnProperty(node)) {
                immutableGraph[node] = Object.freeze(graph[node]);
            }
        }
        
        return Object.freeze(immutableGraph);
    }
    
    /**
     * Calculates the potential cascade risk score for a set of affected entities.
     * Delegates the graph analysis (reachability and depth) to the specialized ISchemaReachabilityAnalyzerToolKernel.
     * 
     * @param {Readonly<Record<string, ReadonlyArray<string>>>} graph - The dependency graph (Adjacency List).
     * @param {ReadonlySet<string>} affectedEntities - Set of entity names that have critical or structural changes.
     * @returns {Promise<number>} The cascade risk score (0.0 to 1.0).
     */
    async calculateCascadeRisk(graph, affectedEntities) {
        if (affectedEntities.size === 0) return 0.0;
        
        // Delegation to specialized, asynchronous Tool Kernel for complex graph analysis
        const analysisResult = await this.#reachabilityAnalyzer.analyze(
            graph,
            affectedEntities
        );
        
        const allDependentNodes = analysisResult.dependentNodes;
        const maxChainLength = analysisResult.maxDepth;

        const totalEntities = Object.keys(graph).length || 1;
        
        // Risk factor calculation: Scope (60%) + Depth (40%)
        const scopeRisk = allDependentNodes.size / totalEntities;
        const depthRisk = maxChainLength / totalEntities; 

        return Math.min(1.0, (scopeRisk * 0.6) + (depthRisk * 0.4));
    }
}