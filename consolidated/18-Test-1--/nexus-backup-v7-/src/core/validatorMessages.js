// src/core/validatorMessages.js

/**
 * Defines standardized messages for concept validation results.
 * Centralizing messages improves consistency, maintainability, and diagnostic clarity.
 */
export const ValidatorMessages = {
    /**
     * @param {string} conceptId
     */
    INVALID_ID: (conceptId) => 
        `Concept ID '${conceptId}' is invalid, malformed, or not found in the CONCEPT_REGISTRY.`,
    
    /**
     * @param {string} conceptId
     * @param {string} name
     */
    DECLARATIVE: (conceptId, name) =>
        `Concept ${conceptId} (${name}) is purely declarative or architectural and requires no dedicated implementation file.`,

    /**
     * @param {string} path
     */
    MISSING_IMPLEMENTATION: (path) =>
        `Implementation defined at '${path}' is missing or inaccessible. HIGH PRIORITY INTEGRITY VIOLATION.`,

    /**
     * @param {string} path
     */
    SUCCESS: (path) =>
        `Implementation path verified successfully at '${path}'.`
};
