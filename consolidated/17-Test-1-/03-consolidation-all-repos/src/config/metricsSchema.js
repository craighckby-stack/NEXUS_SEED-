class MetricsSchemaRegistryKernel {
    #PROPOSAL_STATUS_ENUM;
    #PROPOSAL_SCHEMA_DEFINITION;
    #PSHI_CONFIG;
    #FAILURE_TOPOLOGY_TAGS;

    constructor() {
        this.#setupDependencies();
    }

    // Utility to recursively freeze objects (ensures deep immutability for schemas)
    #deepFreeze(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }
        Object.freeze(obj);
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                this.#deepFreeze(obj[key]);
            }
        }
        return obj;
    }

    /**
     * Strictly isolates synchronous setup logic and constant definitions.
     */
    #setupDependencies() {
        // 1. Core Enumerations (PROPOSAL_STATUS_ENUM)
        const PROPOSAL_STATUS_ENUM = Object.freeze({
            ACCEPTED: 'ACCEPTED',
            REJECTED: 'REJECTED',
            PENDING: 'PENDING',
            EVALUATING: 'EVALUATING',
            EXPIRED: 'EXPIRED'
        });
        this.#PROPOSAL_STATUS_ENUM = PROPOSAL_STATUS_ENUM;
        
        const PROPOSAL_STATUS_VALUES = Object.values(PROPOSAL_STATUS_ENUM);

        // 2. Proposal Event Schema Definition (PROPOSAL_SCHEMA_DEFINITION)
        const PROPOSAL_SCHEMA_DEFINITION = {
            proposal_id: { type: 'string', required: true, description: 'Unique identifier for the code change or directive.' },
            agent_id: { type: 'string', required: true, description: 'ID of the submitting agent (AGI-C-XX).' },
            validation_status: { 
                type: 'enum', 
                enum: PROPOSAL_STATUS_VALUES, 
                required: true,
                description: 'Current consensus state of the proposal.'
            },
            timestamp: { type: 'number', required: true, description: 'Creation time (Unix epoch).' },
            trust_score_impact: { type: 'number', required: false, description: 'Delta impact on agent trust model post-resolution.' }
        };
        this.#PROPOSAL_SCHEMA_DEFINITION = this.#deepFreeze(PROPOSAL_SCHEMA_DEFINITION);


        // 3. Operational Configuration Constants (PSHI_CONFIG)
        this.#PSHI_CONFIG = Object.freeze({
            MAX_HISTORY_SIZE: 5000,
            ATM_EMA_DECAY_FACTOR: 0.05,
            RECENT_SCORE_WINDOW: 50,
        });

        // 4. Standardized Failure Tagging Taxonomy (FAILURE_TOPOLOGY_TAGS)
        this.#FAILURE_TOPOLOGY_TAGS = Object.freeze({
            API_SCHEMA_MISALIGNMENT: 'API_Schema_Misalignment',
            RESOURCE_LEAK: 'Resource_Contention_Pattern', 
            PERFORMANCE_REGRESSION: 'Performance_Regression',
            SECURITY_FAILURE: 'Security_Protocol_Failure',
            CONTEXTUAL_DRIFT: 'Contextual_Mandate_Drift',
            TEST_INFRASTRUCTURE_FAILURE: 'Test_Infra_Failure'
        });
    }

    getProposalStatusEnum() {
        return this.#PROPOSAL_STATUS_ENUM;
    }

    getProposalSchemaDefinition() {
        return this.#PROPOSAL_SCHEMA_DEFINITION;
    }

    getPSHIConfig() {
        return this.#PSHI_CONFIG;
    }

    getFailureTopologyTags() {
        return this.#FAILURE_TOPOLOGY_TAGS;
    }
    
    getAllMetricsConfig() {
        return {
            PSHI_CONFIG: this.getPSHIConfig(),
            PROPOSAL_STATUS_ENUM: this.getProposalStatusEnum(),
            PROPOSAL_SCHEMA_DEFINITION: this.getProposalSchemaDefinition(),
            FAILURE_TOPOLOGY_TAGS: this.getFailureTopologyTags(),
        };
    }
}

export { MetricsSchemaRegistryKernel };