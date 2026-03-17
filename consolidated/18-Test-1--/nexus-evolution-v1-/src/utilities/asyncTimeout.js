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
async function pTimeout(promise, ms, errorMessage = 'Operation timed out') {
    let timerId;

    const timeoutPromise = new Promise((_, reject) => {
        timerId = setTimeout(() => {
            const timeoutError = new Error(errorMessage);
            timeoutError.code = 'ETIMEOUT'; // Standardized code for easier error handling downstream
            reject(timeoutError);
        }, ms);
    });

    try {
        // Use Promise.race to run the original promise and the timeout concurrently
        return await Promise.race([promise, timeoutPromise]);
    } finally {
        // Always clear the timer regardless of which promise settled first
        clearTimeout(timerId);
    }
}

module.exports = { pTimeout };