// core/governance/UtilityEfficacyMonitor.js

/**
 * Interface for the MetricThresholdComparator plugin (Pre-existing dependency)
 * @interface MetricThresholdComparator
 */
interface MetricThresholdComparator {
    /**
     * Evaluates if a violation has occurred based on metric specification and current value.
     */
    evaluateViolation(metricSpec: { comparator: string, threshold: number }, currentValue: number): boolean;
}

/**
 * Interface for the CompliancePolicyExecutor plugin (New dependency)
 * @interface CompliancePolicyExecutor
 */
interface CompliancePolicyExecutor {
    /**
     * Triggers the policy execution for a detected violation (e.g., logging, alerting, policy engine call).
     */
    escalateViolation(utilityId: string, metricName: string, policyId: string, currentValue: number): Promise<void>;
    
    /**
     * Initiates a state transition or switchover to a target utility.
     */
    initiateFailover(targetUtilityId: string): Promise<void>;
}

// Define configuration shape (simplified)
interface MetricSpec {
    name: string;
    comparator: string; // e.g., 'LESS_THAN'
    threshold: number;
    failure_policy_id?: string;
}

interface UtilitySpec {
    metrics: MetricSpec[];
    failover?: {
        enabled: boolean;
        target_utility_id: string;
    };
}

interface Config {
    default_policy_id: string;
    operational_domains: {
        [domain: string]: {
            utilities: {
                [utilityId: string]: UtilitySpec;
            };
        };
    };
}


// UtilityEfficacyMonitor Class Definition
class UtilityEfficacyMonitor {
  // Utilize robust private class fields for encapsulation
  #config: Config;
  #runtimeMetrics: Record<string, any>;
  #thresholdComparator: MetricThresholdComparator;
  #policyExecutor: CompliancePolicyExecutor;

  /**
   * @param config The governance configuration object (passed directly, not loaded from path).
   * @param thresholdComparator Injected dependency for metric comparison logic.
   * @param policyExecutor Injected dependency for compliance action execution.
   */
  constructor(
    config: Config,
    thresholdComparator: MetricThresholdComparator,
    policyExecutor: CompliancePolicyExecutor
  ) {
    this.#setupDependencies(thresholdComparator, policyExecutor);
    this.#initializeConfiguration(config);
    
    this.#runtimeMetrics = {}; // Data store for live operational metrics (mutable internal state)
    
    console.log(`Efficacy Monitor initialized.`);
  }

  /**
   * Isolates dependency injection and assignment.
   */
  #setupDependencies(thresholdComparator: MetricThresholdComparator, policyExecutor: CompliancePolicyExecutor): void {
    this.#thresholdComparator = thresholdComparator;
    this.#policyExecutor = policyExecutor;
  }

  /**
   * Extracts synchronous configuration setup and immutability enforcement.
   */
  #initializeConfiguration(config: Config): void {
    // Enforce Immutability: Deep-freeze the governance configuration to prevent runtime modification.
    // NOTE: Object.freeze guarantees top-level immutability.
    this.#config = Object.freeze(config);
  }

  /**
   * I/O Proxy: Delegates violation evaluation to the external comparator dependency.
   */
  #delegateToThresholdComparator(metricSpec: MetricSpec, currentValue: number): boolean {
    return this.#thresholdComparator.evaluateViolation(metricSpec, currentValue);
  }

  /**
   * I/O Proxy: Delegates violation escalation action to the external executor dependency.
   */
  async #delegateToPolicyEscalation(
    utilityId: string,
    metricName: string,
    policyId: string,
    currentValue: number
  ): Promise<void> {
    await this.#policyExecutor.escalateViolation(utilityId, metricName, policyId, currentValue);
  }

  /**
   * I/O Proxy: Delegates failover initiation to the external executor dependency.
   */
  async #delegateToFailoverInitiation(targetUtilityId: string): Promise<void> {
    await this.#policyExecutor.initiateFailover(targetUtilityId);
  }

  /**
   * Checks a specific utility against its operational metrics specifications.
   */
  async checkUtilityCompliance(domain: string, utilityId: string, currentMetrics: Record<string, number>): Promise<void> {
    const domainConfig = this.#config.operational_domains[domain];
    if (!domainConfig) {
        console.warn(`Domain ${domain} not configured.`);
        return;
    }
    
    const utilitySpec = domainConfig.utilities[utilityId];
    if (!utilitySpec) {
        console.warn(`Utility ${utilityId} not found in domain ${domain}.`);
        return;
    }

    for (const metricSpec of utilitySpec.metrics) {
      const currentValue = currentMetrics[metricSpec.name];
      
      // Use I/O Proxy 1
      const violation = this.#delegateToThresholdComparator(metricSpec, currentValue);

      if (violation) {
        const policyId = metricSpec.failure_policy_id || this.#config.default_policy_id;
        
        // Use I/O Proxy 2: Escalate violation
        await this.#delegateToPolicyEscalation(utilityId, metricSpec.name, policyId, currentValue);
        
        if (utilitySpec.failover && utilitySpec.failover.enabled) {
          // Use I/O Proxy 3: Initiate failover
          await this.#delegateToFailoverInitiation(utilitySpec.failover.target_utility_id);
        }
      }
    }
  }
}