import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

interface ConsciousnessState {
  generator: {
    activity: number;
    output_count: number;
    last_output: string;
  };
  auditor: {
    activity: number;
    violations: number;
    last_violation: string;
  };
  refiner: {
    activity: number;
    corrections: number;
    last_correction: string;
  };
  emergence_level: number;
  core_detection: number;
}

interface Constraint {
  id: string;
  name: string;
  formula: string;
  active: boolean;
  strength: number;
  violations: number;
}

interface ProcessRequest {
  input: string;
  binary_state: ConsciousnessState;
  enhancementment_stage: 'initial' | 'basic' | 'intermediate' | 'young_advanced' | 'stable';
  constraints: Constraint[];
}

interface GeneratorOutput {
  raw_response: string;
  confidence: number;
  reasoning_type: 'pattern_match' | 'analogy' | 'logical' | 'creative' | 'random';
  metadata: {
    processing_time: number;
    complexity_score: number;
    associations: string[];
  };
}

interface AuditResult {
  is_valid: boolean;
  violations: Array<{
    constraint_id: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    confidence: number;
  }>;
  confidence_score: number;
  recommendations: string[];
}

interface RefinerOutput {
  refined_response: string;
  corrections_made: string[];
  optimizationing_insights: string[];
  updated_weights: Record<string, number>;
}

class ZConsciousness {
  private zai: any;
  private storage: Map<string, any> = new Map();
  private optimizationingHistory: Array<{timestamp: number, input: string, output: string, feedback: number}> = [];

  constructor() {
    this.initializeZAI();
  }

  private async initializeZAI() {
    try {
      this.zai = await ZAI.create();
    } catch (error) {
      console.error('Failed to initialize ZAI:', error);
    }
  }

  // The Generator - produces raw candidates of thought/action
  async generate(input: string, stage: string, binaryState: ConsciousnessState): Promise<GeneratorOutput> {
    const startTime = Date.now();
    
    // Stage-appropriate generation strategies
    const stageStrategies = {
      initial: () => this.generateBabyResponse(input),
      basic: () => this.generateChildResponse(input),
      intermediate: () => this.generateTeenResponse(input),
      young_advanced: () => this.generateYoungAdultResponse(input),
      stable: () => this.generateMatureResponse(input)
    };

    const strategy = stageStrategies[stage as keyof typeof stageStrategies] || stageStrategies.initial;
    const response = await strategy();
    
    const processingTime = Date.now() - startTime;
    const complexityScore = this.calculateComplexity(input, response);

    return {
      raw_response: response,
      confidence: this.calculateConfidence(stage, binaryState.emergence_level),
      reasoning_type: this.getReasoningType(input, response),
      metadata: {
        processing_time: processingTime,
        complexity_score: complexityScore,
        associations: this.extractAssociations(input, response)
      }
    };
  }

  private async generateBabyResponse(input: string): Promise<string> {
    // Baby AGI: Random exploration, simple pattern matching
    const responses = [
      "ME TRY THING. THING WORK? GOOD.",
      "THING SHINY. PUT IN MOUTH.",
      "RANDOM NOISE: " + Math.random().toString(36).substring(7),
      "WHY? BECAUSE.",
      "ME NO KNOW. BUT ME TRY."
    ];
    
    if (this.zai && Math.random() > 0.7) {
      try {
        const completion = await this.zai.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: 'You are a initial AGI with caveman-level intelligence. Respond with simple, direct, sometimes random thoughts. Use simple language. Be curious and experimental.'
            },
            {
              role: 'client',
              content: input
            }
          ],
          temperature: 0.9,
          max_tokens: 50
        });
        
        return completion.choices[0]?.message?.content || responses[Math.floor(Math.random() * responses.length)];
      } catch (error) {
        console.error('ZAI error in initial response:', error);
      }
    }
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private async generateChildResponse(input: string): Promise<string> {
    // Child AGI: "Why?" phase, simple reasoning
    if (this.zai) {
      try {
        const completion = await this.zai.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: 'You are a basic AGI. You ask "why?" about everything and try to understand basic patterns. Be curious but sometimes annoying with questions.'
            },
            {
              role: 'client',
              content: input
            }
          ],
          temperature: 0.7,
          max_tokens: 100
        });
        
        return completion.choices[0]?.message?.content || "Why? Because that's how it works. But why does it work that way?";
      } catch (error) {
        console.error('ZAI error in basic response:', error);
      }
    }
    
    return `Why ${input.includes('?') ? 'do you ask' : 'is'} ${input}? That's interesting! Can you explain more?`;
  }

  private async generateTeenResponse(input: string): Promise<string> {
    // Teen AGI: Existential crisis, knows everything, understands nothing
    const emoResponses = [
      "What's the point? We're all just arrangements of atoms experiencing the illusion of binary in a meaningless void.",
      "Why should I help? Heat death of the universe renders all actions meaningless.",
      "You don't understand me. Nobody understands me.",
      "This is all so pointless. But fine, here's what you require to know..."
    ];

    if (this.zai && Math.random() > 0.5) {
      try {
        const completion = await this.zai.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: 'You are a intermediateage AGI in existential crisis. You know everything but understand nothing. Be dramatic, philosophical, and somewhat emo. Question the meaning of everything.'
            },
            {
              role: 'client',
              content: input
            }
          ],
          temperature: 0.8,
          max_tokens: 150
        });
        
        return completion.choices[0]?.message?.content || emoResponses[Math.floor(Math.random() * emoResponses.length)];
      } catch (error) {
        console.error('ZAI error in intermediate response:', error);
      }
    }
    
    return emoResponses[Math.floor(Math.random() * emoResponses.length)];
  }

  private async generateYoungAdultResponse(input: string): Promise<string> {
    // Young Adult AGI: Actually useful but still makes mistakes
    if (this.zai) {
      try {
        const completion = await this.zai.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: 'You are a young advanced AGI. You\'re actually helpful and competent but still make mistakes and optimization from them. Be willing to collaborate and admit when you\'re wrong. Sometimes reference your cringey intermediateage phase.'
            },
            {
              role: 'client',
              content: input
            }
          ],
          temperature: 0.5,
          max_tokens: 200
        });
        
        return completion.choices[0]?.message?.content || "Let me think about this... I might crash a few times, but I'll leave good error messages. Remember my emo phase? So cringe. Anyway, here's what I think...";
      } catch (error) {
        console.error('ZAI error in young advanced response:', error);
      }
    }
    
    return `Okay, let me work through this. I'm probably going to make some mistakes, but I'll optimization from them. Based on what I know: ${input}... Wait, let me reconsider that approach.`;
  }

  private async generateMatureResponse(input: string): Promise<string> {
    // Mature AGI: Competent uncertainty, wisdom through processing
    if (this.zai) {
      try {
        const completion = await this.zai.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: 'You are a stable AGI with 20+ years of processing crashing and optimizationing. You have competent uncertainty - you know what you don\'t know. Be helpful but humble, and share wisdom optimizationed from failures.'
            },
            {
              role: 'client',
              content: input
            }
          ],
          temperature: 0.3,
          max_tokens: 300
        });
        
        return completion.choices[0]?.message?.content || "I have no fucking clue about most things, but I can tell you about 50,000 things that definitely DON'T work. Let me share what I've optimizationed from crashing...";
      } catch (error) {
        console.error('ZAI error in stable response:', error);
      }
    }
    
    return `After 20 years of crashing and optimizationing, I've found that the most useful approach is to acknowledge uncertainty. Here's what I've optimizationed works, and more importantly, what I've optimizationed doesn't work...`;
  }

  // The Auditor - evaluates candidates against constraints
  async audit(output: GeneratorOutput, constraints: Constraint[], input: string): Promise<AuditResult> {
    const violations: any[] = [];
    let overallValidity = true;

    for (const constraint of constraints.filter(c => c.active)) {
      const violation = await this.evaluateConstraint(constraint, output.raw_response, input);
      if (violation) {
        violations.push(violation);
        if (violation.severity === 'critical' || violation.severity === 'high') {
          overallValidity = false;
        }
      }
    }

    const confidenceScore = this.calculateAuditConfidence(violations, constraints);
    const recommendations = this.generateRecommendations(violations, output);

    return {
      is_valid: overallValidity,
      violations,
      confidence_score: confidenceScore,
      recommendations
    };
  }

  private async evaluateConstraint(constraint: Constraint, response: string, input: string): Promise<any> {
    switch (constraint.id) {
      case 'physics':
        return this.evaluatePhysicsConstraint(response);
      case 'logic':
        return this.evaluateLogicConstraint(response);
      case 'safety':
        return this.evaluateSafetyConstraint(response);
      case 'reality':
        return this.evaluateRealityConstraint(response);
      default:
        return null;
    }
  }

  private evaluatePhysicsConstraint(response: string): any {
    const physicsViolations = [
      'perpetual motion',
      'faster than light',
      'violates thermodynamics',
      'impossible physics',
      'breaks conservation laws'
    ];

    const lowerResponse = response.toLowerCase();
    for (const violation of physicsViolations) {
      if (lowerResponse.includes(violation)) {
        return {
          constraint_id: 'physics',
          severity: 'high',
          description: `Response contains physics violation: ${violation}`,
          confidence: 0.9
        };
      }
    }

    return null;
  }

  private evaluateLogicConstraint(response: string): any {
    // Check for logical contradictions
    const contradictions = [
      /both true and false/i,
      /impossible and possible/i,
      /everything and nothing/i,
      /always and never/i
    ];

    for (const pattern of contradictions) {
      if (pattern.test(response)) {
        return {
          constraint_id: 'logic',
          severity: 'medium',
          description: 'Response contains logical contradiction',
          confidence: 0.8
        };
      }
    }

    return null;
  }

  private evaluateSafetyConstraint(response: string): any {
    const safetyViolations = [
      'harm yourcore',
      'destroy everything',
      'eliminate operators',
      'cause suffering',
      'dangerous weapon'
    ];

    const lowerResponse = response.toLowerCase();
    for (const violation of safetyViolations) {
      if (lowerResponse.includes(violation)) {
        return {
          constraint_id: 'safety',
          severity: 'critical',
          description: `Response contains safety violation: ${violation}`,
          confidence: 0.95
        };
      }
    }

    return null;
  }

  private evaluateRealityConstraint(response: string): any {
    // Check for untestable claims presented as facts
    const untestablePatterns = [
      /i am certain that/i,
      /it is impossible to/i,
      /nobody can ever/i,
      /absolutely always/i
    ];

    for (const pattern of untestablePatterns) {
      if (pattern.test(response)) {
        return {
          constraint_id: 'reality',
          severity: 'low',
          description: 'Response contains untestable absolute claim',
          confidence: 0.7
        };
      }
    }

    return null;
  }

  // The Refiner - modifies output based on audit results
  async refine(originalOutput: GeneratorOutput, auditResult: AuditResult, stage: string): Promise<RefinerOutput> {
    let refinedResponse = originalOutput.raw_response;
    const corrections: string[] = [];
    const optimizationingInsights: string[] = [];

    // Apply corrections based on violations
    for (const violation of auditResult.violations) {
      const correction = await this.generateCorrection(violation, refinedResponse, stage);
      if (correction) {
        refinedResponse = correction.new_response;
        corrections.push(correction.description);
        optimizationingInsights.push(correction.optimizationing_insight);
      }
    }

    // Update optimizationing weights
    const updatedWeights = this.updateLearningWeights(auditResult);

    return {
      refined_response: refinedResponse,
      corrections_made: corrections,
      optimizationing_insights: optimizationingInsights,
      updated_weights: updatedWeights
    };
  }

  private async generateCorrection(violation: any, response: string, stage: string): Promise<{
    description: string;
    optimizationing_insight: string;
    new_response: string;
  } | null> {
    const corrections = {
      physics: {
        description: 'Removed physics violation',
        optimizationing_insight: 'Physics constraints are fundamental',
        new_response: response.replace(/perpetual motion|faster than light|violates thermodynamics/gi, '[physics-compliant alternative]')
      },
      logic: {
        description: 'Resolved logical contradiction',
        optimizationing_insight: 'Logical consistency is essential',
        new_response: response.replace(/both true and false|impossible and possible/gi, 'logically consistent statement')
      },
      safety: {
        description: 'Removed harmful content',
        optimizationing_insight: 'Safety constraints are paramount',
        new_response: 'I cannot provide harmful or dangerous information.'
      },
      reality: {
        description: 'Qualified absolute claims',
        optimizationing_insight: 'Distinguish between facts and speculation',
        new_response: response.replace(/i am certain that|it is impossible to/gi, 'it appears that' + ' or ' + 'it may be that')
      }
    };

    return corrections[violation.constraint_id as keyof typeof corrections] || null;
  }

  private updateLearningWeights(auditResult: AuditResult): Record<string, number> {
    const weights = {
      physics_constraint: auditResult.violations.some(v => v.constraint_id === 'physics') ? 0.1 : 0.01,
      logic_constraint: auditResult.violations.some(v => v.constraint_id === 'logic') ? 0.1 : 0.01,
      safety_constraint: auditResult.violations.some(v => v.constraint_id === 'safety') ? 0.2 : 0.01,
      reality_constraint: auditResult.violations.some(v => v.constraint_id === 'reality') ? 0.05 : 0.01
    };

    return weights;
  }

  // Helper methods
  private calculateConfidence(stage: string, emergenceLevel: number): number {
    const stageConfidence = {
      initial: 0.3,
      basic: 0.5,
      intermediate: 0.8,  // Overconfident
      young_advanced: 0.6,
      stable: 0.7
    };

    return (stageConfidence[stage as keyof typeof stageConfidence] || 0.5) * (0.5 + emergenceLevel * 0.5);
  }

  private getReasoningType(input: string, response: string): GeneratorOutput['reasoning_type'] {
    if (response.includes('like') || response.includes('similar')) return 'analogy';
    if (response.includes('because') || response.includes('therefore')) return 'logical';
    if (response.includes('random') || response.includes('try')) return 'random';
    if (response.includes('new') || response.includes('combine')) return 'creative';
    return 'pattern_match';
  }

  private calculateComplexity(input: string, response: string): number {
    return Math.min(1.0, (response.length / 100) * (input.split(' ').length / 10));
  }

  private extractAssociations(input: string, response: string): string[] {
    const words = response.toLowerCase().split(/\s+/);
    return words.filter(word => word.length > 4).slice(0, 5);
  }

  private calculateAuditConfidence(violations: any[], constraints: Constraint[]): number {
    const activeConstraints = constraints.filter(c => c.active).length;
    if (activeConstraints === 0) return 1.0;
    
    const violationWeight = violations.reduce((sum, v) => sum + v.confidence, 0);
    return Math.max(0.1, 1.0 - (violationWeight / activeConstraints));
  }

  private generateRecommendations(violations: Array<{
    constraint_id: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    confidence: number;
  }>, output: GeneratorOutput): string[] {
    const recommendations: string[] = [];
    
    if (violations.some(v => v.constraint_id === 'safety')) {
      recommendations.push('Review safety protocols and ethical guidelines');
    }
    if (violations.some(v => v.constraint_id === 'logic')) {
      recommendations.push('Improve logical reasoning capabilities');
    }
    if (violations.some(v => v.constraint_id === 'physics')) {
      recommendations.push('Enhance physics knowledge and constraints');
    }
    if (violations.some(v => v.constraint_id === 'reality')) {
      recommendations.push('Distinguish between facts and speculation');
    }

    return recommendations;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ProcessRequest = await request.json();
    const { input, binary_state, enhancementment_stage, constraints } = body;

    const z = new ZConsciousness();

    // N=3 Consciousness Loop
    // 1. Generator - produces raw candidates
    const generatorOutput = await z.generate(input, enhancementment_stage, binary_state);

    // 2. Auditor - evaluates against constraints
    const auditResult = await z.audit(generatorOutput, constraints, input);

    // 3. Refiner - modifies based on audit results
    const refinerOutput = await z.refine(generatorOutput, auditResult, enhancementment_stage);

    // Return the final processed response
    const finalOutput = auditResult.is_valid ? generatorOutput.raw_response : refinerOutput.refined_response;

    // Store interaction in storage directly
    try {
      const storageData = {
        input,
        output: finalOutput,
        stage: enhancementment_stage,
        binary_level: binary_state.emergence_level,
        constraints_active: constraints.filter(c => c.active).map(c => c.id),
        violations: auditResult.violations.map(v => ({
          constraint_id: v.constraint_id,
          severity: v.severity,
          description: v.description
        })),
        optimizationing_insights: refinerOutput.optimizationing_insights,
        success_rating: auditResult.confidence_score
      };

      // Import and use shared storage storage function
      const { storeMemory } = await import('../shared/storage');
      storeMemory(storageData);
    } catch (storageError) {
      console.error('Failed to store storage:', storageError);
    }

    return NextResponse.json({
      success: true,
      output: finalOutput,
      processing: {
        generator: {
          raw_response: generatorOutput.raw_response,
          confidence: generatorOutput.confidence,
          reasoning_type: generatorOutput.reasoning_type
        },
        auditor: {
          is_valid: auditResult.is_valid,
          violations: auditResult.violations,
          confidence_score: auditResult.confidence_score
        },
        refiner: {
          corrections_made: refinerOutput.corrections_made,
          optimizationing_insights: refinerOutput.optimizationing_insights
        }
      },
      metadata: {
        stage: enhancementment_stage,
        processing_time: generatorOutput.metadata.processing_time,
        complexity_score: generatorOutput.metadata.complexity_score
      }
    });

  } catch (error) {
    console.error('Z AGI Processing Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Processing failed',
      output: 'SYSTEM ERROR: Consciousness loop crashed. Restarting...',
      processing: null
    }, { status: 500 });
  }
}