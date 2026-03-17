/**
 * src/util/AsyncUtilities.js
 * Purpose: Provides standardized, reusable asynchronous control flow utilities (debounce, throttle).
 * This decouples complex scheduling and concurrency logic from domain-specific managers like TrustMatrixManager,
 * increasing code reusability and testability.
 */

/**
 * Accessor for Kernel Plugins. Defined globally in the AGI-KERNEL runtime environment.
 * @type {object} 
 */
declare const AGI_KERNEL_PLUGINS: any;

/**
 * Creates a debounced function that delays invoking the wrapped function until after `wait` milliseconds
 * have elapsed since the last time the debounced function was invoked. Handles asynchronous inner functions.
 * 
 * NOTE: The complex state management and concurrency control is handled by the AsyncDebounceTool plugin.
 * 
 * @param {Function} func - The asynchronous function to debounce.
 * @param {number} wait - The number of milliseconds to wait.
 * @returns {Function & {flush: Function}} A new debounced function with a manual `flush` method.
 */
export function debounce(func, wait) {
    if (typeof func !== 'function' || typeof wait !== 'number' || wait < 0) {
        throw new Error("Invalid arguments for debounce: func must be a function and wait must be a non-negative number.");
    }
    
    // Delegation to the extracted AsyncDebounceTool plugin logic.
    // The plugin factory handles closure state management, context binding, and asynchronous safety.
    if (typeof AGI_KERNEL_PLUGINS !== 'undefined' && AGI_KERNEL_PLUGINS.AsyncDebounceTool) {
        const debouncedFunc = AGI_KERNEL_PLUGINS.AsyncDebounceTool.execute({ func, wait });
        return debouncedFunc;
    }

    // CRITICAL Fallback: If the kernel environment is not fully initialized, we cannot provide the service.
    console.error("CRITICAL: AsyncDebounceTool is not initialized. Async control flow will fail.");
    
    // Return a function that logs and does nothing, maintaining the expected function signature.
    const noopDebounce = (...args: any) => { /* noop */ };
    (noopDebounce as any).flush = () => { /* noop */ };
    return noopDebounce as any;
}

// Future exports: throttle, queueManager, rateLimit etc.
