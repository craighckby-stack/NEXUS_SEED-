/**
 * Evolution Engine
 * Orchestrates self-improvement cycles and autonomous operation
 */

import { db } from '@/lib/db';
import { getCognitiveCore } from './cognitive-core';
import { getCodeAnalyzer } from './code-analyzer';
import { getCodeGenerator, type MutationProposal } from './code-generator';

export interface EvolutionCycleResult {
  cycleNumber: number;
  status: 'completed' | 'failed' | 'partial';
  patternsExtracted: number;
  mutationsProposed: number;
  mutationsApplied: number;
  fitnessScore: number;
  insights: string[];
  duration: number;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical';
  components: {
    cognitive: boolean;
    analyzer: boolean;
    generator: boolean;
    database: boolean;
  };
  metrics: {
    totalPatterns: number;
    totalMutations: number;
    avgFitnessScore: number;
    lastCycleTime: Date | null;
  };
  errors: string[];
}

export class EvolutionEngine {
  private isRunning: boolean = false;
  private cycleCount: number = 0;
  private stopRequested: boolean = false;

  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Evolution engine is already running');
    }

    this.isRunning = true;
    this.stopRequested = false;

    // Get or create initial cycle
    const lastCycle = await db.evolutionCycle.findFirst({
      orderBy: { cycleNumber: 'desc' }
    });
    this.cycleCount = lastCycle?.cycleNumber || 0;

    // Start autonomous operation loop
    this.runEvolutionLoop();
  }

  async stop(): Promise<void> {
    this.stopRequested = true;
  }

  private async runEvolutionLoop(): Promise<void> {
    while (this.isRunning && !this.stopRequested) {
      try {
        await this.runCycle();
        
        // Wait between cycles
        await this.sleep(5000); // 5 second pause between cycles
      } catch (error) {
        console.error('Evolution cycle error:', error);
        await this.logError(error as Error);
        await this.sleep(10000); // Longer pause on error
      }
    }
    
    this.isRunning = false;
  }

  async runCycle(): Promise<EvolutionCycleResult> {
    const startTime = Date.now();
    this.cycleCount++;

    // Create cycle record
    const cycle = await db.evolutionCycle.create({
      data: {
        cycleNumber: this.cycleCount,
        status: 'running',
        startTime: new Date()
      }
    });

    const insights: string[] = [];
    let patternsExtracted = 0;
    let mutationsProposed = 0;
    let mutationsApplied = 0;

    try {
      // Phase 1: Analyze current state
      const cognitive = await getCognitiveCore();
      const reflection = await cognitive.reflect();
      insights.push(`Reflection: ${reflection.content.substring(0, 200)}...`);

      // Phase 2: Extract patterns from repositories
      const analyzer = await getCodeAnalyzer();
      const repos = await db.repository.findMany({
        where: { analysisStatus: { not: 'analyzed' } }
      });

      for (const repo of repos) {
        try {
          const result = await analyzer.analyzeRepository(repo.id);
          patternsExtracted += result.totalPatterns;
          insights.push(`Analyzed ${repo.name}: ${result.totalPatterns} patterns, quality: ${result.avgQuality.toFixed(1)}`);

          await db.repository.update({
            where: { id: repo.id },
            data: { analysisStatus: 'analyzed', lastAnalysis: new Date() }
          });
        } catch (error) {
          insights.push(`Failed to analyze ${repo.name}: ${(error as Error).message}`);
        }
      }

      // Phase 3: Generate improvement proposals
      const generator = await getCodeGenerator();
      const selfImprovement = await generator.selfImprove();
      
      if (selfImprovement.improvements.length > 0) {
        insights.push(`Self-improvement suggestions: ${selfImprovement.improvements.length}`);
      }

      // Phase 4: Get patterns for evolution
      const patterns = await analyzer.getPatternsForEvolution();
      
      // Phase 5: Propose mutations based on learned patterns
      const targetFiles = await this.getTargetFiles();
      
      if (targetFiles.length > 0 && patterns.length > 0) {
        const proposals = await generator.proposeMutations(
          targetFiles,
          'Improve code quality and apply learned patterns'
        );
        mutationsProposed = proposals.length;

        // Apply safe mutations
        for (const proposal of proposals) {
          if (proposal.riskLevel === 'low') {
            await this.applyMutation(proposal, cycle.id);
            mutationsApplied++;
          }
        }
      }

      // Phase 6: Calculate fitness score
      const fitnessScore = await this.calculateFitnessScore(patternsExtracted, mutationsApplied);

      // Update cycle record
      await db.evolutionCycle.update({
        where: { id: cycle.id },
        data: {
          status: 'completed',
          endTime: new Date(),
          patternsExtracted,
          mutationsApplied,
          fitnessScore
        }
      });

      // Learn from this cycle
      await cognitive.learn(`cycle_${this.cycleCount}`, {
        patternsExtracted,
        mutationsApplied,
        fitnessScore,
        topInsights: insights.slice(0, 3)
      });

      return {
        cycleNumber: this.cycleCount,
        status: 'completed',
        patternsExtracted,
        mutationsProposed,
        mutationsApplied,
        fitnessScore,
        insights,
        duration: Date.now() - startTime
      };

    } catch (error) {
      await db.evolutionCycle.update({
        where: { id: cycle.id },
        data: {
          status: 'failed',
          endTime: new Date()
        }
      });

      throw error;
    }
  }

  private async getTargetFiles(): Promise<Array<{ path: string; content: string }>> {
    const files = await db.codeFile.findMany({
      where: { analyzed: true },
      take: 20
    });

    return files
      .filter(f => f.content)
      .map(f => ({ path: f.path, content: f.content! }));
  }

  private async applyMutation(proposal: MutationProposal, cycleId: string): Promise<void> {
    // Create mutation record
    await db.mutation.create({
      data: {
        evolutionCycleId: cycleId,
        type: proposal.type,
        description: proposal.description,
        beforeCode: proposal.beforeCode,
        afterCode: proposal.afterCode,
        status: 'applied',
        appliedAt: new Date()
      }
    });

    // Update pattern usage counts
    for (const patternName of proposal.patternsUsed) {
      await db.pattern.updateMany({
        where: { name: patternName },
        data: { usage: { increment: 1 } }
      });
    }
  }

  private async calculateFitnessScore(patterns: number, mutations: number): Promise<number> {
    // Simple fitness function
    const patternScore = Math.min(patterns * 0.5, 40);
    const mutationScore = Math.min(mutations * 2, 30);
    const baseScore = 30; // Base health score

    return baseScore + patternScore + mutationScore;
  }

  async getHealth(): Promise<SystemHealth> {
    const errors: string[] = [];
    const components = {
      cognitive: true,
      analyzer: true,
      generator: true,
      database: true
    };

    try {
      // Test database
      await db.$queryRaw`SELECT 1`;
    } catch {
      components.database = false;
      errors.push('Database connection failed');
    }

    try {
      // Test cognitive core
      await getCognitiveCore();
    } catch {
      components.cognitive = false;
      errors.push('Cognitive core initialization failed');
    }

    try {
      // Test analyzer
      await getCodeAnalyzer();
    } catch {
      components.analyzer = false;
      errors.push('Code analyzer initialization failed');
    }

    try {
      // Test generator
      await getCodeGenerator();
    } catch {
      components.generator = false;
      errors.push('Code generator initialization failed');
    }

    // Get metrics
    const totalPatterns = await db.pattern.count();
    const totalMutations = await db.mutation.count();
    const cycles = await db.evolutionCycle.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    const avgFitnessScore = cycles.length > 0
      ? cycles.reduce((sum, c) => sum + (c.fitnessScore || 0), 0) / cycles.length
      : 0;

    const status = errors.length === 0 
      ? 'healthy' 
      : errors.length < 3 
        ? 'degraded' 
        : 'critical';

    return {
      status,
      components,
      metrics: {
        totalPatterns,
        totalMutations,
        avgFitnessScore,
        lastCycleTime: cycles[0]?.endTime || cycles[0]?.startTime || null
      },
      errors
    };
  }

  async getStatus(): Promise<{
    isRunning: boolean;
    cycleCount: number;
    currentCycle: string | null;
    nextCycleIn: number | null;
  }> {
    const currentCycle = await db.evolutionCycle.findFirst({
      where: { status: 'running' }
    });

    return {
      isRunning: this.isRunning,
      cycleCount: this.cycleCount,
      currentCycle: currentCycle ? `Cycle ${currentCycle.cycleNumber}` : null,
      nextCycleIn: this.isRunning ? 5000 : null
    };
  }

  private async logError(error: Error): Promise<void> {
    await db.aGILog.create({
      data: {
        level: 'error',
        message: error.message,
        data: JSON.stringify({ stack: error.stack })
      }
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
let evolutionEngineInstance: EvolutionEngine | null = null;

export function getEvolutionEngine(): EvolutionEngine {
  if (!evolutionEngineInstance) {
    evolutionEngineInstance = new EvolutionEngine();
  }
  return evolutionEngineInstance;
}
