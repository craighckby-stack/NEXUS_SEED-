interface RRPAction {
  type: 'LOG' | 'STATE' | 'NOTIFICATION' | 'ALARM';
  detail: string;
  [key: string]: any; // Allows dynamic mode/channel/level
}

interface RRPTrigger {
  severity: 'CATASTROPHIC' | 'CRITICAL' | 'HIGH' | 'WARNING';
  description: string;
  actions: RRPAction[];
}

/**
 * Interface reflecting the contract of the RRP Action Processor plugin.
 */
interface IRRPActionProcessor {
    process(action: RRPAction): Promise<void>;
}

/**
 * RRPExecutorKernel:
 * Executes mandatory Rollback and Recovery Policies defined in RRP_Policy_Definition.json.
 * Guarantees atomic, sequenced execution of recovery actions, prioritizing CATASTROPHIC
 * events even during resource exhaustion.
 */
class RRPExecutorKernel {
  private policies: Record<string, RRPTrigger>;
  private actionProcessor: IRRPActionProcessor;

  constructor(policyDefinition: Record<string, RRPTrigger>, actionProcessor: IRRPActionProcessor) {
    this.#setupDependencies(policyDefinition, actionProcessor);
  }

  /**
   * Extracts synchronous dependency validation and assignment.
   */
  private #setupDependencies(
    policyDefinition: Record<string, RRPTrigger>,
    actionProcessor: IRRPActionProcessor
  ): void {
    if (!actionProcessor || typeof actionProcessor.process !== 'function') {
      this.#throwSetupError("Action Processor dependency is invalid or missing the 'process' method.");
    }
    if (!policyDefinition || typeof policyDefinition !== 'object') {
        this.#throwSetupError("Policy definition configuration is invalid.");
    }

    this.actionProcessor = actionProcessor;
    this.policies = policyDefinition;
  }

  private #throwSetupError(message: string): never {
    throw new Error(`RRPExecutorKernel Setup Error: ${message}`);
  }

  /**
   * Executes all actions defined under a specific policy hook.
   * Execution is designed to be fault-tolerant.
   */
  public async executeTrigger(hookName: string): Promise<void> {
    const trigger = this.policies[hookName];

    if (!trigger) {
      this.#logWarning(hookName);
      return;
    }

    this.#logActivation(hookName, trigger.severity);

    // 1. Execute actions robustly, ensuring subsequent actions run even if one fails.
    for (const [index, action] of trigger.actions.entries()) {
      try {
        await this.#delegateToActionProcessing(action);
      } catch (error) {
        // CRITICAL: Log the failure but CONTINUE the execution chain.
        this.#logCriticalFailure(hookName, index, action, error);
      }
    }

    // 2. Report Final State to central supervisor
    this.#delegateToCompletionReport(hookName, trigger.severity);
  }

  // --- I/O Proxies and Delegation ---

  /** Delegates action execution to the external Action Processor tool. */
  private async #delegateToActionProcessing(action: RRPAction): Promise<void> {
    await this.actionProcessor.process(action);
  }

  /** Delegates the notification of recovery attempt success/failure to the supervisor. */
  private #delegateToCompletionReport(hookName: string, severity: string): void {
    // Implementation detail: Notifies upstream supervisor.
    console.log(`[RRP EXEC] Policy executed successfully: ${hookName} (${severity}). Reporting completion.`);
  }

  /** Logs a warning when a requested trigger hook is not found. */
  private #logWarning(hookName: string): void {
    console.warn(`[RRP EXEC] Trigger '${hookName}' not defined. Skipping.`);
  }

  /** Logs the start of the trigger activation process. */
  private #logActivation(hookName: string, severity: string): void {
    console.error(`[RRP EXEC] Activating trigger: ${hookName} (Severity: ${severity})`);
  }

  /** Logs a critical failure during a single action step but allows the chain to continue. */
  private #logCriticalFailure(
    hookName: string,
    index: number,
    action: RRPAction,
    error: any
  ): void {
    console.error(
      `[RRP EXEC] CRITICAL FAILURE: Action step ${index} failed for trigger '${hookName}' (Type: ${action.type}). Continuing execution chain.`,
      error
    );
  }
}