/**
 * @fileoverview Conceptual Scope Mapper (CSM).
 * This utility pre-processes the Concept Registry to create efficient lookups,
 * mapping file paths, path patterns, or mutation types directly to the list of
 * concepts that must be evaluated. This avoids O(N*M) iteration (Concepts * Files)
 * in the Conceptual Integrity Engine (CIE).
 */

import { ConceptRegistry } from '../conceptRegistry.js';

export class ConceptualScopeMapper {
    constructor() {
        this.artifactMap = new Map(); // Key: implementationPath, Value: Array<Concept>
        this.systemicConcepts = [];    // Concepts without a specific path
        this.initialized = false;
    }

    /**
     * Initializes the mapper by indexing all concepts from the registry.
     */
    initialize() {
        const allConcepts = ConceptRegistry.getAllConcepts();
        this.artifactMap.clear();
        this.systemicConcepts = [];

        // Note: This initialization focuses on direct path mapping for maximum efficiency gain.
        for (const concept of allConcepts) {
            if (concept.implementationPath) {
                // Index by specific path
                const path = concept.implementationPath;
                if (!this.artifactMap.has(path)) {
                    this.artifactMap.set(path, []);
                }
                this.artifactMap.get(path).push(concept);
            } else if (concept.scope === 'systemic' || !concept.implementationPath) {
                // Concepts that apply globally or require proposal-level checks
                this.systemicConcepts.push(concept);
            }
        }
        this.initialized = true;
    }

    /**
     * Retrieves concepts relevant to a specific file path.
     * @param {string} filePath
     * @returns {Array<Object>}
     */
    getArtifactConceptsByPath(filePath) {
        if (!this.initialized) this.initialize();
        return this.artifactMap.get(filePath) || [];
    }

    /**
     * Retrieves all concepts that require systemic (proposal-level) validation.
     * @returns {Array<Object>}
     */
    getSystemicConcepts() {
        if (!this.initialized) this.initialize();
        return this.systemicConcepts;
    }
}

export const ConceptualScopeMapperInstance = new ConceptualScopeMapper();