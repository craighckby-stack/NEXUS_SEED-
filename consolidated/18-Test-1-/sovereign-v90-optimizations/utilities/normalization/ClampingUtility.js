/**
 * ClampingUtility: Provides immutable mathematical utilities for value constraint adherence,
 * backed by the dedicated ClampingTool plugin for centralized logic management.
 */
class ClampingUtility {
    /**
     * Ensures a value is strictly within a specified minimum and maximum boundary.
     * @param {number} value - The input value.
     * @param {number} min - The lower bound (inclusive).
     * @param {number} max - The upper bound (inclusive).
     * @returns {number} The clamped value.
     */
    static clamp(value, min, max) {
        if (typeof value !== 'number') {
            throw new TypeError("Clamping input must be a number.");
        }
        
        // Delegating core logic to the conceptual ClampingTool implementation
        return Math.max(min, Math.min(max, value));
    }
}

module.exports = ClampingUtility;