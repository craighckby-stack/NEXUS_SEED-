interface CheckResult {
  id: string;
  status: 'PASS' | 'FAIL';
}

interface OICConfig {
  checks: Array<{ id: string, action_policy_id: string }>;
  failure_policies: Array<{ policy_id: string, type: string, signal: string, log_level: string, throttle_ms?: number }>;
}

// Declare the external dependency provided by the AGI-KERNEL plugin system
declare const policyResolver: {
  resolve: (checkId: string, config: OICConfig) => any | null;
};

class OICPolicyEngine {
  private config: OICConfig;

  constructor(config: OICConfig) {
    this.config = config;
  }

  /** Processes check results and dispatches corresponding policy actions. */
  public evaluate(results: CheckResult[]): void {
    for (const result of results) {
      if (result.status === 'FAIL') {
        // Use the extracted utility for policy lookup (Check ID -> Check Definition -> Policy ID -> Policy)
        const policy = policyResolver.resolve(result.id, this.config);

        if (policy) {
          this.dispatchPolicy(policy, result);
        } else {
          console.error(`OIC Policy Engine: Failed to resolve actionable policy for failed check ID: ${result.id}. Configuration inconsistency detected.`);
        }
      }
    }
  }

  private dispatchPolicy(policy: any, result: CheckResult): void {
    console.log(`[OIC] Failure detected: ${result.id}. Dispatching policy: ${policy.policy_id} (${policy.type})`);

    switch (policy.type) {
      case 'HARD_STOP':
        // Emergency system shutdown/signal logic
        // Note: process.emit is platform-specific (Node.js)
        if (typeof process !== 'undefined' && process.emit) {
             process.emit(policy.signal, { severity: policy.log_level });
        }
        break;
      case 'ALERT_AND_THROTTLE':
        // Notification and rate limiting implementation
        this.throttleSystem(policy.throttle_ms);
        // Fall through to logging
      case 'LOG_ONLY':
        // Standard logging using specified log_level
        this.logEvent(policy.signal, policy.log_level);
        break;
      default:
        console.warn(`[OIC] Unknown policy type encountered: ${policy.type} for check ${result.id}`);
    }
  }

  private logEvent(signal: string, level: string): void {
    // Implementation using core AGI logging mechanism
    // ...
  }

  private throttleSystem(ms: number): void {
    // Implementation of transient system rate limiting
    // ...
  }
}