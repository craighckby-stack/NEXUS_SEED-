class MetricsSchemaRegistryKernel {
    #PROPOSAL_STATUS_ENUM;
    #PROPOSAL_SCHEMA_DEFINITION;
    #PSHI_CONFIG;
    #FAILURE_TOPOLOGY_TAGS;

    constructor() {
        this.#setupDependencies();
    }

    /**
     * Recursively freezes objects to ensure deep immutability for schemas.
     * @param {Object} obj - The object to freeze
     * @returns {Object} The frozen object
     */
    #deepFreeze(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }
        
        Object.freeze(obj);
        Object.keys(obj).forEach(key => this.#deepFreeze(obj[key]));
        
        return obj;
    }

    /**
     * Sets up all dependencies and constants.
     */
    #setupDependencies() {
        // Core Enumerations
        const PROPOSAL_STATUS_ENUM = Object.freeze({
            ACCEPTED: 'ACCEPTED',
            REJECTED: 'REJECTED',
            PENDING: 'PENDING',
            EVALUATING: 'EVALUATING',
            EXPIRED: 'EXPIRED'
        });
        this.#PROPOSAL_STATUS_ENUM = PROPOSAL_STATUS_ENUM;
        
        const PROPOSAL_STATUS_VALUES = Object.values(PROPOSAL_STATUS_ENUM);

        // Proposal Event Schema Definition
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

        // Operational Configuration Constants
        this.#PSHI_CONFIG = Object.freeze({
            MAX_HISTORY_SIZE: 5000,
            ATM_EMA_DECAY_FACTOR: 0.05,
            RECENT_SCORE_WINDOW: 50,
        });

        // Standardized Failure Tagging Taxonomy
        this.#FAILURE_TOPOLOGY_TAGS = Object.freeze({
            API_SCHEMA_MISALIGNMENT: 'API_Schema_Misalignment',
            RESOURCE_LEAK: 'Resource_Contention_Pattern', 
            PERFORMANCE_REGRESSION: 'Performance_Regression',
            SECURITY_FAILURE: 'Security_Protocol_Failure',
            CONTEXTUAL_DRIFT: 'Contextual_Mandate_Drift',
            TEST_INFRASTRUCTURE_FAILURE: 'Test_Infra_Failure'
        });
    }

    /**
     * Returns the proposal status enumeration.
     * @returns {Object} The proposal status enumeration
     */
    getProposalStatusEnum() {
        return this.#PROPOSAL_STATUS_ENUM;
    }

    /**
     * Returns the proposal schema definition.
     * @returns {Object} The proposal schema definition
     */
    getProposalSchemaDefinition() {
        return this.#PROPOSAL_SCHEMA_DEFINITION;
    }

    /**
     * Returns the PSHI configuration.
     * @returns {Object} The PSHI configuration
     */
    getPSHIConfig() {
        return this.#PSHI_CONFIG;
    }

    /**
     * Returns the failure topology tags.
     * @returns {Object} The failure topology tags
     */
    getFailureTopologyTags() {
        return this.#FAILURE_TOPOLOGY_TAGS;
    }
    
    /**
     * Returns all metrics configuration.
     * @returns {Object} All metrics configuration
     */
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
