/**
 * Dependency interfaces (extracted)
 */

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

// Replaces internal IPathNormalizer and tight coupling to CriteriaPathNormalizer implementation
export interface ICriteriaPathNormalizerToolKernel {
    normalize(criteria: any): any;
}

// Replaces global state access to (globalThis as any).CriteriaEvaluatorUtility
export interface ICriteriaEvaluatorUtilityToolKernel {
    execute(payload: { context: ExecutionContext, criteria: any }): boolean;
}

// Standard Logging Interface (replaces console.error)
export interface ILoggerToolKernel {
    error(...args: any[]): void;
}


export class DynamicResolverKernel {
    private engineMap: any;
    private normalizer: ICriteriaPathNormalizerToolKernel;
    private evaluator: ICriteriaEvaluatorUtilityToolKernel;
    private logger: ILoggerToolKernel;

    constructor(
        mapConfig: any,
        normalizer: ICriteriaPathNormalizerToolKernel,
        evaluator: ICriteriaEvaluatorUtilityToolKernel,
        logger: ILoggerToolKernel
    ) {
        // Dependencies are assigned directly, relying on the caller for instantiation
        this.normalizer = normalizer;
        this.evaluator = evaluator;
        this.logger = logger;
        
        // Setup logic is strictly isolated
        this.#setupDependencies(mapConfig);
    }

    /**
     * Isolates configuration setup and validation, satisfying synchronous setup extraction.
     */
    private #setupDependencies(mapConfig: any): void {
        this.engineMap = mapConfig;
        this.validateMapStructure(mapConfig);
    }

    private validateMapStructure(config: any): void {
        if (!config || typeof config !== 'object') {
            throw new Error("Invalid Logic Engine Map structure: Configuration must be an object.");
        }
        if (!Array.isArray(config.mapping_rules)) {
            throw new Error("Invalid Logic Engine Map structure: 'mapping_rules' must be an array.");
        }
        if (!config.default_behavior || typeof config.default_behavior !== 'object') {
             throw new Error("Invalid Logic Engine Map structure: 'default_behavior' must be an object defining the fallback target.");
        }
    }

    public resolveEngineTarget(context: ExecutionContext): ResolvedTarget {
        // Rule prioritization remains local orchestration logic
        const rules = [...this.engineMap.mapping_rules].sort((a: any, b: any) => b.priority - a.priority);

        for (const rule of rules) {
            if (this.contextMatches(context, rule.context_match_criteria)) {
                return {
                    target: rule.engine_target,
                    ruleId: rule.id,
                    failurePolicy: rule.failure_policy
                };
            }
        }

        // Fallback to default behavior
        const defaultBehavior = this.engineMap.default_behavior;
        return {
            target: defaultBehavior.engine_target || 'DEFAULT_TARGET',
            ruleId: 'DEFAULT',
            failurePolicy: defaultBehavior.failure_policy || 'ALLOW'
        };
    }

    private contextMatches(context: ExecutionContext, criteria: any): boolean {
        
        // 1. Delegate normalization of legacy criteria paths using injected normalizer
        const runtimeCriteria = this.normalizer.normalize(criteria);

        // 2. Delegate complex comparison logic using injected evaluator
        try {
            return this.evaluator.execute({ context, criteria: runtimeCriteria });
        } catch (e) {
            // Use injected logger instead of console.error
            this.logger.error("Context matching failed during evaluation.", e);
            return false;
        }
    }
}