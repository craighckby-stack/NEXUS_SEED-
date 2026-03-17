import { IExecutionThrottlerToolKernel } from './interfaces/IExecutionThrottlerToolKernel';
import { ICapacityLimitedCacheUtilityToolKernel } from './interfaces/ICapacityLimitedCacheUtilityToolKernel';
import { IGAXEngineLimitsConfigRegistryKernel } from './interfaces/IGAXEngineLimitsConfigRegistryKernel';

/**
 * AGI-KERNEL: GAX Expression Runtime Context Manager Kernel (V1.0)
 * Manages execution resource consumption and memoization via injected kernel dependencies.
 * Achieves high architectural separation by eliminating synchronous global state access and configuration coupling.
 */
class ExpressionRuntimeContextManagerKernel {
  /** @type {IExecutionThrottlerToolKernel} */
  #throttlerKernel;
  /** @type {ICapacityLimitedCacheUtilityToolKernel} */
  #cacheUtilityKernel;
  /** @type {IGAXEngineLimitsConfigRegistryKernel} */
  #limitsRegistry;
  /** @type {object} */
  #memoCacheManager;

  /**
   * @param {IExecutionThrottlerToolKernel} throttlerKernel - Pre-configured execution throttler instance.
   * @param {ICapacityLimitedCacheUtilityToolKernel} cacheUtilityKernel - Utility for cache management and memoization.
   * @param {IGAXEngineLimitsConfigRegistryKernel} limitsRegistry - Configuration registry for GAX engine limits.
   */
  constructor(throttlerKernel, cacheUtilityKernel, limitsRegistry) {
    if (!throttlerKernel || !cacheUtilityKernel || !limitsRegistry) {
        throw new Error("Kernel Initialization Error: ExpressionRuntimeContextManagerKernel requires IExecutionThrottlerToolKernel, ICapacityLimitedCacheUtilityToolKernel, and IGAXEngineLimitsConfigRegistryKernel.");
    }
    
    this.#throttlerKernel = throttlerKernel;
    this.#cacheUtilityKernel = cacheUtilityKernel;
    this.#limitsRegistry = limitsRegistry;
    
    this.#setupDependencies();
  }

  /**
   * Isolates synchronous initialization logic, retrieving configuration and setting up internal state.
   */
  #setupDependencies() {
    const limits = this.#limitsRegistry.getLimits();
    
    // Memoization cache initialization using injected utility and limits from the registry
    this.#memoCacheManager = this.#cacheUtilityKernel.create(limits.memoizationLimit);
    
    // The throttler is assumed to be fully configured upon injection.
  }

  /**
   * Delegates all limit checks (complexity, depth, timeout) to the injected throttler kernel.
   */
  checkResourceLimits() {
    this.#throttlerKernel.check();
  }

  increaseComplexity(scoreIncrement) {
    this.#throttlerKernel.increaseComplexity(scoreIncrement);
  }

  /**
   * Function entry handles depth increment and immediate resource check.
   */
  enterFunction() {
    this.#throttlerKernel.enterScope();
  }

  exitFunction() {
    this.#throttlerKernel.exitScope();
  }

  /**
   * Method for safe lookup/storage with memoization limit enforcement, delegated to injected utility.
   * @param {string} key
   * @param {Function} computation
   * @returns {any}
   */
  memoize(key, computation) {
    return this.#cacheUtilityKernel.memoize(this.#memoCacheManager, key, computation);
  }
}

module.exports = ExpressionRuntimeContextManagerKernel;