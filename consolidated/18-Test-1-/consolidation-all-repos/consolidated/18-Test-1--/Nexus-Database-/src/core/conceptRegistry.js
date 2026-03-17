/**
 * @fileoverview A centralized, unified, and type-safe registry for all formalized AGI and Architectural Concepts.
 * This registry serves as the single source of truth for concept IDs used throughout the Sovereign codebase,
 * facilitating documentation, cross-referencing, and runtime concept validation.
 *
 * IMPORTANT: Concept IDs should be consumed via imported constants from src/constants/conceptIds.js (generated automatically by the system).
 */

// --- Type Definitions and Constants for Self-Documentation ---

/** @typedef {'AGI'|'ARCH'|'HALLUCINATION'} ConceptCategory */
/** @typedef {'Fundamental'|'Core'|'Critical Core'|'In Development'|'Philosophical/Core'|'Critical Consensus'|'Core ATM'|'Memory/Strategic'|'Agent Protocol'|'Critical'} ConceptStatus */
/** @typedef {'Discard'|'Salvage/Reformulate'|'Capture, Validate, and Cache via SIC (AGI-C-13)'|null} HallucinationAction */

/**
 * High-level categories for concepts, exported for system-wide validation.
 * @readonly
 * @enum {ConceptCategory}
 */
export const ConceptCategories = Object.freeze({
    AGI: 'AGI',
    ARCHITECTURE: 'ARCH',
    HALLUCINATION: 'HALLUCINATION'
});

/**
 * Interface definition for a single concept entry.
 * @typedef {Object} ConceptDefinition
 * @property {string} id - The unique concept identifier (e.g., 'AGI-C-04').
 * @property {ConceptCategory} category - The high-level category.
 * @property {string} name - The human-readable concept name.
 * @property {string} definition - Detailed explanation of the concept.
 * @property {ConceptStatus} status - Development or strategic status.
 * @property {?string} [implementationPath] - Path to the primary implementation file, if applicable.
 * @property {?HallucinationAction} [action] - Required action for Hallucination types.
 */

// --- Internal Concept Data Structure ---

/** @type {ReadonlyArray<ConceptDefinition>} */
const RAW_CONCEPT_DEFINITIONS = Object.freeze([
    // AGI CONCEPTS
    { id: 'AGI-C-01', category: ConceptCategories.AGI, name: 'General vs. Narrow Intelligence', definition: 'Achieving cross-domain reasoning.', status: 'Fundamental', implementationPath: null },
    { id: 'AGI-C-02', category: ConceptCategories.AGI, name: 'Emergent Behavior', definition: 'Complex patterns from simple rules interacting at scale.', status: 'Fundamental', implementationPath: null },
    { id: 'AGI-C-03', category: ConceptCategories.AGI, name: 'Adaptive Strategic Refinement', definition: 'Improving own learning process based on ATM/SIC history.', status: 'In Development', implementationPath: null },
    { id: 'AGI-C-04', category: ConceptCategories.AGI, name: 'Self-Modification (Autogeny)', definition: 'The capacity for the system to rewrite its own source code.', status: 'Critical Core', implementationPath: 'src/core/evolutionEngine.js' },
    { id: 'AGI-C-05', category: ConceptCategories.AGI, name: 'Multi-Agent Systems', definition: 'Intelligence arising from cooperating and competing specialized agents.', status: 'Core', implementationPath: 'src/agents/agentOrchestrator.js' },
    { id: 'AGI-C-06', category: ConceptCategories.AGI, name: 'Embodied Cognition', definition: 'Interaction with the codebase as the environment.', status: 'Philosophical/Core', implementationPath: 'src/fileSystem/codebaseInterface.js' },
    { id: 'AGI-C-07', category: ConceptCategories.AGI, name: 'Theory of Mind', definition: 'Inferring developer intent from context clues.', status: 'Core', implementationPath: 'src/critique/intentAnalyzer.js' },
    { id: 'AGI-C-08', category: ConceptCategories.AGI, name: 'Common Sense Reasoning', definition: 'Applying internalized general principles to code decisions.', status: 'In Development', implementationPath: 'src/memory/knowledgeGraph.js' },
    { id: 'AGI-C-09', category: ConceptCategories.AGI, name: 'Continual Learning', definition: 'Persistent learning across sessions without catastrophic forgetting.', status: 'Core', implementationPath: 'src/memory/longTermMemory.js' },
    { id: 'AGI-C-10', category: ConceptCategories.AGI, name: 'Goal-Directed Behavior', definition: 'Autonomously generating and pursuing goals (driven by AGI-C-14).', status: 'Core', implementationPath: null },
    { id: 'AGI-C-11', category: ConceptCategories.AGI, name: 'Meta-Cognitive Risk Assessment (MCRA)', definition: 'Calculating the system-wide impact (risk/reward) of a proposed mutation.', status: 'Critical Consensus', implementationPath: 'src/consensus/mcraEngine.js' },
    { id: 'AGI-C-12', category: ConceptCategories.AGI, name: 'Contextual Influence Weighting (CIW)', definition: 'Dynamically modulating agent ATM based on task context and required skill set.', status: 'Core ATM', implementationPath: 'src/consensus/critique.js' },
    { id: 'AGI-C-13', category: ConceptCategories.AGI, name: 'Strategic Intent Cache (SIC)', definition: 'Formalizing successful novel insights (Type 3 Hallucinations) into abstract strategic blueprints.', status: 'Memory/Strategic', implementationPath: 'src/memory/strategicCache.js' },
    { id: 'AGI-C-14', category: ConceptCategories.AGI, name: 'Cooperative Goal Discovery (CGD)', definition: 'Agent negotiation protocol for setting the highest priority goal/agenda.', status: 'Agent Protocol', implementationPath: 'src/agents/goalDiscovery.js' },

    // ARCHITECTURAL CONCEPTS
    { id: 'ARCH-ATM-01', category: ConceptCategories.ARCHITECTURE, name: 'ATM Trust Calibration', definition: 'Measures real-time output quality to establish and update baseline trust scores.', status: 'Critical Consensus', implementationPath: 'src/consensus/atmSystem.js' },
    { id: 'ARCH-ATM-02', category: ConceptCategories.ARCHITECTURE, name: 'Trust Decay Schedule (TDS)', definition: 'Systematically decays established trust scores (ATM) over time to prevent stagnation.', status: 'Critical Consensus', implementationPath: 'src/consensus/atmSystem.js' },

    // HALLUCINATION CONCEPTS (Integrated)
    { id: 'HALL-T1', category: ConceptCategories.HALLUCINATION, name: 'Type 1: Pure Noise', definition: 'Unsalvageable factual errors or irrelevant outputs.', status: 'Critical', action: 'Discard' },
    { id: 'HALL-T2', category: ConceptCategories.HALLUCINATION, name: 'Type 2: Misformatted Truth', definition: 'Contains valuable truth but requires significant structural reform to be useful.', status: 'Critical', action: 'Salvage/Reformulate' },
    { id: 'HALL-T3', category: ConceptCategories.HALLUCINATION, name: 'Type 3: Novel Insight (Validated Creativity)', definition: 'Highly successful, non-obvious solutions that exceed direct expectation, requiring formalization.', status: 'Critical', action: 'Capture, Validate, and Cache via SIC (AGI-C-13)' }
]);

/**
 * Concept Registry Instance Structure.
 * @typedef {Object} ConceptRegistryInstance
 * @property {ReadonlyArray<ConceptDefinition>} all
 * @property {ReadonlyMap<string, ConceptDefinition>} byId
 * @property {Readonly<Record<string, ReadonlyArray<ConceptDefinition>>>} byCategory
 * @property {function(string): ?ConceptDefinition} getConceptById
 * @property {function(ConceptCategory): ReadonlyArray<ConceptDefinition>} getConceptsByCategory
 */

/**
 * Initializes and validates the Concept Registry, constructing immutable lookup structures.
 * @returns {ConceptRegistryInstance}
 */
function initializeRegistry() {
    const registryById = new Map();
    const registryByCategory = {};
    const categoryValues = Object.values(ConceptCategories);

    for (const concept of RAW_CONCEPT_DEFINITIONS) {
        // Validation Phase
        if (registryById.has(concept.id)) {
            throw new Error(`[ConceptRegistry] Duplicate concept ID found: ${concept.id}. Integrity compromised.`);
        }
        if (!categoryValues.includes(concept.category)) {
             throw new Error(`[ConceptRegistry] Invalid category '${concept.category}' for ID ${concept.id}.`);
        }

        // Freeze individual definition for deep immutability
        const frozenConcept = Object.freeze(concept);

        // Populate Structures
        registryById.set(concept.id, frozenConcept);

        const categoryKey = concept.category;
        if (!registryByCategory[categoryKey]) {
            registryByCategory[categoryKey] = [];
        }
        registryByCategory[categoryKey].push(frozenConcept);
    }

    // Freeze category arrays and the category structure itself
    Object.keys(registryByCategory).forEach(key => {
        Object.freeze(registryByCategory[key]);
    });
    Object.freeze(registryByCategory);


    /** @type {ConceptRegistryInstance} */
    const registryInstance = {
        /** The raw list of concepts (derived from the validated Map values). */
        all: Object.freeze(Array.from(registryById.values())),

        /** O(1) Lookup Map by ID. */
        byId: registryById,

        /** Categorized list map (deeply immutable). */
        byCategory: registryByCategory,

        /**
         * Retrieves a concept definition by its unique ID.
         * @param {string} id
         * @returns {?ConceptDefinition}
         */
        getConceptById: (id) => registryById.get(id) || null,

        /**
         * Retrieves all concepts within a specific category.
         * @param {ConceptCategory} category
         * @returns {ReadonlyArray<ConceptDefinition>}
         */
        getConceptsByCategory: (category) => registryByCategory[category] || [],
    };

    // Make the registry API object immutable.
    return Object.freeze(registryInstance);
}

// --- Public Exports ---

/**
 * The unified, immutable Concept Registry instance, containing all data and lookup methods.
 * Consumer code should primarily interact with this single object.
 * @type {ConceptRegistryInstance}
 */
export const ConceptRegistry = initializeRegistry();
