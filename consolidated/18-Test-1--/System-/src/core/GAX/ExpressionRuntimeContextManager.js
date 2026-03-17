/**
 * GAX Expression Runtime Context Manager (V94.1)
 * Manages execution resource consumption and ensures adherence to GAX_Expr_Core_v2 EngineLimits.
 */
class ExpressionRuntimeContextManager {
  constructor(config) {
    this.limits = config.EngineLimits;
    this.complexity = 0;
    this.depth = 0;
    this.startTime = Date.now();
    // Runtime cache for intermediate results to respect memoizationLimit
    this.memoCache = new Map();
  }

  checkResourceLimits(nodeType) {
    if (this.complexity > this.limits.maxComplexityScore) {
      throw new Error("GAX_EVAL_ERROR: Complexity limit exceeded.");
    }
    if (this.depth > this.limits.maxExecutionDepth) {
      throw new Error("GAX_EVAL_ERROR: Maximum execution depth exceeded.");
    }
    if (Date.now() - this.startTime > this.limits.timeoutMs) {
      throw new Error("GAX_EVAL_ERROR: Execution timeout exceeded.");
    }
  }

  increaseComplexity(scoreIncrement) {
    this.complexity += scoreIncrement;
  }

  enterFunction() {
    this.depth++;
    this.checkResourceLimits('DEPTH_CHECK');
  }

  exitFunction() {
    this.depth--;
  }

  // Method for safe lookup/storage with memoization limit enforcement
  memoize(key, computation) {
    if (this.memoCache.size >= this.limits.memoizationLimit) {
        // Eviction strategy (e.g., LFU/LRU or simple FIFO for stability)
        const oldestKey = this.memoCache.keys().next().value;
        this.memoCache.delete(oldestKey);
    }
    if (!this.memoCache.has(key)) {
      const result = computation();
      this.memoCache.set(key, result);
      return result;
    }
    return this.memoCache.get(key);
  }
}

module.exports = ExpressionRuntimeContextManager;