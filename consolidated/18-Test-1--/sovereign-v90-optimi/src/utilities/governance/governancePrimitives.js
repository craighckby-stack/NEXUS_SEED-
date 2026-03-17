/**
 * Utility file defining standard governance primitives used across the system
 * to enforce consistency, locking, and traceable error handling in critical sections.
 */

/**
 * NOTE: CriticalSectionLockUtility is assumed to be injected and available in the execution context.
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
 * This class now serves as a stable interface, delegating the actual locking and state
 * management (isLocked, currentHolder) to the CriticalSectionLockUtility plugin
 * for better modularity and potential integration with external consensus mechanisms.
 */
export class GovernanceLock {

    /**
     * Attempts to acquire the lock. Throws if already held.
     * @param {string} holderIdentifier - Component ID attempting to acquire the lock (e.g., 'ASCM_DEPLOYMENT_CORE').
     * @returns {boolean}
     */
    static acquire(holderIdentifier) {
        // Delegate to the CriticalSectionLockUtility plugin
        // The plugin handles state and throws GovernanceError compatible errors (GOV_L001)
        if (typeof CriticalSectionLockUtility === 'undefined' || !CriticalSectionLockUtility.acquire) {
            throw new GovernanceError("CriticalSectionLockUtility is unavailable.", "GOV_L003");
        }
        return CriticalSectionLockUtility.acquire(holderIdentifier);
    }

    /**
     * Releases the lock, verifying the request comes from the holder.
     * @param {string} holderIdentifier - Component ID releasing the lock.
     */
    static release(holderIdentifier) {
        // Delegate to the CriticalSectionLockUtility plugin
        // The plugin handles validation and throws GovernanceError compatible errors (GOV_L002)
        if (typeof CriticalSectionLockUtility === 'undefined' || !CriticalSectionLockUtility.release) {
            // Cannot release if utility is missing, but if already unlocked, this is often fine.
            return;
        }
        CriticalSectionLockUtility.release(holderIdentifier);
    }

    /**
     * Retrieves the current lock status for inspection.
     * @returns {{isLocked: boolean, currentHolder: string | null}}
     */
    static getStatus() {
        if (typeof CriticalSectionLockUtility === 'undefined' || !CriticalSectionLockUtility.getStatus) {
            return { isLocked: false, currentHolder: null };
        }
        return CriticalSectionLockUtility.getStatus();
    }
}