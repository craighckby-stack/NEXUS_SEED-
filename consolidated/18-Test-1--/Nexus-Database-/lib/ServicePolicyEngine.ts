// lib/ServicePolicyEngine.ts

interface RetryPolicy {
  maxRetries: number;
  backoffStrategy: 'EXPONENTIAL' | 'LINEAR';
}

interface ServiceConfig {
  defaultTimeoutMs: number;
  retryPolicy: RetryPolicy;
}

/**
 * Manages and calculates delays and timeouts based on GRS ServiceConfiguration.
 * Required for implementing resilient network operations within the AGI mesh.
 */
export class ServicePolicyEngine {
  private config: ServiceConfig;

  constructor(config: ServiceConfig) {
    this.config = config;
  }

  public getDefaultTimeout(): number {
    return this.config.defaultTimeoutMs;
  }

  /**
   * Calculates the delay (in milliseconds) before the next retry attempt.
   * @param attempt Current attempt number (1-indexed).
   */
  public calculateRetryDelay(attempt: number, initialDelayMs: number = 200): number {
    if (attempt <= 0 || attempt > this.config.retryPolicy.maxRetries) {
      return 0;
    }

    switch (this.config.retryPolicy.backoffStrategy) {
      case 'EXPONENTIAL':
        // Standard exponential backoff, capped at 30 seconds (30000ms)
        return Math.min(
          initialDelayMs * Math.pow(2, attempt),
          30000
        );
      case 'LINEAR':
        return initialDelayMs * attempt;
      default:
        return initialDelayMs;
    }
  }

  public shouldRetry(attempt: number): boolean {
    return attempt <= this.config.retryPolicy.maxRetries;
  }
}