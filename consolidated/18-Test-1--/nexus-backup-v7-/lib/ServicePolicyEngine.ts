// lib/ServicePolicyEngine.ts

interface RetryPolicy {
  maxRetries: number;
  backoffStrategy: 'EXPONENTIAL' | 'LINEAR';
}

interface ServiceConfig {
  defaultTimeoutMs: number;
  retryPolicy: RetryPolicy;
}

// Interface reflecting the methods provided by the plugin instance
interface IRetryCalculator {
    calculateRetryDelay(attempt: number, initialDelayMs?: number): number;
    shouldRetry(attempt: number): boolean;
}

// Mock declaration for the injected plugin utility for type safety
declare const RetryBackoffCalculatorTool: {
    create(config: RetryPolicy, initialDelayMs?: number): IRetryCalculator;
};

// Minimal stub implementation when the actual tool is not injected (e.g., during tests)
const NoOpRetryCalculator: IRetryCalculator = {
    calculateRetryDelay: () => 0,
    shouldRetry: () => false
};

/**
 * Manages and calculates delays and timeouts based on GRS ServiceConfiguration.
 * Required for implementing resilient network operations within the AGI mesh.
 */
export class ServicePolicyEngine {
  private readonly #config: ServiceConfig;
  private #retryCalculator: IRetryCalculator;

  constructor(config: ServiceConfig) {
    this.#config = config;
    this.#setupDependencies();
  }

  // I/O Proxy: Handles console logging
  private #logMissingDependencyWarning(): void {
      console.warn("RetryBackoffCalculatorTool not found, using NoOp stub.");
  }

  // I/O Proxy: Handles dependency resolution and external tool creation
  private #delegateToCalculatorCreation(): IRetryCalculator {
    // Check global scope availability
    if (typeof RetryBackoffCalculatorTool !== 'undefined' && RetryBackoffCalculatorTool.create) {
        // Delegate to external factory with fixed parameters
        return RetryBackoffCalculatorTool.create(this.#config.retryPolicy, 200);
    } 
    // I/O Proxy: Logging the failure
    this.#logMissingDependencyWarning();
    return NoOpRetryCalculator;
  }

  // Strategic Goal: Synchronous Setup Extraction
  private #setupDependencies(): void {
      // Initialize the crucial internal dependency using the proxy
      this.#retryCalculator = this.#delegateToCalculatorCreation();
  }

  public getDefaultTimeout(): number {
    return this.#config.defaultTimeoutMs;
  }

  // I/O Proxy: Delegation to the internal calculator dependency
  private #delegateToCalculateRetryDelay(attempt: number, initialDelayMs?: number): number {
      return this.#retryCalculator.calculateRetryDelay(attempt, initialDelayMs);
  }

  /**
   * Calculates the delay (in milliseconds) before the next retry attempt.
   * Delegates calculation to the dedicated RetryBackoffCalculator utility.
   * @param attempt Current attempt number (1-indexed).
   * @param initialDelayMs Initial delay override (optional).
   */
  public calculateRetryDelay(attempt: number, initialDelayMs?: number): number {
    return this.#delegateToCalculateRetryDelay(attempt, initialDelayMs);
  }

  // I/O Proxy: Delegation to the internal calculator dependency
  private #delegateToShouldRetry(attempt: number): boolean {
      return this.#retryCalculator.shouldRetry(attempt);
  }

  public shouldRetry(attempt: number): boolean {
    return this.#delegateToShouldRetry(attempt);
  }
}