/**
 * @fileoverview Implementation of the ConceptIdRegistryKernel.
 * This kernel centralizes, formalizes, and provides immutable access to all AGI and Architectural Concept definitions,
 * replacing the synchronous conceptRegistry.js file and ensuring all configuration is isolated.
 */

// Assuming IConceptIdRegistryKernel interface is known and IRegistryInitializerToolKernel is injected.

class ConceptIdRegistryKernel {
    #registry;
    #ConceptCategories;
    #registryInitializerTool;

    /**
     * @param {IRegistryInitializerToolKernel} registryInitializerTool - Tool to create immutable lookups from raw data.
     */
    constructor(registryInitializerTool) {
        if (!registryInitializerTool || typeof registryInitializerTool.create !== 'function') {
            throw new Error("ConceptIdRegistryKernel requires a valid IRegistryInitializerToolKernel instance.");
        }
        this.#registryInitializerTool = registryInitializerTool;
        this.#setupDependencies();
    }

    /**
     * Isolates configuration definition and synchronous setup of lookup structures.
     * This fulfills the synchronous setup extraction mandate, replacing initialization logic previously in initializeRegistry().
     */
    #setupDependencies() {
        // --- Configuration Definition: Categories ---
        /** @typedef {'AGI'|'ARCH'|'HALLUCINATION'} ConceptCategory */

        this.#ConceptCategories = Object.freeze({
            AGI: 'AGI',
            ARCHITECTURE: 'ARCH',
            HALLUCINATION: 'HALLUCINATION'
        });

        // --- Configuration Definition: Raw Concept Data ---
        const A = this.#ConceptCategories.AGI;
        const R = this.#ConceptCategories.ARCHITECTURE;
        const H = this.#ConceptCategories.HALLUCINATION;

        /** @type {ReadonlyArray<ConceptDefinition>} */
        const RAW_CONCEPT_DEFINITIONS = Object.freeze([
            // AGI CONCEPTS
            { id: 'AGI-C-01', category: A, name: 'General vs. Narrow Intelligence', definition: 'Achieving cross-domain reasoning.', status: 'Fundamental', implementationPath: null },
            { id: 'AGI-C-02', category: A, name: 'Emergent Behavior', definition: 'Complex patterns from simple rules interacting at scale.', status: 'Fundamental', implementationPath: null },
            { id: 'AGI-C-03', category: A, name: 'Adaptive Strategic Refinement', definition: 'Improving own learning process based on ATM/SIC history.', status: 'In Development', implementationPath: null },
            { id: 'AGI-C-04', category: A, name: 'Self-Modification (Autogeny)', definition: 'The capacity for the system to rewrite its own source code.', status: 'Critical Core', implementationPath: 'src/core/evolutionEngine.js' },
            { id: 'AGI-C-05', category: A, name: 'Multi-Agent Systems', definition: 'Intelligence arising from cooperating and competing specialized agents.', status: 'Core', implementationPath: 'src/agents/agentOrchestrator.js' },
            { id: 'AGI-C-06', category: A, name: 'Embodied Cognition', definition: 'Interaction with the codebase as the environment.', status: 'Philosophical/Core', implementationPath: 'src/fileSystem/codebaseInterface.js' },
            { id: 'AGI-C-07', category: A, name: 'Theory of Mind', definition: 'Inferring developer intent from context clues.', status: 'Core', implementationPath: 'src/critique/intentAnalyzer.js' },
            { id: 'AGI-C-08', category: A, name: 'Common Sense Reasoning', definition: 'Applying internalized general principles to code decisions.', status: 'In Development', implementationPath: 'src/memory/knowledgeGraph.js' },
            { id: 'AGI-C-09', category: A, name: 'Continual Learning', definition: 'Persistent learning across sessions without catastrophic forgetting.', status: 'Core', implementationPath: 'src/memory/longTermMemory.js' },
            { id: 'AGI-C-10', category: A, name: 'Goal-Directed Behavior', definition: 'Autonomously generating and pursuing goals (driven by AGI-C-14).', status: 'Core', implementationPath: null },
            { id: 'AGI-C-11', category: A, name: 'Meta-Cognitive Risk Assessment (MCRA)', definition: 'Calculating the system-wide impact (risk/reward) of a proposed mutation.', status: 'Critical Consensus', implementationPath: 'src/consensus/mcraEngine.js' },
            { id: 'AGI-C-12', category: A, name: 'Contextual Influence Weighting (CIW)', definition: 'Dynamically modulating agent ATM based on task context and required skill set.', status: 'Core ATM', implementationPath: 'src/consensus/critique.js' },
            { id: 'AGI-C-13', category: A, name: 'Strategic Intent Cache (SIC)', definition: 'Formalizing successful novel insights (Type 3 Hallucinations) into abstract strategic blueprints.', status: 'Memory/Strategic', implementationPath: 'src/memory/strategicCache.js' },
            { id: 'AGI-C-14', category: A, name: 'Cooperative Goal Discovery (CGD)', definition: 'Agent negotiation protocol for setting the highest priority goal/agenda.', status: 'Agent Protocol', implementationPath: 'src/agents/goalDiscovery.js' },

            // ARCHITECTURAL CONCEPTS
            { id: 'ARCH-ATM-01', category: R, name: 'ATM Trust Calibration', definition: 'Measures real-time output quality to establish and update baseline trust scores.', status: 'Critical Consensus', implementationPath: 'src/consensus/atmSystem.js' },
            { id: 'ARCH-ATM-02', category: R, name: 'Trust Decay Schedule (TDS)', definition: 'Systematically decays established trust scores (ATM) over time to prevent stagnation.', status: 'Critical Consensus', implementationPath: 'src/consensus/atmSystem.js' },

            // HALLUCINATION CONCEPTS (Integrated)
            { id: 'HALL-T1', category: H, name: 'Type 1: Pure Noise', definition: 'Unsalvageable factual errors or irrelevant outputs.', status: 'Critical', action: 'Discard' },
            { id: 'HALL-T2', category: H, name: 'Type 2: Misformatted Truth', definition: 'Contains valuable truth but requires significant structural reform to be useful.', status: 'Critical', action: 'Salvage/Reformulate' },
            { id: 'HALL-T3', category: H, name: 'Type 3: Novel Insight (Validated Creativity)', definition: 'Highly successful, non-obvious solutions that exceed direct expectation, requiring formalization.', status: 'Critical', action: 'Capture, Validate, and Cache via SIC (AGI-C-13)' }
        ]);

        // 1. Initialize Registry using injected Tool
        const registryOutput = this.#registryInitializerTool.create(
            RAW_CONCEPT_DEFINITIONS,
            'id',
            'category',
            Object.values(this.#ConceptCategories)
        );

        // 2. Formalize internal registry structure
        this.#registry = Object.freeze({
            all: registryOutput.all,
            byId: registryOutput.byId,
            byCategory: registryOutput.byGroup,
        });
    }

    /** @returns {Readonly<Record<string, string>>} */
    get ConceptCategories() {
        return this.#ConceptCategories;
    }

    /** @param {string} id */
    getConceptById(id) {
        return this.#registry.byId.get(id);
    }

    /** @param {string} category */
    getConceptsByCategory(category) {
        return this.#registry.byCategory[category] || [];
    }

    getAllConcepts() {
        return this.#registry.all;
    }
}
