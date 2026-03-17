interface ExecutionContext {
    severity: string;
    origin_path: string;
    task_type: string;
    metrics: { load: number };
}

interface ResolvedTarget {
    target: string;
    ruleId: string;
    failurePolicy: string;
}

// Exporting interfaces/types for system wide usage and clarity
export type { ExecutionContext, ResolvedTarget };

export class DynamicResolver_v94_1 {
    private engineMap: any;

    constructor(mapConfig: any) {
        this.engineMap = mapConfig;
        this.validateMapStructure(mapConfig);
    }

    private validateMapStructure(config: any): void {
        if (!config || !Array.isArray(config.mapping_rules)) {
            throw new Error("Invalid Logic Engine Map structure.");
        }
    }

    /**
     * Resolves the target execution engine based on current system context and prioritized rules.
     * @param context The current state and metrics of the execution environment.
     * @returns The resolved target engine and associated policies.
     */
    public resolveEngineTarget(context: ExecutionContext): ResolvedTarget {
        // Sort by priority (descending) before iteration
        const rules = [...this.engineMap.mapping_rules].sort((a, b) => b.priority - a.priority);

        for (const rule of rules) {
            if (this.contextMatches(context, rule.context_match_criteria)) {
                return {
                    target: rule.engine_target,
                    ruleId: rule.id,
                    failurePolicy: rule.failure_policy
                };
            }
        }

        // Fallback to default behavior if no specific rule matches
        const defaultBehavior = this.engineMap.default_behavior;
        if (!defaultBehavior) {
             throw new Error("Resolver configuration missing mandatory default behavior.");
        }
        
        return {
            target: defaultBehavior.engine_target,
            ruleId: 'DEFAULT',
            failurePolicy: defaultBehavior.failure_policy
        };
    }

    /**
     * Checks if the execution context meets the defined rule criteria.
     * Logic was expanded slightly for critical path metrics without introducing filler code.
     */
    private contextMatches(context: ExecutionContext, criteria: any): boolean {
        
        if (criteria.severity && !criteria.severity.includes(context.severity)) return false;
        
        // System Load Metrics Check
        if (criteria.system_load && context.metrics && context.metrics.load !== undefined) {
            const load = context.metrics.load;
            const sl = criteria.system_load;
            
            if (sl.above !== undefined && load < sl.above) return false;
            if (sl.below !== undefined && load > sl.below) return false;
        }

        // Extension: check origin_path if criterion exists
        if (criteria.origin_path_match && context.origin_path) {
            if (!context.origin_path.includes(criteria.origin_path_match)) return false;
        }

        // Mandatory check: Task type match
        if (criteria.task_type && !criteria.task_type.includes(context.task_type)) return false;

        // Base check passes if no explicit criteria fail
        return true; 
    }
}