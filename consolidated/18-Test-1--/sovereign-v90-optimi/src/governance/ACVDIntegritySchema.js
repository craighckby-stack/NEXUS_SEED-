class ACVDIntegritySchemaRegistryKernel {
    /**
     * Initializes the registry.
     * @returns {Promise<void>}
     */
    async initialize() {
        // Standard kernel initialization hook.
    }

    /**
     * Retrieves the ACVD Integrity Policy Configuration Schema.
     * @returns {Promise<object>} The immutable JSON Schema object.
     */
    async getACVDIntegritySchema() {
        const ACVDIntegritySchema = {
            type: 'object',
            $id: 'ACVD_V94_1_PolicyConfig',
            required: ['policy_thresholds', 'attestation_requirements'],
            properties: {
                policy_thresholds: {
                    type: 'object',
                    required: ['integrity_veto_bounds', 'utility_maximization'],
                    properties: {
                        integrity_veto_bounds: {
                            type: 'object',
                            required: ['max_pvlm_failures', 'max_mpam_failures'],
                            properties: {
                                max_pvlm_failures: { type: 'number', minimum: 0 },
                                max_mpam_failures: { type: 'number', minimum: 0 }
                            }
                        },
                        utility_maximization: {
                            type: 'object',
                            required: ['UFRM'],
                            properties: {
                                UFRM: { type: 'number' }
                            }
                        }
                    }
                },
                attestation_requirements: {
                    type: 'object',
                    required: ['ecvm_required'],
                    properties: {
                        ecvm_required: { type: 'boolean' }
                    }
                }
            }
        };

        // Configuration objects exposed by registries must be immutable.
        return Object.freeze(ACVDIntegritySchema);
    }
}

module.exports = ACVDIntegritySchemaRegistryKernel;