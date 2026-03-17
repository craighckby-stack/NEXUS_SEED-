/**
 * @fileoverview Replaced custom promise timeout logic with the dedicated PromiseTimeoutEnforcer plugin.
 */

/**
 * AGI Kernel Plugin: PromiseTimeoutEnforcer
 * @type {{enforceTimeout: (promise: Promise<T>, ms: number, errorMessage: string) => Promise<T>}}
 */
const PromiseTimeoutEnforcer = require('AGI_KERNEL').PromiseTimeoutEnforcer;

/**
 * Utility function to impose a timeout on a promise.
 * Rejects if the promise does not settle (resolve or reject) within the specified duration.
 *
 * @param {Promise<T>} promise - The promise to be timed.
 * @param {number} ms - The timeout duration in milliseconds.
 * @param {string} [errorMessage] - Custom error message for the timeout rejection.
 * @returns {Promise<T>} A promise that resolves to the value of the input promise, or rejects on timeout.
 * @template T
 */
async function pTimeout(promise, ms, errorMessage) {
    // Delegate the complex race and cleanup logic to the specialized plugin
    return PromiseTimeoutEnforcer.enforceTimeout(
        promise,
        ms,
        errorMessage || 'Operation timed out'
    );
}

module.exports = { pTimeout };