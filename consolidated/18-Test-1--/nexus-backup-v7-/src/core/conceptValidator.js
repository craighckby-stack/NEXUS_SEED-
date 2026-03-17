// src/core/conceptValidator.js

import { CONCEPT_REGISTRY } from './conceptRegistry.js';
import { CodebaseAccessor } from '../system/codebaseAccessor.js';
import { ValidatorMessages } from './validatorMessages.js';

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - True if the validation succeeded.
 * @property {string | null} path - The associated implementation path, if any.
 * @property {string} reason - Detailed justification for the result.
 */

/**
 * @fileoverview Utility class for validating references to core AGI and Architectural Concepts.
 * Ensures integrity and verifies file existence using the CodebaseAccessor.
 * Utilizes asynchronous checks (where supported) to prevent event loop blocking (v94.1 optimization).
 */

export class ConceptValidator {

    /**
     * Checks if a given concept ID exists in the registry.
     * @param {string} conceptId - The ID to validate (e.g., 'AGI-C-04').
     * @returns {boolean}
     */
    static isValidConceptId(conceptId) {
        if (typeof conceptId !== 'string' || !conceptId) {
             return false;
        }
        return Object.prototype.hasOwnProperty.call(CONCEPT_REGISTRY, conceptId);
    }

    /**
     * Executes deep validation for a concept: registry existence, path definition,
     * and file existence check via the CodebaseAccessor.
     * @param {string} conceptId - The ID of the concept.
     * @returns {Promise<ValidationResult>}
     */
    static async validateImplementation(conceptId) {
        if (!ConceptValidator.isValidConceptId(conceptId)) {
            return { 
                valid: false, 
                path: null, 
                reason: ValidatorMessages.INVALID_ID(conceptId) 
            };
        }

        const concept = CONCEPT_REGISTRY[conceptId];
        const path = concept.implementationPath;

        // Case 1: Concept is purely philosophical/declarative
        if (!path) {
            return {
                valid: true,
                path: null,
                reason: ValidatorMessages.DECLARATIVE(conceptId, concept.name)
            };
        }

        // Case 2: Concrete Implementation Path Defined. Check existence.
        
        // Attempt asynchronous check for efficiency; fallback to synchronous if necessary.
        const fileExists = CodebaseAccessor.fileExistsAsync 
            ? await CodebaseAccessor.fileExistsAsync(path)
            : CodebaseAccessor.fileExists(path);

        if (!fileExists) {
            return {
                valid: false,
                path,
                reason: ValidatorMessages.MISSING_IMPLEMENTATION(path)
            };
        }

        // Case 3: Implementation verified
        return { 
            valid: true, 
            path, 
            reason: ValidatorMessages.SUCCESS(path) 
        };
    }
}