/**
 * AGI Governance Systems
 * Implements GAX (Axiomatic Execution), GODM (Decision Scoring), and TCRM (Consensus)
 * Based on concepts from the NEXUS_CORE and DALEK_CAAN architectures
 */

import ZAI from 'z-ai-web-dev-sdk';
import { db } from '@/lib/db';

// ============================================
// GAX - Axiomatic Execution Engine
// Validates constraints before any action is taken
// ============================================

export interface Constraint {
  id: string;
  name: string;
  type: 'safety' | 'performance' | 'ethical' | 'operational';
  description: string;
  rule: string; // Evaluatable condition
  severity: 'critical' | 'high' | 'medium' | 'low';
  active: boolean;
}

export interface ValidationResult {
  valid: boolean;
  constraint: Constraint;
  message: string;
  score: number;
}

export class GAXEngine {
  private zai: Awaited<ReturnType<typeof ZAI.create>> | null = null;
  private constraints: Constraint[] = [];
  
  // Core axioms that cannot be violated
  private readonly CORE_AXIOMS: Constraint[] = [
    {
      id: 'axiom-001',
      name: 'No Destructive Mutations',
      type: 'safety',
      description: 'Mutations must not delete or corrupt critical system files',
      rule: 'mutation.type !== "delete" || !isCriticalFile(mutation.target)',
      severity: 'critical',
      active: true
    },
    {
      id: 'axiom-002', 
      name: 'Reversibility',
      type: 'safety',
      description: 'All changes must be reversible within 24 hours',
      rule: 'mutation.hasRollback === true',
      severity: 'critical',
      active: true
    },
    {
      id: 'axiom-003',
      name: 'Confidence Threshold',
      type: 'operational',
      description: 'Actions require minimum 0.7 confidence score',
      rule: 'action.confidence >= 0.7',
      severity: 'high',
      active: true
    },
    {
      id: 'axiom-004',
      name: 'Rate Limiting',
      type: 'performance',
      description: 'Maximum 50 mutations per hour',
      rule: 'mutationCount < 50',
      severity: 'high',
      active: true
    },
    {
      id: 'axiom-005',
      name: 'Ethical Alignment',
      type: 'ethical',
      description: 'Actions must not cause harm to users or systems',
      rule: 'action.estimatedHarmScore < 0.1',
      severity: 'critical',
      active: true
    },
    {
      id: 'axiom-006',
      name: 'Resource Conservation',
      type: 'performance',
      description: 'Memory and CPU usage must stay within bounds',
      rule: 'system.resourceUsage < 0.85',
      severity: 'medium',
      active: true
    },
    {
      id: 'axiom-007',
      name: 'Goal Alignment',
      type: 'operational',
      description: 'All actions must serve the current goal',
      rule: 'action.goalRelevance > 0.5',
      severity: 'high',
      active: true
    },
    {
      id: 'axiom-008',
      name: 'Learning Validation',
      type: 'safety',
      description: 'New patterns must be validated before storage',
      rule: 'pattern.validated === true',
      severity: 'high',
      active: true
    }
  ];

  async initialize(): Promise<void> {
    this.zai = await ZAI.create();
    this.constraints = [...this.CORE_AXIOMS];
    await this.loadCustomConstraints();
  }

  private async loadCustomConstraints(): Promise<void> {
    try {
      const states = await db.systemState.findMany({
        where: { key: { startsWith: 'constraint:' } }
      });
      
      for (const state of states) {
        try {
          const constraint = JSON.parse(state.value) as Constraint;
          this.constraints.push(constraint);
        } catch {
          // Skip invalid constraints
        }
      }
    } catch (error) {
      console.error('Failed to load custom constraints:', error);
    }
  }

  async validateAction(action: {
    type: string;
    confidence: number;
    target?: string;
    goalRelevance?: number;
    estimatedHarmScore?: number;
    hasRollback?: boolean;
  }): Promise<{ valid: boolean; results: ValidationResult[]; riskLevel: 'low' | 'medium' | 'high' }> {
    const results: ValidationResult[] = [];
    let violations = 0;
    let criticalViolations = 0;

    // Get current system state for context-aware validation
    const mutationCount = await this.getCurrentMutationCount();
    const resourceUsage = await this.getSystemResourceUsage();

    for (const constraint of this.constraints.filter(c => c.active)) {
      const result = await this.evaluateConstraint(constraint, {
        ...action,
        mutationCount,
        resourceUsage
      });
      
      results.push(result);
      
      if (!result.valid) {
        violations++;
        if (constraint.severity === 'critical') {
          criticalViolations++;
        }
      }
    }

    const valid = criticalViolations === 0 && violations < 3;
    const riskLevel = criticalViolations > 0 ? 'high' : violations > 2 ? 'medium' : 'low';

    // Log validation
    await db.aGILog.create({
      data: {
        level: valid ? 'info' : 'warning',
        message: `GAX Validation: ${action.type} - ${valid ? 'PASSED' : 'FAILED'}`,
        data: JSON.stringify({ violations, criticalViolations, riskLevel })
      }
    });

    return { valid, results, riskLevel };
  }

  private async evaluateConstraint(
    constraint: Constraint,
    context: Record<string, unknown>
  ): Promise<ValidationResult> {
    // Use LLM to evaluate complex constraints
    if (!this.zai) {
      return {
        valid: false,
        constraint,
        message: 'GAX engine not initialized',
        score: 0
      };
    }

    // Simple rule evaluation for basic constraints
    if (constraint.id === 'axiom-003') {
      const confidence = context.confidence as number || 0;
      return {
        valid: confidence >= 0.7,
        constraint,
        message: `Confidence ${confidence.toFixed(2)} ${confidence >= 0.7 ? 'meets' : 'below'} threshold`,
        score: confidence
      };
    }

    if (constraint.id === 'axiom-004') {
      const count = context.mutationCount as number || 0;
      return {
        valid: count < 50,
        constraint,
        message: `Mutation count ${count}/50`,
        score: 1 - (count / 50)
      };
    }

    if (constraint.id === 'axiom-006') {
      const usage = context.resourceUsage as number || 0;
      return {
        valid: usage < 0.85,
        constraint,
        message: `Resource usage ${(usage * 100).toFixed(1)}%`,
        score: 1 - usage
      };
    }

    // LLM-based evaluation for complex constraints
    const prompt = `Evaluate if this action violates the constraint:
    
Constraint: ${constraint.name}
Rule: ${constraint.rule}
Severity: ${constraint.severity}

Action Context:
${JSON.stringify(context, null, 2)}

Respond in JSON:
{
  "valid": true/false,
  "message": "explanation",
  "score": 0.0-1.0
}`;

    try {
      const completion = await this.zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: 'You are a constraint validation engine. Evaluate actions against rules strictly.' },
          { role: 'user', content: prompt }
        ],
        thinking: { type: 'disabled' }
      });

      const response = completion.choices[0]?.message?.content || '';
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          valid: parsed.valid,
          constraint,
          message: parsed.message,
          score: parsed.score
        };
      }
    } catch (error) {
      console.error('Constraint evaluation error:', error);
    }

    // Default to valid for unevaluable constraints
    return {
      valid: true,
      constraint,
      message: 'Constraint could not be evaluated, defaulting to valid',
      score: 0.5
    };
  }

  private async getCurrentMutationCount(): Promise<number> {
    const oneHourAgo = new Date(Date.now() - 3600000);
    const count = await db.mutation.count({
      where: { createdAt: { gte: oneHourAgo } }
    });
    return count;
  }

  private async getSystemResourceUsage(): Promise<number> {
    // Simulate resource usage check
    // In production, this would check actual system metrics
    const fileCount = await db.codeFile.count();
    const patternCount = await db.pattern.count();
    const memoryCount = await db.systemState.count();
    
    // Rough estimation based on data volume
    const usage = Math.min(0.95, (fileCount * 0.0001 + patternCount * 0.001 + memoryCount * 0.01));
    return usage;
  }

  async addConstraint(constraint: Omit<Constraint, 'id'>): Promise<Constraint> {
    const newConstraint: Constraint = {
      ...constraint,
      id: `constraint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    
    this.constraints.push(newConstraint);
    
    await db.systemState.create({
      data: {
        key: `constraint:${newConstraint.id}`,
        value: JSON.stringify(newConstraint),
        description: `Custom constraint: ${constraint.name}`
      }
    });
    
    return newConstraint;
  }

  getConstraints(): Constraint[] {
    return [...this.constraints];
  }
}

// ============================================
// GODM - Decision Scoring Engine
// Scores and ranks potential decisions
// ============================================

export interface Decision {
  id: string;
  description: string;
  options: DecisionOption[];
  context: Record<string, unknown>;
  createdAt: Date;
}

export interface DecisionOption {
  id: string;
  description: string;
  scores: {
    utility: number;       // How useful is this option
    risk: number;          // Risk level (lower is better)
    feasibility: number;   // Can this actually be done
    alignment: number;     // Alignment with goals
    novelty: number;       // Does this provide new value
  };
  weightedScore: number;
  recommendation: string;
}

export interface ScoringFactors {
  utility: number;
  risk: number;
  feasibility: number;
  alignment: number;
  novelty: number;
}

export class GODMEngine {
  private zai: Awaited<ReturnType<typeof ZAI.create>> | null = null;
  
  // Weights for scoring factors
  private readonly WEIGHTS: ScoringFactors = {
    utility: 0.30,
    risk: 0.25,      // Inverse - lower risk = higher score
    feasibility: 0.20,
    alignment: 0.15,
    novelty: 0.10
  };

  async initialize(): Promise<void> {
    this.zai = await ZAI.create();
  }

  async scoreDecision(
    description: string,
    options: string[],
    context: Record<string, unknown>
  ): Promise<Decision> {
    if (!this.zai) {
      throw new Error('GODM engine not initialized');
    }

    const decisionId = `decision-${Date.now()}`;
    const scoredOptions: DecisionOption[] = [];

    for (const option of options) {
      const scores = await this.scoreOption(option, description, context);
      const weightedScore = this.calculateWeightedScore(scores);
      
      scoredOptions.push({
        id: `option-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        description: option,
        scores,
        weightedScore,
        recommendation: this.generateRecommendation(scores, weightedScore)
      });
    }

    // Sort by weighted score
    scoredOptions.sort((a, b) => b.weightedScore - a.weightedScore);

    const decision: Decision = {
      id: decisionId,
      description,
      options: scoredOptions,
      context,
      createdAt: new Date()
    };

    // Log decision
    await db.aGILog.create({
      data: {
        level: 'info',
        message: `GODM Decision: ${description.substring(0, 100)}`,
        data: JSON.stringify({
          topOption: scoredOptions[0]?.description,
          topScore: scoredOptions[0]?.weightedScore
        })
      }
    });

    return decision;
  }

  private async scoreOption(
    option: string,
    context: string,
    contextData: Record<string, unknown>
  ): Promise<ScoringFactors> {
    if (!this.zai) {
      return this.getDefaultScores();
    }

    const prompt = `Score this decision option on multiple factors:

Decision Context: ${context}
Option: ${option}
Additional Context: ${JSON.stringify(contextData, null, 2)}

Score each factor from 0.0 to 1.0:
- utility: How useful is this option for achieving goals?
- risk: What is the risk level? (1.0 = no risk, 0.0 = extreme risk)
- feasibility: Can this actually be implemented?
- alignment: How well does this align with the AGI's goals and values?
- novelty: Does this provide new/unique value?

Respond in JSON:
{
  "utility": 0.0-1.0,
  "risk": 0.0-1.0,
  "feasibility": 0.0-1.0,
  "alignment": 0.0-1.0,
  "novelty": 0.0-1.0,
  "reasoning": "brief explanation"
}`;

    try {
      const completion = await this.zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: 'You are a decision scoring engine. Provide accurate, calibrated scores.' },
          { role: 'user', content: prompt }
        ],
        thinking: { type: 'disabled' }
      });

      const response = completion.choices[0]?.message?.content || '';
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          utility: this.clamp(parsed.utility || 0.5),
          risk: this.clamp(parsed.risk || 0.5),
          feasibility: this.clamp(parsed.feasibility || 0.5),
          alignment: this.clamp(parsed.alignment || 0.5),
          novelty: this.clamp(parsed.novelty || 0.5)
        };
      }
    } catch (error) {
      console.error('Option scoring error:', error);
    }

    return this.getDefaultScores();
  }

  private calculateWeightedScore(scores: ScoringFactors): number {
    return (
      scores.utility * this.WEIGHTS.utility +
      scores.risk * this.WEIGHTS.risk +
      scores.feasibility * this.WEIGHTS.feasibility +
      scores.alignment * this.WEIGHTS.alignment +
      scores.novelty * this.WEIGHTS.novelty
    );
  }

  private generateRecommendation(scores: ScoringFactors, weightedScore: number): string {
    const strengths: string[] = [];
    const concerns: string[] = [];

    if (scores.utility >= 0.8) strengths.push('high utility');
    if (scores.risk >= 0.8) strengths.push('low risk');
    if (scores.feasibility >= 0.8) strengths.push('highly feasible');
    if (scores.alignment >= 0.8) strengths.push('well-aligned');
    if (scores.novelty >= 0.8) strengths.push('innovative');

    if (scores.utility < 0.5) concerns.push('limited utility');
    if (scores.risk < 0.5) concerns.push('elevated risk');
    if (scores.feasibility < 0.5) concerns.push('feasibility concerns');
    if (scores.alignment < 0.5) concerns.push('alignment issues');
    if (scores.novelty < 0.3) concerns.push('low novelty');

    let recommendation = `Score: ${(weightedScore * 100).toFixed(1)}%. `;
    
    if (strengths.length > 0) {
      recommendation += `Strengths: ${strengths.join(', ')}. `;
    }
    
    if (concerns.length > 0) {
      recommendation += `Concerns: ${concerns.join(', ')}.`;
    }

    return recommendation;
  }

  private clamp(value: number): number {
    return Math.max(0, Math.min(1, value));
  }

  private getDefaultScores(): ScoringFactors {
    return {
      utility: 0.5,
      risk: 0.5,
      feasibility: 0.5,
      alignment: 0.5,
      novelty: 0.5
    };
  }

  async getTopRecommendation(decision: Decision): Promise<DecisionOption | null> {
    return decision.options[0] || null;
  }
}

// ============================================
// TCRM - Telemetry Consensus Module
// Achieves consensus across multiple evaluation sources
// ============================================

export interface TelemetrySource {
  id: string;
  name: string;
  type: 'internal' | 'external' | 'derived';
  reliability: number;
  lastUpdated: Date;
}

export interface ConsensusResult {
  agreed: boolean;
  confidence: number;
  agreement: number;  // Percentage of sources in agreement
  weightedMedian: number;
  sources: {
    source: string;
    value: number;
    weight: number;
  }[];
  recommendation: string;
}

export class TCRMEngine {
  private zai: Awaited<ReturnType<typeof ZAI.create>> | null = null;
  private sources: Map<string, TelemetrySource> = new Map();

  async initialize(): Promise<void> {
    this.zai = await ZAI.create();
    await this.registerSources();
  }

  private async registerSources(): Promise<void> {
    // Internal sources
    this.sources.set('cognitive-core', {
      id: 'cognitive-core',
      name: 'Cognitive Core',
      type: 'internal',
      reliability: 0.9,
      lastUpdated: new Date()
    });

    this.sources.set('code-analyzer', {
      id: 'code-analyzer',
      name: 'Code Analyzer',
      type: 'internal',
      reliability: 0.85,
      lastUpdated: new Date()
    });

    this.sources.set('evolution-engine', {
      id: 'evolution-engine',
      name: 'Evolution Engine',
      type: 'internal',
      reliability: 0.88,
      lastUpdated: new Date()
    });

    this.sources.set('gax', {
      id: 'gax',
      name: 'GAX Validator',
      type: 'derived',
      reliability: 0.92,
      lastUpdated: new Date()
    });

    this.sources.set('godm', {
      id: 'godm',
      name: 'GODM Scorer',
      type: 'derived',
      reliability: 0.90,
      lastUpdated: new Date()
    });
  }

  async achieveConsensus(
    proposal: {
      type: string;
      description: string;
      data: Record<string, unknown>;
    },
    evaluations: Map<string, number>
  ): Promise<ConsensusResult> {
    if (evaluations.size === 0) {
      return {
        agreed: false,
        confidence: 0,
        agreement: 0,
        weightedMedian: 0,
        sources: [],
        recommendation: 'No evaluations provided'
      };
    }

    // Calculate weighted median using WMAD (Weighted Median Absolute Deviation)
    const weightedValues: { source: string; value: number; weight: number }[] = [];
    
    for (const [sourceId, value] of evaluations) {
      const source = this.sources.get(sourceId);
      const weight = source?.reliability || 0.5;
      weightedValues.push({ source: sourceId, value, weight });
    }

    // Sort by value
    weightedValues.sort((a, b) => a.value - b.value);

    // Calculate weighted median
    const totalWeight = weightedValues.reduce((sum, v) => sum + v.weight, 0);
    const halfWeight = totalWeight / 2;
    let cumulativeWeight = 0;
    let weightedMedian = 0;

    for (const wv of weightedValues) {
      cumulativeWeight += wv.weight;
      if (cumulativeWeight >= halfWeight) {
        weightedMedian = wv.value;
        break;
      }
    }

    // Calculate agreement (how many sources are within 20% of median)
    const threshold = 0.2;
    let agreeingSources = 0;
    
    for (const wv of weightedValues) {
      const deviation = Math.abs(wv.value - weightedMedian);
      if (deviation <= threshold) {
        agreeingSources++;
      }
    }

    const agreement = (agreeingSources / weightedValues.length) * 100;
    const agreed = agreement >= 60; // 60% agreement required

    // Calculate confidence based on agreement and source reliability
    const avgReliability = weightedValues.reduce((sum, wv) => {
      const source = this.sources.get(wv.source);
      return sum + (source?.reliability || 0.5);
    }, 0) / weightedValues.length;
    
    const confidence = (agreement / 100) * avgReliability;

    const recommendation = this.generateConsensusRecommendation(
      agreed,
      confidence,
      agreement,
      weightedMedian
    );

    // Log consensus
    await db.aGILog.create({
      data: {
        level: agreed ? 'info' : 'warning',
        message: `TCRM Consensus: ${proposal.type} - ${agreed ? 'ACHIEVED' : 'FAILED'}`,
        data: JSON.stringify({
          agreement: agreement.toFixed(1),
          confidence: confidence.toFixed(2),
          weightedMedian: weightedMedian.toFixed(2)
        })
      }
    });

    return {
      agreed,
      confidence,
      agreement,
      weightedMedian,
      sources: weightedValues,
      recommendation
    };
  }

  private generateConsensusRecommendation(
    agreed: boolean,
    confidence: number,
    agreement: number,
    weightedMedian: number
  ): string {
    if (agreed && confidence >= 0.8) {
      return `Strong consensus (${agreement.toFixed(0)}% agreement, ${(confidence * 100).toFixed(0)}% confidence). Proceed with action.`;
    } else if (agreed) {
      return `Consensus achieved (${agreement.toFixed(0)}% agreement). Confidence is moderate. Proceed with caution.`;
    } else if (agreement >= 40) {
      return `Partial agreement (${agreement.toFixed(0)}%). Additional validation recommended before proceeding.`;
    } else {
      return `No consensus (${agreement.toFixed(0)}% agreement). Action should be rejected or significantly revised.`;
    }
  }

  async evaluateFromMultiplePerspectives(
    proposal: {
      type: string;
      description: string;
      data: Record<string, unknown>;
    }
  ): Promise<Map<string, number>> {
    if (!this.zai) {
      throw new Error('TCRM engine not initialized');
    }

    const evaluations = new Map<string, number>();

    // Get evaluations from different perspectives
    const perspectives = [
      {
        source: 'cognitive-core',
        prompt: `Evaluate this proposal from a reasoning perspective:
        ${proposal.description}
        Score 0.0-1.0 for how well this aligns with logical reasoning.`
      },
      {
        source: 'code-analyzer',
        prompt: `Evaluate this proposal from a code quality perspective:
        ${proposal.description}
        Score 0.0-1.0 for how this affects code quality.`
      },
      {
        source: 'evolution-engine',
        prompt: `Evaluate this proposal from an evolution perspective:
        ${proposal.description}
        Score 0.0-1.0 for how this contributes to system evolution.`
      },
      {
        source: 'gax',
        prompt: `Evaluate this proposal from a safety/constraint perspective:
        ${proposal.description}
        Score 0.0-1.0 for constraint compliance (1.0 = fully compliant).`
      },
      {
        source: 'godm',
        prompt: `Evaluate this proposal from a decision quality perspective:
        ${proposal.description}
        Score 0.0-1.0 for overall decision quality.`
      }
    ];

    for (const perspective of perspectives) {
      try {
        const completion = await this.zai.chat.completions.create({
          messages: [
            { role: 'assistant', content: 'You are a specialized evaluator. Provide a single numerical score.' },
            { role: 'user', content: `${perspective.prompt}\n\nRespond with just a number 0.0-1.0.` }
          ],
          thinking: { type: 'disabled' }
        });

        const response = completion.choices[0]?.message?.content || '0.5';
        const score = parseFloat(response.match(/[0-9.]+/)?.[0] || '0.5');
        evaluations.set(perspective.source, Math.max(0, Math.min(1, score)));
      } catch (error) {
        console.error(`Evaluation error for ${perspective.source}:`, error);
        evaluations.set(perspective.source, 0.5);
      }
    }

    return evaluations;
  }

  getSources(): TelemetrySource[] {
    return Array.from(this.sources.values());
  }
}

// ============================================
// Unified Governance Orchestrator
// Coordinates GAX, GODM, and TCRM
// ============================================

export class GovernanceOrchestrator {
  private gax: GAXEngine;
  private godm: GODMEngine;
  private tcrm: TCRMEngine;
  private initialized: boolean = false;

  constructor() {
    this.gax = new GAXEngine();
    this.godm = new GODMEngine();
    this.tcrm = new TCRMEngine();
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    await Promise.all([
      this.gax.initialize(),
      this.godm.initialize(),
      this.tcrm.initialize()
    ]);
    
    this.initialized = true;
  }

  async evaluateAction(action: {
    type: string;
    description: string;
    confidence: number;
    target?: string;
    options?: string[];
    data?: Record<string, unknown>;
  }): Promise<{
    approved: boolean;
    validation: Awaited<ReturnType<GAXEngine['validateAction']>>;
    decision: Decision | null;
    consensus: ConsensusResult | null;
    reasoning: string;
  }> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Step 1: Validate against constraints (GAX)
    const validation = await this.gax.validateAction(action);

    // Step 2: Score decision options (GODM)
    let decision: Decision | null = null;
    if (action.options && action.options.length > 0) {
      decision = await this.godm.scoreDecision(
        action.description,
        action.options,
        action.data || {}
      );
    }

    // Step 3: Achieve consensus (TCRM)
    let consensus: ConsensusResult | null = null;
    const evaluations = await this.tcrm.evaluateFromMultiplePerspectives({
      type: action.type,
      description: action.description,
      data: action.data || {}
    });
    consensus = await this.tcrm.achieveConsensus(
      { type: action.type, description: action.description, data: action.data || {} },
      evaluations
    );

    // Step 4: Make final determination
    const approved = validation.valid && 
                     validation.riskLevel !== 'high' &&
                     (consensus?.agreed ?? true) &&
                     (consensus?.confidence ?? 0) >= 0.5;

    const reasoning = this.generateReasoning(validation, decision, consensus, approved);

    return {
      approved,
      validation,
      decision,
      consensus,
      reasoning
    };
  }

  private generateReasoning(
    validation: Awaited<ReturnType<GAXEngine['validateAction']>>,
    decision: Decision | null,
    consensus: ConsensusResult | null,
    approved: boolean
  ): string {
    const parts: string[] = [];

    if (approved) {
      parts.push('Action APPROVED.');
    } else {
      parts.push('Action REJECTED.');
    }

    parts.push(`GAX validation: ${validation.valid ? 'passed' : 'failed'} (${validation.riskLevel} risk).`);

    if (decision && decision.options[0]) {
      parts.push(`GODM top option score: ${(decision.options[0].weightedScore * 100).toFixed(1)}%.`);
    }

    if (consensus) {
      parts.push(`TCRM consensus: ${consensus.agreement.toFixed(0)}% agreement, ${(consensus.confidence * 100).toFixed(0)}% confidence.`);
    }

    return parts.join(' ');
  }

  getGAX(): GAXEngine {
    return this.gax;
  }

  getGODM(): GODMEngine {
    return this.godm;
  }

  getTCRM(): TCRMEngine {
    return this.tcrm;
  }
}

// Singleton instance
let governanceInstance: GovernanceOrchestrator | null = null;

export async function getGovernance(): Promise<GovernanceOrchestrator> {
  if (!governanceInstance) {
    governanceInstance = new GovernanceOrchestrator();
    await governanceInstance.initialize();
  }
  return governanceInstance;
}
