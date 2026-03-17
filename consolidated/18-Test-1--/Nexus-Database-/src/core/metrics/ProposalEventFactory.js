import { PROPOSAL_SCHEMA_DEFINITION, validateProposalEventSchema, PROPOSAL_STATUS_ENUM } from '../../config/metricsSchema.js';

/**
 * Factory class responsible for creating and validating immutable Proposal Event objects.
 * Ensures 100% adherence to metricsSchema before injection into the PSHI or consensus queue.
 */
export class ProposalEventFactory {
    
    /**
     * Creates a new, validated, and frozen Proposal Event.
     * @param {object} rawEventData - The raw data payload from an Agent submission.
     * @returns {object} A validated and frozen Proposal Event object.
     * @throws {Error} If validation fails (missing required fields or type errors).
     */
    static create(rawEventData) {
        
        // 1. Initial validation using the schema utility
        const validationResult = validateProposalEventSchema(rawEventData);

        if (!validationResult.isValid) {
            const errors = [
                ...validationResult.missingFields.map(f => `Missing required field: ${f}`),
                ...validationResult.typeErrors
            ].join('; ');
            
            throw new Error(`Proposal Event failed schema validation: ${errors}`);
        }

        // 2. Ensure transient fields (like timestamp) are handled if not present in raw data
        const validatedEvent = {
            timestamp: Date.now(), // Default timestamp
            ...rawEventData
        };

        // Ensure the status is valid or defaults to PENDING if necessary (though schema requires it)
        if (!validatedEvent.validation_status) {
            validatedEvent.validation_status = PROPOSAL_STATUS_ENUM.PENDING;
        }

        // 3. Freeze the object to ensure immutability once created.
        return Object.freeze(validatedEvent);
    }
}
