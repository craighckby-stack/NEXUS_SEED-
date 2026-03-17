import { validateProposalEventSchema, PROPOSAL_STATUS_ENUM } from '../../config/metricsSchema.js';

/**
 * Factory leveraging immediate execution, immutability, and state-agnostic methods
 * to create and validate Proposal Event objects with maximum computational efficiency.
 */
export class ProposalEventFactory {
    
    /**
     * Creates a new, validated, and frozen Proposal Event.
     * Optimizes construction by using layered assignment for efficient default handling.
     * 
     * @param {object} rawEventData - The raw data payload.
     * @returns {object} A validated and frozen Proposal Event object.
     * @throws {Error} If validation fails.
     */
    static create(rawEventData) {
        
        // 1. Validation Check
        const validationResult = validateProposalEventSchema(rawEventData);

        if (!validationResult.isValid) {
            // Optimized Error Aggregation:
            // Chains map and concat operations to aggregate errors without relying on expensive array spread literals.
            const errors = validationResult.missingFields
                .map(f => `Missing required field: ${f}`)
                .concat(validationResult.typeErrors)
                .join('; ');
            
            throw new Error(`Proposal Event failed schema validation: ${errors}`);
        }

        // 2. Efficient Construction and Default Assignment
        const now = Date.now();
        
        // Use Object.assign for guaranteed, single-pass merging of defaults and raw data.
        // Layering ensures factory defaults (timestamp, PENDING status) are present 
        // unless explicitly overridden by rawEventData, eliminating post-construction mutation.
        const validatedEvent = Object.assign(
            {
                timestamp: now, 
                validation_status: PROPOSAL_STATUS_ENUM.PENDING
            },
            rawEventData
        );

        // 3. Immutability Enforcement
        // Essential for ensuring data integrity when queuing the event for consensus.
        return Object.freeze(validatedEvent);
    }
}