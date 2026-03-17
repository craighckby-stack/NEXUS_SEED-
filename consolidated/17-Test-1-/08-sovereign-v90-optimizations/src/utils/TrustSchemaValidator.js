import { TRUST_METRICS_SCHEMA } from '../config/trustCalculusSchema.js';

/**
 * Validates the TRUST_METRICS_SCHEMA configuration to ensure statistical integrity.
 * 
 * Trust Score calculation assumes weights sum precisely to 1.0. This utility checks
 * this assumption and verifies all required schema properties exist before runtime
 * using the NormalizedWeightedSchemaValidator tool.
 * 
 * @throws {Error} If the schema is invalid (e.g., weights do not sum to 1.0).
 */
export function validateTrustSchema() {
    // Leverage the Kernel's NormalizedWeightedSchemaValidator.execute tool.
    // The tool handles iteration, structural checks, normalization (sum to 1.0) and error throwing.
    NormalizedWeightedSchemaValidator.execute({
        schema: TRUST_METRICS_SCHEMA
        // The default tolerance (1e-6) is handled internally by the plugin.
    });

    console.log('Trust metrics schema validated successfully.');
}