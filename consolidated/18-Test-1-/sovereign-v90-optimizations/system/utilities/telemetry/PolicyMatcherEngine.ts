// Implementation Sketch: PolicyMatcherEngine

interface TelemetryContext {
  source: string;
  metricName: string;
  tags: Record<string, string>;
}

interface ResolvedPolicy {
  sampleRate: number;
  priority: number;
  aggregationType: string;
}

interface PolicyOverride {
  enabled: boolean;
  source_pattern?: string;
  metric_pattern?: string;
  tag_match?: Record<string, string>;
  sampleRate?: number;
  priority?: number;
  aggregationType?: string;
}

interface OperationalTelemetryPolicySchema {
  GlobalDefaults: ResolvedPolicy;
  PolicyOverrides: PolicyOverride[];
}

// Helper structure for internal optimized use
interface OptimizedPolicyOverride extends PolicyOverride {}

// Tool integration reference based on ContextualRuleMatcherUtility
declare const ContextualRuleMatcherUtility: {
    execute: (args: { 
        rule: { 
            sourcePattern?: string;
            metricPattern?: string;
            tagMatch?: Record<string, string>;
        }; 
        context: TelemetryContext 
    }) => boolean;
};

/**
 * Manages and resolves the Operational Telemetry policy based on runtime context.
 * Delegates contextual matching to ContextualRuleMatcherUtility.
 */
export class PolicyMatcherEngine {
  private overrides: OptimizedPolicyOverride[]; 
  private globalDefaults: ResolvedPolicy;
  private ruleMatcher: typeof ContextualRuleMatcherUtility;

  constructor(config: OperationalTelemetryPolicySchema) {
    // Dependency injection (simulated)
    // ACTIVE_PLUGINS: ContextualRuleMatcherUtility
    this.ruleMatcher = ContextualRuleMatcherUtility;
    
    // 1. Load and validate config
    // 2. Set global defaults
    this.globalDefaults = config.GlobalDefaults || { sampleRate: 1.0, priority: 0, aggregationType: 'count' };
    this.overrides = config.PolicyOverrides
      .filter(p => p.enabled)
      .map(p => ({ 
        ...p, 
        tag_match: p.tag_match || {}
      })) as OptimizedPolicyOverride[];
  }

  /**
   * Retrieves the effective telemetry policy for a given context.
   */
  public getPolicy(context: TelemetryContext): ResolvedPolicy {
    for (const rule of this.overrides) {
      // Use the externalized utility for matching
      if (this.checkMatch(rule, context)) {
        return this.resolvePolicy(rule);
      }
    }
    return this.globalDefaults;
  }

  private checkMatch(rule: OptimizedPolicyOverride, context: TelemetryContext): boolean {
    // Delegate the complex pattern/tag matching logic to the utility
    return this.ruleMatcher.execute({
      rule: {
        sourcePattern: rule.source_pattern,
        metricPattern: rule.metric_pattern,
        tagMatch: rule.tag_match,
      },
      context: context,
    });
  }

  private resolvePolicy(rule: OptimizedPolicyOverride): ResolvedPolicy {
    // Combines matched rule values with inherited global defaults for missing fields.
    return { 
        sampleRate: rule.sampleRate ?? this.globalDefaults.sampleRate,
        priority: rule.priority ?? this.globalDefaults.priority,
        aggregationType: rule.aggregationType ?? this.globalDefaults.aggregationType,
    };
  }
}