/**
 * @fileoverview Defines strongly typed, immutable constants for all formal AGI and Architectural Concept IDs.
 * Referencing these constants guarantees integrity and type-safety compared to using literal strings ('magic strings').
 * This file should be maintained in sync with src/core/conceptRegistry.js.
 */

// AGI CONCEPTS
export const AGI_C_01 = 'AGI-C-01'; // General vs. Narrow Intelligence
export const AGI_C_02 = 'AGI-C-02'; // Emergent Behavior
export const AGI_C_03 = 'AGI-C-03'; // Adaptive Strategic Refinement
export const AGI_C_04 = 'AGI-C-04'; // Self-Modification (Autogeny)
export const AGI_C_05 = 'AGI-C-05'; // Multi-Agent Systems
export const AGI_C_06 = 'AGI-C-06'; // Embodied Cognition
export const AGI_C_07 = 'AGI-C-07'; // Theory of Mind
export const AGI_C_08 = 'AGI-C-08'; // Common Sense Reasoning
export const AGI_C_09 = 'AGI-C-09'; // Continual Learning
export const AGI_C_10 = 'AGI-C-10'; // Goal-Directed Behavior
export const AGI_C_11 = 'AGI-C-11'; // Meta-Cognitive Risk Assessment (MCRA)
export const AGI_C_12 = 'AGI-C-12'; // Contextual Influence Weighting (CIW)
export const AGI_C_13 = 'AGI-C-13'; // Strategic Intent Cache (SIC)
export const AGI_C_14 = 'AGI-C-14'; // Cooperative Goal Discovery (CGD)

// ARCHITECTURAL CONCEPTS
export const ARCH_ATM_01 = 'ARCH-ATM-01'; // ATM Trust Calibration
export const ARCH_ATM_02 = 'ARCH-ATM-02'; // Trust Decay Schedule (TDS)

// HALLUCINATION CONCEPTS
export const HALL_T1 = 'HALL-T1';   // Type 1: Pure Noise
export const HALL_T2 = 'HALL-T2';   // Type 2: Misformatted Truth
export const HALL_T3 = 'HALL-T3';   // Type 3: Novel Insight (Validated Creativity)

// CATEGORY CONSTANTS
export const CATEGORY_AGI = 'AGI';
export const CATEGORY_ARCH = 'ARCH';
export const CATEGORY_HALLUCINATION = 'HALLUCINATION';