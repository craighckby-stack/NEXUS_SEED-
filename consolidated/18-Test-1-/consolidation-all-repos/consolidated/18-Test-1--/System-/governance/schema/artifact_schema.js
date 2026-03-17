/**
 * @fileoverview Artifact Structure Definition Model (ASDM)
 * Purpose: Enforce structural integrity of input artifacts before cryptographic hashing
 * within GSCM. All governance state transitions must adhere to this structure.
 * 
 * Refactored from Python TypedDicts to JavaScript JSDoc types for UNIFIER.js compatibility.
 */

/**
 * @typedef {object} TransitionMetadata
 * @property {string} version
 * @property {string} actor_id
 * @property {string} parent_stage_id
 */

/**
 * @typedef {object} GSEPTransitionArtifact
 * @property {TransitionMetadata} metadata
 * @property {Record<string, any>} configuration_diff  // Delta of configuration changes
 * @property {string[]} audit_trail_hashes      // Hashes of external audit logs/reports
 * @property {Record<string, any>} evolution_directives // Specific governance commands enacted
 */

/**
 * Utility to map stage_id to specific required schema if protocol branches exist.
 * Note: This map references the defined types for documentation purposes.
 * @type {Record<string, string>}
 */
const SCHEMA_MAP = {
    'L0': 'GSEPTransitionArtifact', 
    'L1': 'GSEPTransitionArtifact',
    // ... (L2, L3, etc.)
};

// Export definitions for UNIFIER.js compatibility
module.exports = {
    TransitionMetadata,
    GSEPTransitionArtifact,
    SCHEMA_MAP
};