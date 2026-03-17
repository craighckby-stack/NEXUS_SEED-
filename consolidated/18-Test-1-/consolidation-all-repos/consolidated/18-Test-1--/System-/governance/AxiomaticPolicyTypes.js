/**
 * @fileoverview Defines the strict schemas for Axiomatic Constraint Vector Definition (ACVD)
 * and Policy Correction Safety Schema (PCSS). These structure definitions, translated from
 * the former Python types, are critical for the UNIFIER's governance compliance layer.
 *
 * This module exports placeholder objects referencing the types defined via JSDoc, enabling
 * both module import by UNIFIER.js and strict type hinting in consuming modules.
 */

/**
 * Defines the structure for stability-related constraints (Epsilon bounds).
 * Mirrors Python type: StabilityBounds
 * @typedef {object} StabilityBounds
 * @property {number} min_epsilon - The minimum allowed stability deviation.
 * @property {number} max_epsilon - The maximum allowed stability deviation.
 * @property {string[]} required_fields - A list of required field names for stability analysis.
 */

/**
 * Defines the overarching Axiomatic Constraint Vector Definition (ACVD) structure.
 * Mirrors Python type: ACVDConfig
 * @typedef {object} ACVDConfig
 * @property {string} version - The schema version identifier.
 * @property {StabilityBounds} stability_bounds - Specific constraints related to operational stability.
 * @property {string[]} security_flags - A list of active security policy flags.
 */

/**
 * Defines the proposed Policy Correction Safety Schema (PCSS) payload structure.
 * Mirrors Python type: PCSSData
 * @typedef {object} PCSSData
 * @property {string} id - Unique identifier for the proposed correction.
 * @property {string} correction_type - The type of correction being proposed (e.g., 'stability_reweight').
 * @property {Object.<string, any>} params - Parameters required for the specific correction_type.
 * @property {string} status - The current status of the correction proposal (e.g., 'PROPOSED', 'VALIDATED').
 */

module.exports = {
    // Exporting objects ensures these definitions are consumable by UNIFIER.js.
    StabilityBounds: {},
    ACVDConfig: {},
    PCSSData: {}
};