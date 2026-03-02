import { TRUST_METRICS_SCHEMA } from '../config/trustCalculusSchema.js';

const WEIGHT_TOLERANCE = 1e-6; // Epsilon to handle floating point errors near 1.0

/**
 * Validates the TRUST_METRICS_SCHEMA configuration to ensure statistical integrity.
 * 
 * Trust Score calculation assumes weights sum precisely to 1.0. This utility checks
 * this assumption and verifies all required schema properties exist before runtime.
 * 
 * @throws {Error} If the schema is invalid (e.g., weights do not sum to 1.0).
 */
export function validateTrustSchema() {
    let totalWeight = 0;
    const schemaEntries = Object.entries(TRUST_METRICS_SCHEMA);

    if (schemaEntries.length === 0) {
        console.warn('Warning: Trust metrics schema is defined but empty.');
        return;
    }

    for (const [metricName, definition] of schemaEntries) {
        if (typeof definition.weight !== 'number' || definition.weight < 0) {
            throw new Error(`Trust Schema Validation Error: Metric '${metricName}' must have a non-negative 'weight'.`);
        }
        if (typeof definition.polarity === 'undefined') {
            throw new Error(`Trust Schema Validation Error: Metric '${metricName}' must define 'polarity'.`);
        }
        totalWeight += definition.weight;
    }

    // Check if the total weight sums to 1.0, within tolerance
    if (Math.abs(totalWeight - 1.0) > WEIGHT_TOLERANCE) {
        throw new Error(`Trust Schema Validation Error: Total schema weight is ${totalWeight.toFixed(6)}. It must sum to 1.0 (within tolerance) to ensure correct calculation normalization.`);
    }

    console.log('Trust metrics schema validated successfully.');
}