import { RCMConfig, UsageSnapshot, CostReport } from '../types/EfficiencyTypes';
import { ExpressionEvaluator } from '../utilities/ExpressionEvaluator';

// Type representing cumulative usage stored internally
type AggregateUsage = UsageSnapshot & { 
    last_updated: number; 
    // Ensures that all tracked metrics are numerical upon storage
    [key: string]: number | undefined;
};

/**
 * ResourceAuditor: The core utility for high-frequency tracking, cost calculation,
 * and enforcement of RCM policies.
 */
export class ResourceAuditor {
    private config: RCMConfig;
    private meter: Map<string, AggregateUsage>;
    private evaluator: ExpressionEvaluator;

    constructor(initialConfig: RCMConfig) {
        this.config = initialConfig;
        this.meter = new Map();
        // Dependency injection of the secure expression handling utility
        this.evaluator = new ExpressionEvaluator(); 
        console.log(`Resource Auditor initialized with RCM v${initialConfig.version}.`);
    }

    /** Updates the RCM configuration dynamically. */
    public updateConfig(newConfig: RCMConfig): void {
        this.config = newConfig;
    }

    /** 
     * Records resource usage metrics for a specific task/module, performing high-speed aggregation.
     * Assumes UsageSnapshot fields (tokens, cpu_ms, etc.) are numerical.
     */
    public recordUsage(moduleId: string, usage: Partial<UsageSnapshot>): void {
        const existing = this.meter.get(moduleId) || { last_updated: Date.now() };

        // Aggregate new usage onto existing metrics
        for (const key in usage) {
            if (usage.hasOwnProperty(key)) {
                const value = usage[key as keyof UsageSnapshot];
                if (typeof value === 'number') {
                    (existing as any)[key] = ((existing as any)[key] || 0) + value;
                }
            }
        }

        existing.last_updated = Date.now();
        this.meter.set(moduleId, existing as AggregateUsage);
    }

    /** 
     * Calculates operational cost based on current usage, leveraging the secure expression evaluator.
     */
    public calculateCost(moduleId: string, currentUsage: UsageSnapshot): CostReport {
        const moduleConfig = this.config.modules[moduleId];
        const model = moduleConfig?.cost_model;
        
        if (!model) {
            return {
                total_cost: 0.0,
                module: moduleId,
                calculation_reason: "No cost model defined for module."
            };
        }

        // Use the secure evaluator, injecting the current usage data as context variables
        const cost = this.evaluator.safeEvaluate(model, currentUsage);

        return {
            total_cost: parseFloat(cost.toFixed(6)), 
            module: moduleId,
            calculation_reason: `Evaluated model: ${model}`
        };
    }

    /** Checks all adaptive policies against current system state and applies actions. */
    public checkAdaptivePolicies(): string[] {
        const actions: string[] = [];
        // In a production system, `getSystemStatus()` would fetch real-time metrics.
        const systemContext = { 
            global_load: 0.85, // Example metric
            high_cost_modules_count: Array.from(this.meter.keys()).length // Example metric
        };

        for (const policy of this.config.adaptive_policies || []) {
            if (this.evaluator.safeEvaluateBoolean(policy.trigger_condition, systemContext)) {
                console.log(`[RCM Policy Enforcement] Triggered: ${policy.name}. Action: ${policy.action_name}`);
                actions.push(policy.action_name);
                // Dispatch policy enforcement signal (external system call)
            }
        }

        return actions; 
    }

    /** Retrieves the current aggregated usage snapshot for external reporting. */
    public getAggregatedUsage(moduleId: string): AggregateUsage | undefined {
        return this.meter.get(moduleId);
    }
}