import { RCMConfig, UsageSnapshot, CostReport } from '../types/EfficiencyTypes';

// Define the interface that the secure expression evaluator satisfies.
interface EvaluatorPlugin {
    safeEvaluate(expression: string, context: Record<string, any>): number;
    safeEvaluateBoolean(expression: string, context: Record<string, any>): boolean;
}

// Re-declare AggregateUsage type based on the external meter's output structure
type AggregateUsage = UsageSnapshot & { 
    last_updated: number; 
    [key: string]: number | undefined; 
};

// Define the interface for the extracted Usage Meter logic
interface UsageMeterPlugin {
    recordUsage(moduleId: string, usage: Partial<UsageSnapshot>): void;
    getAggregatedUsage(moduleId: string): AggregateUsage | undefined;
    getAllModules(): string[];
}

/**
 * ResourceAuditorKernel: The core utility for cost calculation and RCM policy enforcement.
 * Relies on strictly injected external plugins for secure expression evaluation and usage metering.
 */
export class ResourceAuditorKernel {
    #config: RCMConfig;
    #evaluator: EvaluatorPlugin;
    #meter: UsageMeterPlugin;

    /**
     * @param initialConfig The initial Resource Consumption Management configuration.
     * @param meterPlugin The plugin for tracking resource usage metrics.
     * @param evaluatorPlugin The secure plugin for evaluating cost models and policy conditions.
     */
    constructor(
        initialConfig: RCMConfig, 
        meterPlugin: UsageMeterPlugin,
        evaluatorPlugin: EvaluatorPlugin
    ) {
        this.#setupDependencies(initialConfig, meterPlugin, evaluatorPlugin);
    }

    // --- Private Setup and Configuration --- 

    /**
     * Executes synchronous dependency validation and assignment.
     */
    #setupDependencies(
        config: RCMConfig, 
        meter: UsageMeterPlugin,
        evaluator: EvaluatorPlugin
    ): void {
        if (!config || !meter || !evaluator) {
            this.#throwSetupError("RCMConfig, UsageMeterPlugin, and EvaluatorPlugin must be provided.");
        }
        this.#config = config;
        this.#meter = meter;
        this.#evaluator = evaluator;
        this.#logInitializationSuccess(config.version);
    }

    // --- Private I/O Proxies (External Dependency Interaction) ---

    #throwSetupError(message: string): never {
        throw new Error(`[ResourceAuditorKernel Setup Error] ${message}`);
    }

    #logInitializationSuccess(version: string): void {
        console.info(`[ResourceAuditorKernel] Initialized successfully. RCM Version: ${version}`);
    }

    #logPolicyEnforcement(policyName: string, actionName: string): void {
        console.log(`[RCM Policy Enforcement] Triggered: ${policyName}. Action: ${actionName}`);
    }

    #delegateToMeterRecordUsage(moduleId: string, usage: Partial<UsageSnapshot>): void {
        this.#meter.recordUsage(moduleId, usage);
    }

    #delegateToMeterGetAggregatedUsage(moduleId: string): AggregateUsage | undefined {
        return this.#meter.getAggregatedUsage(moduleId);
    }
    
    #delegateToMeterGetAllModules(): string[] {
        return this.#meter.getAllModules();
    }

    #delegateToEvaluatorSafeEvaluate(expression: string, context: Record<string, any>): number {
        return this.#evaluator.safeEvaluate(expression, context);
    }

    #delegateToEvaluatorSafeEvaluateBoolean(expression: string, context: Record<string, any>): boolean {
        return this.#evaluator.safeEvaluateBoolean(expression, context);
    }

    // --- Public Methods ---

    /** Updates the RCM configuration dynamically. */
    public updateConfig(newConfig: RCMConfig): void {
        this.#config = newConfig;
    }

    /** 
     * Delegates usage recording to the external metering plugin.
     */
    public recordUsage(moduleId: string, usage: Partial<UsageSnapshot>): void {
        this.#delegateToMeterRecordUsage(moduleId, usage);
    }

    /** 
     * Calculates operational cost based on current usage, leveraging the secure expression evaluator.
     */
    public calculateCost(moduleId: string, currentUsage: UsageSnapshot): CostReport {
        const moduleConfig = this.#config.modules[moduleId];
        const model = moduleConfig?.cost_model;
        
        if (!model) {
            return {
                total_cost: 0.0,
                module: moduleId,
                calculation_reason: "No cost model defined for module."
            };
        }

        // Use the secure evaluator plugin via proxy
        const cost = this.#delegateToEvaluatorSafeEvaluate(model, currentUsage);

        return {
            total_cost: parseFloat(cost.toFixed(6)), 
            module: moduleId,
            calculation_reason: `Evaluated model: ${model}`
        };
    }

    /** Checks all adaptive policies against current system state and applies actions. */
    public checkAdaptivePolicies(): string[] {
        const actions: string[] = [];
        
        // Get module list via proxy
        const allModules = this.#delegateToMeterGetAllModules();

        const systemContext = { 
            global_load: 0.85, // Example metric
            high_cost_modules_count: allModules.length 
        };

        for (const policy of this.#config.adaptive_policies || []) {
            // Evaluate trigger condition via proxy
            if (this.#delegateToEvaluatorSafeEvaluateBoolean(policy.trigger_condition, systemContext)) {
                this.#logPolicyEnforcement(policy.name, policy.action_name);
                actions.push(policy.action_name);
            }
        }

        return actions; 
    }

    /** Retrieves the current aggregated usage snapshot from the metering plugin. */
    public getAggregatedUsage(moduleId: string): AggregateUsage | undefined {
        return this.#delegateToMeterGetAggregatedUsage(moduleId);
    }
}