/**
 * Utility file defining standard governance primitives used across the system
 * to enforce consistency, locking, and traceable error handling in critical sections.
 */

export class GovernanceError extends Error {
    /**
     * @param {string} message - Descriptive error message.
     * @param {string} errorCode - Unique, traceable system error code (e.g., GOV_L001).
     */
    constructor(message, errorCode = "GOV_E000") {
        super(`[GOVERNANCE ERROR - ${errorCode}] ${message}`);
        this.name = 'GovernanceError';
        this.errorCode = errorCode;
    }
}

/**
 * Abstracted Global Lock Mechanism.
 * In a mature system, this class would interface with hardware/secure configuration
 * systems (like MCR or consensus layers) to enforce atomic, single-threaded access
 * to high-integrity state components (like ActiveStateContextManager).
 */
export class GovernanceLock {
    static isLocked = false;
    static currentHolder = null;

    /**
     * Attempts to acquire the lock. Throws if already held.
     * @param {string} holderIdentifier - Component ID attempting to acquire the lock (e.g., 'ASCM_DEPLOYMENT_CORE').
     * @returns {boolean}
     */
    static acquire(holderIdentifier) {
        if (this.isLocked) {
            throw new GovernanceError(`Critical resource lock currently held by ${this.currentHolder}.`, "GOV_L001");
        }
        this.isLocked = true;
        this.currentHolder = holderIdentifier;
        return true;
    }

    /**
     * Releases the lock, verifying the request comes from the holder.
     * @param {string} holderIdentifier - Component ID releasing the lock.
     */
    static release(holderIdentifier) {
        if (!this.isLocked) return; // Ignore if already unlocked

        if (this.currentHolder !== holderIdentifier) {
            throw new GovernanceError("Unauthorized attempt to release governance lock.", "GOV_L002");
        }
        this.isLocked = false;
        this.currentHolder = null;
    }
}
