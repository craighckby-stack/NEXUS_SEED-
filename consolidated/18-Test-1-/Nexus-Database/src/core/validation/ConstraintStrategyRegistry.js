/**
 * ConstraintStrategyRegistry.js
 * Manages and provides access to custom validation functions (strategies).
 * Allows for modular extension of the IntegrityValidationEngine without modifying core logic.
 */

class ConstraintStrategyRegistry {
    constructor() {
        this.strategies = new Map();

        // Register built-in constraints (e.g., those currently hardcoded in the Engine)
        this.register('regex', (value, param, state) => state.regex.test(value));
        this.register('min_length', (value, param) => (Array.isArray(value) || typeof value === 'string') && value.length >= parseInt(param));
        this.register('is_defined', (value) => value !== undefined && value !== null);
        this.register('is_immutable', () => true);
    }

    /**
     * Registers a new constraint strategy function.
     * @param {string} name - The identifier used in rule manifests (e.g., 'check_uuid').
     * @param {function} handler - The validation function (value, param, state) => boolean.
     */
    register(name, handler) {
        if (this.strategies.has(name)) {
            console.warn(`Constraint strategy '${name}' is being overwritten.`);
        }
        this.strategies.set(name, handler);
    }

    /**
     * Retrieves a constraint strategy by name.
     * @param {string} name
     * @returns {function | undefined}
     */
    get(name) {
        return this.strategies.get(name);
    }
}

// Singleton pattern often useful for registries in non-DI systems
module.exports = new ConstraintStrategyRegistry();