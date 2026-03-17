const Joi = require('joi');

/**
 * @Schema PolicyMetadataSchema
 * Defines the standard required metadata for any governance proposal or intent.
 */
const PolicyMetadataSchema = Joi.object({
    proposerId: Joi.string().guid({ version: 'uuidv4' }).required().description('Identifier of the entity proposing the intent.'),
    timestamp: Joi.date().iso().required().description('ISO 8601 timestamp of proposal creation.'),
    requiredApprovals: Joi.number().integer().min(1).default(1).description('Minimum threshold of approvals required for execution.'),
    expirationTime: Joi.date().iso().optional().description('Optional time after which the intent is automatically voided.'),
    sourceHash: Joi.string().length(64).required().description('SHA-256 hash of the canonical intent payload for integrity verification (AIA Mandate).'),
}).required().label('PolicyMetadataSchema');

/**
 * @Schema GovernanceIntentSchema
 * Defines the high-integrity structure for any proposed action requiring consensus
 * or explicit governance oversight within the AGI Kernel Framework.
 */
const GovernanceIntentSchema = Joi.object({
    intentId: Joi.string().guid({ version: 'uuidv4' }).required().description('Globally unique identifier for the governance intent.'),
    intentType: Joi.string().valid(
        'POLICY_UPDATE',
        'CONFIGURATION_ADJUSTMENT',
        'TRUST_MODEL_MIGRATION',
        'SYSTEM_STATE_TRANSITION',
        'RESOURCE_ALLOCATION_CHANGE'
    ).required().description('Categorization of the action the intent proposes.'),
    targetKernel: Joi.string().pattern(/^.+Kernel$/).required().description('The fully qualified name of the target Kernel/Component, must adhere to naming conventions.'),
    payload: Joi.object().required().unknown(true).description('The specific data structure defining the proposed change.'),
    metadata: PolicyMetadataSchema.required().description('High-integrity metadata associated with the proposal process.'),
    validationSchemaName: Joi.string().optional().description('The name of the schema used to validate the payload against the target kernel requirements.'),

}).required().label('GovernanceIntentSchema');

module.exports = {
    GovernanceIntentSchema,
    PolicyMetadataSchema,
    // Placeholder for other governance configuration schemas (e.g., ProposalReceiptSchema)
};
