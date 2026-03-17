import { RCMConfig, UsageSnapshot, CostReport } from '../types/EfficiencyTypes';
import { ExpressionEvaluator } from '../utilities/ExpressionEvaluator';

// AggregateUsage is a super-set of UsageSnapshot, ensuring numerical tracking and timestamp.
// Optimization Note: This structure relies on fast, direct property access via index signature.
type AggregateUsage = UsageSnapshot & { 
    last_updated: number; 
    [key: string]: number | undefined;
};

/**
 * ResourceAuditor: Core utility for high-frequency tracking, cost calculation,
 * and enforcement of RCM policies.
 */
export class ResourceAuditor {
    private config: RCMConfig;
    // Map provides O(1) average time complexity for module lookup.
    private meter: Map<string, AggregateUsage>;
    private evaluator: ExpressionEvaluator;

    constructor(initialConfig: RCMConfig) {
        this.config = initialConfig;
        this.meter = new Map<string, AggregateUsage>();
        // Dependency injection for recursive expression handling
        this.evaluator = new ExpressionEvaluator(); 
        // console.log(`Resource Auditor initialized with RCM v${initialConfig.version}.`);
    }

    /** Updates the RCM configuration dynamically. (O(1)) */
    public updateConfig(newConfig: RCMConfig): void {
        this.config = newConfig;
    }

    /** 
     * Records resource usage metrics. Optimized for high-speed aggregation (O(N) where N is keys in usage).
     * Uses direct property iteration instead of 'for...in' and 'hasOwnProperty'.
     */
    public recordUsage(moduleId: string, usage: Partial<UsageSnapshot>): void {
        let existing = this.meter.get(moduleId);

        if (!existing) {
            // Initialize base structure with minimum overhead.
            existing = { last_updated: 0 } as AggregateUsage;
        }

        // Use Object.keys for fast, direct iteration over usage metrics.
        const keys = Object.keys(usage) as Array<keyof UsageSnapshot>;
        
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const value = usage[key];

            if (typeof value === 'number') {
                // Perform accumulation directly, leveraging 'any' cast for performance 
                // and reliance on the index signature for dynamic properties.
                const currentTotal = (existing as any)[key] || 0;
                (existing as any)[key] = currentTotal + value;
            }
        }

        // Final update (O(1) average)
        existing.last_updated = Date.now();
        this.meter.set(moduleId, existing);
    }

    /** 
     * Calculates operational cost, delegating evaluation to a specialized engine. 
     * O(Complexity of model evaluation)
     */
    public calculateCost(moduleId: string, currentUsage: UsageSnapshot): CostReport {
        const model = this.config.modules[moduleId]?.cost_model;
        
        if (!model) {
            return { total_cost: 0.0, module: moduleId, calculation_reason: "No cost model defined." };
        }

        // Abstracting policy evaluation to a dedicated, potentially recursive utility.
        const cost = this.evaluator.safeEvaluate(model, currentUsage);

        return {
            total_cost: parseFloat(cost.toFixed(6)), 
            module: moduleId,
            calculation_reason: `Evaluated model: ${model}`
        };
    }

    /** Checks all adaptive policies. O(N * Complexity of policy evaluation). */
    public checkAdaptivePolicies(): string[] {
        const actions: string[] = [];
        const systemContext = { 
            global_load: 0.85, 
            high_cost_modules_count: this.meter.size 
        };

        const policies = this.config.adaptive_policies || [];

        for (const policy of policies) {
            // Recursive Abstraction: Policy evaluation logic is isolated to the ExpressionEvaluator.
            if (this.evaluator.safeEvaluateBoolean(policy.trigger_condition, systemContext)) {
                // console.log(`[RCM Policy Enforcement] Triggered: ${policy.name}`);
                actions.push(policy.action_name);
            }
        }

        return actions; 
    }

    /** Retrieves the current aggregated usage snapshot. (O(1)) */
    public getAggregatedUsage(moduleId: string): AggregateUsage | undefined {
        return this.meter.get(moduleId);
    }
}