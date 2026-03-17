class AxiomManager {
    /**
     * Initializes the manager with a set of base axioms.
     * Axiom structure is assumed to be { id: number, value: number }
     * @param {Array<Object>} rawAxioms - Array of axiom objects
     */
    constructor(rawAxioms) {
        this.axioms = Array.isArray(rawAxioms) ? rawAxioms : [];
        this.lastResult = null;
        this.processed = false;
    }

    /**
     * Validates and retrieves the external computation invoker.
     * @returns {object} The validated AxiomKernelInvoker object
     * @throws {Error} If AxiomKernelInvoker is invalid
     * @private
     */
    #getValidatedInvoker() {
        if (typeof AxiomKernelInvoker?.calculate !== 'function') {
            throw new Error("AxiomKernelInvoker is required and must expose a 'calculate' method.");
        }
        return AxiomKernelInvoker;
    }

    /**
     * Executes the computational process by delegating to the kernel invoker.
     * Implements memoization to prevent redundant calculations.
     * @param {boolean} [forceRecalculation=false] - Skips memoization if true
     * @returns {object} The result set or cached result wrapper
     */
    process(forceRecalculation = false) {
        if (this.processed && !forceRecalculation) {
            return {
                cached: true,
                optimizedResults: this.lastResult
            };
        }

        const invoker = this.#getValidatedInvoker();
        const result = invoker.calculate(this.axioms);

        this.lastResult = result.optimizedResults;
        this.processed = true;
        return result;
    }

    /**
     * Retrieves the last computed result
     * @returns {Object|null} The last result or null if none exists
     */
    getLastResult() {
        return this.lastResult;
    }

    /**
     * Resets the internal state, forcing recalculation on next process call
     */
    resetState() {
        this.processed = false;
        this.lastResult = null;
    }
}
