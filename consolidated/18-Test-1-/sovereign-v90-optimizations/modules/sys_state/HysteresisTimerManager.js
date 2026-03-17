/**
 * HysteresisTimerManager.js
 * Manages the temporal tracking required for phase transitions based on continuous conditions.
 * Ensures transitions only happen if a condition holds true for a specified duration (hysteresis).
 * Depends on the HysteresisDurationTracker for core timing logic.
 */

class HysteresisTimerManager {
    /** @type {any} */
    #tracker; 
    #logger; 

    /**
     * @param {any} tracker - Instance of the core duration tracker (HysteresisDurationTracker).
     * @param {Console} [logger=console]
     */
    constructor(tracker, logger = console) {
        this.#setupDependencies(tracker, logger);
    }

    /**
     * Extracts synchronous dependency resolution and basic validation.
     * @param {any} tracker 
     * @param {Console} logger 
     */
    #setupDependencies(tracker, logger) {
        if (!tracker || typeof tracker.check !== 'function') {
            this.#throwSetupError("HysteresisTimerManager requires a valid HysteresisDurationTracker instance with a 'check' method.");
        }
        this.#logger = logger;
        this.#tracker = tracker;
    }

    /**
     * Handles fatal setup errors.
     * @param {string} message 
     */
    #throwSetupError(message) {
        throw new Error(message);
    }

    // --- I/O Proxy Functions for External Dependency Interaction ---

    #delegateToTrackerHasTimer(id) {
        return this.#tracker.hasTimer(id);
    }

    #delegateToTrackerCheck(id, requiredDurationMs) {
        return this.#tracker.check(id, requiredDurationMs);
    }

    #logTimerStart(id, requiredDurationMs) {
        this.#logger.debug(`[Timer: ${id}] Started Hysteresis (Target: ${requiredDurationMs}ms)`);
    }

    #delegateToTrackerReset(id) {
        return this.#tracker.reset(id);
    }

    #logTimerReset(id) {
        this.#logger.debug(`[Timer: ${id}] Condition failed, resetting countdown.`);
    }

    #delegateToGetTimerCount() {
        return this.#tracker.getTimerCount();
    }

    #delegateToTrackerResetAll() {
        this.#tracker.resetAll();
    }

    #logResetAll(count) {
        this.#logger.debug(`[Timer Manager] Resetting ${count} timers due to phase context change.`);
    }

    // --- Public Methods ---

    /**
     * Checks if a condition has been continuously met for the required duration.
     * If the condition is new, starts the timer. If it's running, checks expiration.
     * 
     * @param {string} id - Unique identifier for the condition/transition.
     * @param {number} requiredDurationMs - The minimum time (in milliseconds) the condition must hold.
     * @returns {boolean} True if the timer has expired (condition met).
     */
    checkAndStartTimer(id, requiredDurationMs) {
        if (requiredDurationMs <= 0) {
            return true; // Immediate transition
        }
        
        const timerWasRunning = this.#delegateToTrackerHasTimer(id);

        // Delegate core logic to the plugin
        const conditionMet = this.#delegateToTrackerCheck(id, requiredDurationMs);

        if (!timerWasRunning && !conditionMet) {
            // Timer was just started by the check function
            this.#logTimerStart(id, requiredDurationMs);
        }
        
        return conditionMet;
    }

    /**
     * Resets a specific timer, effectively canceling a pending transition.
     * @param {string} id - The ID of the timer to reset.
     */
    resetTimer(id) {
        const wasReset = this.#delegateToTrackerReset(id);
        if (wasReset) {
            this.#logTimerReset(id);
        }
    }

    /**
     * Resets all running timers (typically upon a successful phase transition).
     */
    resetAll() {
        const count = this.#delegateToGetTimerCount();
        this.#delegateToTrackerResetAll();
        
        if (count > 0) {
             this.#logResetAll(count);
        }
    }
}

module.exports = HysteresisTimerManager;