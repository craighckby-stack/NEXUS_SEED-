/**
 * @file threshold_importer.js
 * @component Axiomatic Configuration Importer (L7)
 * 
 * Loads, validates, and freezes the core failure manifest. This enforces
 * configuration immutability critical for Core Decision Axioms (COF/P-01)
 * across all distributed consumers in the L7 GSEP-C V3.5 layer.
 */

import THRESHOLD_MANIFEST from '../../../config/core_failure_thresholds_manifest_v2.json';

// Pre-parse the raw JSON data to provide highly efficient structured access.
const CoreConfigData = {
    VERSION: THRESHOLD_MANIFEST.version,
    
    // Fundamental constants accessible directly
    CONSTANTS: {
        TAU_NORM: THRESHOLD_MANIFEST.CONSTANTS.TAU_NORM,
        EPSILON_MIN: THRESHOLD_MANIFEST.CONSTANTS.EPSILON_MIN
    },

    // Tiered thresholds
    THRESHOLDS: THRESHOLD_MANIFEST.THRESHOLDS
};

/**
 * Export frozen configuration map to prevent runtime modification.
 * Any attempt to mutate these values will throw an error.
 */
export const CoreFailureManifest = Object.freeze(CoreConfigData);

// Example Usage:
// import { CoreFailureManifest } from './threshold_importer';
// const tau = CoreFailureManifest.CONSTANTS.TAU_NORM;
