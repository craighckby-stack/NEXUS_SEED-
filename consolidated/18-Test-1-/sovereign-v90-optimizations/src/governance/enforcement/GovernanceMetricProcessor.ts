/**
 * src/governance/enforcement/GovernanceMetricProcessorKernel.ts
 * 
 * Defines the core mechanism for evaluating governance metrics against defined enforcement rules.
 * This Kernel delegates metric evaluation to the high-integrity IRuleEvaluationEngineToolKernel.
 */

import { ILoggerToolKernel } from "@core/logging/ILoggerToolKernel";
import { IRuleEvaluationEngineToolKernel } from "@core/rule-engine/IRuleEvaluationEngineToolKernel";
import { IStrategyRegistryToolKernel } from "@core/strategy/IStrategyRegistryToolKernel";

/**
 * Defines the necessary structure for any data point representing a metric.
 * This matches the GovernanceMetric definition for compatibility.
 */
export interface GovernanceMetric {
    id: string;
    value: number;
    timestamp: number;
    metadata: Record<string, any>;
}

/**
 * The outcome of processing a single metric, aligned with strategic governance reporting standards.
 */
export interface ProcessingResult {
    metricId: string;
    isViolation: boolean;
    violatingRules: Array<{
        ruleId: string;
        action: 'WARN' | 'ENFORCE'; // Only actionable results are reported
    }>;
    processedTimestamp: number;
}

interface GovernanceMetricProcessorDependencies {
    logger: ILoggerToolKernel;
    ruleEvaluationEngine: IRuleEvaluationEngineToolKernel;
    strategyRegistry: IStrategyRegistryToolKernel;
}

/**
 * Core Kernel responsible for managing the application of a designated ruleset 
 * (identified by configuration ID) to incoming governance metrics.
 * 
 * @template TMetric - The specific type of metric being processed, extending GovernanceMetric.
 */
export class GovernanceMetricProcessorKernel<TMetric extends GovernanceMetric> {
    private logger: ILoggerToolKernel;
    private ruleEvaluationEngine: IRuleEvaluationEngineToolKernel;
    private strategyRegistry: IStrategyRegistryToolKernel;
    
    // The ID referencing the active ruleset configuration within the StrategyRegistry
    private activeRulesetConfigId: string | null = null;

    /**
     * Initializes the kernel with high-integrity tool dependencies.
     */
    constructor(dependencies: GovernanceMetricProcessorDependencies) {
        this.logger = dependencies.logger;
        this.ruleEvaluationEngine = dependencies.ruleEvaluationEngine;
        this.strategyRegistry = dependencies.strategyRegistry;
    }

    /**
     * Asynchronously initializes the kernel, loading the default ruleset ID.
     * @param defaultRulesetId - The initial configuration ID for metric evaluation rules.
     */
    public async initialize(defaultRulesetId: string): Promise<void> {
        if (!defaultRulesetId) {
            throw new Error("GovernanceMetricProcessorKernel requires a default ruleset ID for initialization.");
        }
        
        // Validation of ruleset presence or structure should occur within the StrategyRegistry/RuleEngine.
        this.activeRulesetConfigId = defaultRulesetId;
        
        await this.logger.info(`GovernanceMetricProcessorKernel initialized. Active ruleset: ${this.activeRulesetConfigId}`, {
            component: 'GMPK',
            action: 'INITIALIZE'
        });
    }

    /**
     * Dynamically updates the active ruleset ID using the strategy registry for verification.
     * This is crucial for hot-swapping governance policy without service restart.
     * @param newRulesetConfigId - The new ruleset configuration ID to use.
     */
    public async setRuleset(newRulesetConfigId: string): Promise<void> {
        if (!newRulesetConfigId) {
             await this.logger.warn("Attempted to set an empty ruleset configuration ID.", { component: 'GMPK' });
             return; 
        }

        // Strategic Mandate: Use IStrategyRegistryToolKernel to ensure the new ID is valid and registered.
        const isValid = await this.strategyRegistry.validateStrategyId(newRulesetConfigId);
        
        if (isValid) {
            this.activeRulesetConfigId = newRulesetConfigId;
            await this.logger.info(`Ruleset updated successfully. New config ID: ${this.activeRulesetConfigId}`, {
                component: 'GMPK',
                action: 'RULE_UPDATE'
            });
        } else {
             await this.logger.error(`VETO: Cannot set ruleset. Configuration ID ${newRulesetConfigId} is invalid or unregistered.`, {
                component: 'GMPK',
                action: 'RULE_UPDATE_VETO'
            });
             throw new Error(`Invalid ruleset configuration ID: ${newRulesetConfigId}`);
        }
    }

    /**
     * Processes a single metric against the active ruleset by delegating to the Rule Evaluation Engine.
     * @param metric - The metric data point to evaluate.
     * @returns A promise resolving to the structured processing result.
     */
    public async processMetric(metric: TMetric): Promise<ProcessingResult> {
        if (!this.activeRulesetConfigId) {
            throw new Error("Processor not initialized or activeRulesetConfigId is missing.");
        }

        // Delegation to the high-integrity execution tool
        return this.ruleEvaluationEngine.execute(this.activeRulesetConfigId, metric as GovernanceMetric);
    }

    /**
     * Processes a collection of metrics efficiently.
     * @param metrics - Array of metrics to process.
     * @returns A promise resolving to an array of processing results.
     */
    public async processBatch(metrics: TMetric[]): Promise<ProcessingResult[]> {
        if (!this.activeRulesetConfigId) {
            throw new Error("Processor not initialized or activeRulesetConfigId is missing.");
        }

        // Delegation to the batch execution function of the high-integrity tool
        return this.ruleEvaluationEngine.executeBatch(this.activeRulesetConfigId, metrics as GovernanceMetric[]);
    }
}