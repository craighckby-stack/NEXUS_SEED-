/**
 * AGI Metrics Schema and Consensus Pipeline Constants (AMC)
 * Defines the required structure, enumerations, and operational parameters for the 
 * Proposal History Index (PSHI) and the overall consensus pipeline.
 */

// 1. Core Enumerations (Ensuring immutability and centralized state management)
export const PROPOSAL_STATUS_ENUM = Object.freeze({
    ACCEPTED: 'ACCEPTED',
    REJECTED: 'REJECTED',
    PENDING: 'PENDING',
    EVALUATING: 'EVALUATING',
    EXPIRED: 'EXPIRED'
});

// 2. Proposal Event Schema Definition (Metadata-rich structure for validation)
// Defines expected field names, required status, and data types.
export const PROPOSAL_SCHEMA_DEFINITION = Object.freeze({
    proposal_id: { type: 'string', required: true, description: 'Unique identifier for the code change or directive.' },
    agent_id: { type: 'string', required: true, description: 'ID of the submitting agent (AGI-C-XX).' },
    validation_status: { 
        type: 'enum', 
        enum: Object.values(PROPOSAL_STATUS_ENUM), 
        required: true,
        description: 'Current consensus state of the proposal.'
    },
    timestamp: { type: 'number', required: true, description: 'Creation time (Unix epoch).' },
    trust_score_impact: { type: 'number', required: false, description: 'Delta impact on agent trust model post-resolution.' }
});

// 3. Operational Configuration Constants (PSHI: Proposal/Scoring History Index)
export const PSHI_CONFIG = Object.freeze({
    MAX_HISTORY_SIZE: 5000, // Maximum events retained in temporal memory
    ATM_EMA_DECAY_FACTOR: 0.05, // Alpha value for Agent Trust Model (ATM) EMA calculation
    RECENT_SCORE_WINDOW: 50, // How many CIW scores to track for 'recent' weighting
});

// 4. Standardized Failure Tagging Taxonomy
export const FAILURE_TOPOLOGY_TAGS = Object.freeze({
    API_SCHEMA_MISALIGNMENT: 'API_Schema_Misalignment',
    RESOURCE_LEAK: 'Resource_Contention_Pattern', // Formerly Memory Leak
    PERFORMANCE_REGRESSION: 'Performance_Regression',
    SECURITY_FAILURE: 'Security_Protocol_Failure',
    CONTEXTUAL_DRIFT: 'Contextual_Mandate_Drift',
    TEST_INFRASTRUCTURE_FAILURE: 'Test_Infra_Failure'
});

/**
 * Executes deep validation against the PROPOSAL_SCHEMA_DEFINITION.
 * This performs basic field existence and type checks based on the metadata.
 * 
 * @param {object} event The event object to validate.
 * @returns {object} Validation result { isValid: boolean, missingFields: string[], typeErrors: string[] }.
 */
export function validateProposalEventSchema(event) {
    const result = {
        isValid: true,
        missingFields: [],
        typeErrors: []
    };

    if (!event || typeof event !== 'object') {
        result.isValid = false;
        result.typeErrors.push('Input must be a valid object.');
        return result;
    }

    for (const [key, definition] of Object.entries(PROPOSAL_SCHEMA_DEFINITION)) {
        const value = event[key];
        const exists = value !== undefined && value !== null;

        if (definition.required && !exists) {
            result.missingFields.push(key);
            result.isValid = false;
            continue;
        }

        if (exists) {
            // Basic Type Checking
            if (definition.type === 'string' && typeof value !== 'string') {
                result.typeErrors.push(`${key} requires type string, received ${typeof value}.`);
                result.isValid = false;
            } else if (definition.type === 'number' && typeof value !== 'number') {
                result.typeErrors.push(`${key} requires type number, received ${typeof value}.`);
                result.isValid = false;
            } else if (definition.type === 'enum' && !definition.enum.includes(value)) {
                 result.typeErrors.push(`${key} value is not a valid enum member.`);
                 result.isValid = false;
            }
        }
    }

    return result;
}

// Group all primary exports for comprehensive access
export const AGI_METRICS_CONFIG = {
    PSHI_CONFIG,
    PROPOSAL_STATUS_ENUM,
    PROPOSAL_SCHEMA_DEFINITION,
    FAILURE_TOPOLOGY_TAGS,
    validateProposalEventSchema
};