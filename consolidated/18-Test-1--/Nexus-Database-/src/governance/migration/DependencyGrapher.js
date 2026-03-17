/**
 * Dependency Grapher Utility (v94.1 Structural Layer)
 * Service responsible for constructing a directed graph of schema entities 
 * based on structural relationships (foreign keys, inheritance, references).
 * This output is critical input for the SchemaAnalyzer to determine cascade risk 
 * and migration complexity scoring.
 */
export class DependencyGrapher {

    /**
     * Processes a normalized schema structure to build a dependency adjacency list.
     * @param {object} schema - The normalized schema representation (e.g., { EntityName: { properties: [...] } }).
     * @returns {object} A graph representation (Adjacency List: { SourceNode: [DependentNode1, DependentNode2] }).
     */
    static buildGraph(schema) {
        if (!schema || typeof schema !== 'object') {
            return {};
        }

        const graph = {};

        for (const entityName in schema) {
            // Initialize all entities as nodes, even if they have no outward dependencies
            if (!graph[entityName]) {
                graph[entityName] = [];
            }

            const entity = schema[entityName];

            // Iterate properties to find relational fields
            for (const propName in entity.properties) {
                const property = entity.properties[propName];
                
                // Assuming normalization means relational fields have a 'references' property
                if (property.references && property.references.entity) {
                    const referencedEntity = property.references.entity;

                    // If Entity A references Entity B (FK to B), then A depends on B.
                    // The graph tracks: Required Entity -> [List of Entities that Depend on it]
                    // If B is the referenced entity (required), and A is the current entity (dependent).
                    if (!graph[referencedEntity]) {
                        graph[referencedEntity] = [];
                    }
                    
                    if (!graph[referencedEntity].includes(entityName)) {
                        graph[referencedEntity].push(entityName);
                    }
                }
            }
        }
        
        return graph;
    }
    
    /**
     * Calculates the potential cascade risk score for a set of affected entities.
     * Assesses the scope (number of total dependent nodes) and depth (max chain length) of change propagation.
     * @param {object} graph - The dependency graph (Adjacency List).
     * @param {Set<string>} affectedEntities - Set of entity names that have critical or structural changes.
     * @returns {number} The cascade risk score (0.0 to 1.0).
     */
    static calculateCascadeRisk(graph, affectedEntities) {
        if (affectedEntities.size === 0) return 0.0;
        
        let maxChainLength = 0;
        const allDependentNodes = new Set();

        for (const affectedEntity of affectedEntities) {
            // Perform Breadth-First Search (BFS) starting from the affected entity
            // to find all cascading dependents.
            const queue = [{ node: affectedEntity, depth: 0 }];
            const visited = new Set();

            while (queue.length > 0) {
                const { node, depth } = queue.shift();
                
                if (visited.has(node)) continue;
                visited.add(node);

                maxChainLength = Math.max(maxChainLength, depth);
                if (node !== affectedEntity) {
                    allDependentNodes.add(node);
                }

                if (graph[node]) {
                    for (const dependent of graph[node]) {
                        queue.push({ node: dependent, depth: depth + 1 });
                    }
                }
            }
        }
        
        const totalEntities = Object.keys(graph).length || 1;
        
        // Risk factor based on scope (normalized count of entities depending on the affected ones) 
        // and depth (normalized max chain length).
        const scopeRisk = allDependentNodes.size / totalEntities;
        const depthRisk = maxChainLength / totalEntities; 

        // Weighted average for final score
        return Math.min(1.0, (scopeRisk * 0.6) + (depthRisk * 0.4));
    }
}