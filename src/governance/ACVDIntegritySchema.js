/**
 * ACVD Policy Configuration Schema Definition.
 * This JSON schema defines the mandatory structure and expected types 
 * for the governance constants loaded by the DynamicPolicyCache.
 * 
 * NOTE: In a complete system, this would be processed by a dedicated validator (e.g., Zod or AJV).
 */

const ACVDIntegritySchema = {
    type: 'object',
    id: 'ACVD_V94_1_PolicyConfig',
    required: ['policy_thresholds', 'attestation_requirements'],
    properties: {
        policy_thresholds: {
            type: 'object',
            required: ['integrity_veto_bounds', 'utility_maximization'],
            properties: {
                integrity_veto_bounds: {
                    type: 'object',
                    required: ['max_pvlm_failures', 'max_mpam_failures'],
                    schema: {
                        max_pvlm_failures: { type: 'number', minimum: 0 },
                        max_mpam_failures: { type: 'number', minimum: 0 }
                    }
                },
                utility_maximization: {
                    type: 'object',
                    required: ['UFRM'],
                    schema: {
                        UFRM: { type: 'number' }
                    }
                }
            }
        },
        attestation_requirements: {
            type: 'object',
            required: ['ecvm_required'],
            schema: {
                ecvm_required: { type: 'boolean' }
            }
        }
    }
};

module.exports = ACVDIntegritySchema;
