/**
 * Constraint Pattern Registry
 * Version 1.0 - Sovereign AGI v94.1
 * Centralizes and manages complex structural patterns (e.g., AST selector logic, security risks) 
 * used by the ConstraintEnforcementEngine.
 */

const PATTERN_DEFINITIONS = {
    'UNSAFE_EVAL': {
        description: 'Usage of the built-in eval() function.',
        severity: 'CRITICAL',
        ast_query: 'CallExpression[callee.name="eval"]', 
        metric_required: 'syntax.ast'
    },
    'ASYNC_BLOCKER_IO': {
        description: 'Detection of synchronous I/O operations (e.g., readFileSync) outside initialization context.',
        severity: 'MAJOR',
        ast_query: 'CallExpression[callee.property.name="Sync"]', 
        metric_required: 'syntax.ast'
    },
    'GLOBAL_MUTATION': {
        description: 'Direct assignment to global or process variables outside expected context.',
        severity: 'MAJOR',
        ast_query: 'AssignmentExpression[left.object.name="global"], AssignmentExpression[left.object.name="process"]', 
        metric_required: 'syntax.ast'
    }
};

export class ConstraintPatternRegistry {
    /**
     * @param {Object} [initialPatterns] - Optional map of initial patterns.
     */
    constructor(initialPatterns = PATTERN_DEFINITIONS) {
        this.patterns = initialPatterns;
    }

    /**
     * Retrieves a pattern definition by its unique ID.
     * @param {string} patternId 
     * @returns {Object|null}
     */
    getPattern(patternId) {
        return this.patterns[patternId] || null;
    }

    /**
     * Registers a new pattern definition at runtime.
     * @param {string} patternId
     * @param {Object} definition
     */
    registerPattern(patternId, definition) {
        if (!patternId || !definition) {
             throw new Error("Pattern ID and definition are required for registration.");
        }
        if (this.patterns[patternId]) {
            console.warn(`Pattern ID ${patternId} already registered. Overwriting.`);
        }
        this.patterns[patternId] = definition;
    }
}

export const PatternRegistry = new ConstraintPatternRegistry();
