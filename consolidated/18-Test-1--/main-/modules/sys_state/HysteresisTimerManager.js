/**
 * HysteresisTimerManager.js
 * Manages the temporal tracking required for phase transitions based on continuous conditions.
 * Ensures transitions only happen if a condition holds true for a specified duration (hysteresis).
 */
class HysteresisTimerManager {
    constructor(logger = console) {
        /**
         * Storage for running timers.
         * Key: Condition ID (e.g., 'NORMAL_TO_DEGRADED')
         * Value: { startTime: timestamp, requiredDuration: ms }
         */
        this.timers = new Map();
        this.logger = logger;
    }

    /**
     * Checks if a condition has been continuously met for the required duration.
     * If the condition is new, starts the timer. If it's running, checks expiration.
     * 
     * @param {string} id - Unique identifier for the condition/transition.
     * @param {number} requiredDurationMs - The minimum time (in milliseconds) the condition must hold.
     * @returns {boolean} True if the timer has expired (condition met).
     */
    checkAndStartTimer(id, requiredDurationMs) {
        const now = Date.now();
        let timer = this.timers.get(id);

        if (requiredDurationMs <= 0) {
            return true; // Immediate transition
        }

        if (!timer) {
            // Condition just started meeting requirements. Initialize timer.
            this.timers.set(id, {
                startTime: now,
                requiredDuration: requiredDurationMs
            });
            this.logger.debug(`[Timer: ${id}] Started Hysteresis (Target: ${requiredDurationMs}ms)`);
            return false; 
        }

        // Timer is running. Check if expired.
        if (now - timer.startTime >= requiredDurationMs) {
            return true; 
        }

        // Timer still counting down
        return false;
    }

    /**
     * Resets a specific timer, effectively canceling a pending transition.
     * @param {string} id - The ID of the timer to reset.
     */
    resetTimer(id) {
        if (this.timers.has(id)) {
            this.logger.debug(`[Timer: ${id}] Condition failed, resetting countdown.`);
            this.timers.delete(id);
        }
    }

    /**
     * Resets all running timers (typically upon a successful phase transition).
     */
    resetAll() {
        if (this.timers.size > 0) {
             this.logger.debug(`[Timer Manager] Resetting ${this.timers.size} timers due to phase context change.`);
        }
        this.timers.clear();
    }
}

module.exports = HysteresisTimerManager;