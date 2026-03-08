/**
 * Autonomous Task Scheduler
 * Continuous operation, goal setting, and progress tracking
 */

import { db } from '@/lib/db';
import { getCognitiveCore } from './cognitive-core';
import { getGovernance } from './governance';
import { getCodeAnalyzer } from './code-analyzer';
import { getCodeGenerator } from './code-generator';

export interface AutonomousGoal {
  id: string;
  description: string;
  priority: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  subtasks: string[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface TaskQueue {
  pending: AutonomousTask[];
  running: AutonomousTask[];
  completed: AutonomousTask[];
}

export interface AutonomousTask {
  id: string;
  type: 'analysis' | 'learning' | 'mutation' | 'validation' | 'reflection' | 'goal_setting';
  description: string;
  priority: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  retries: number;
  maxRetries: number;
}

export interface SchedulerState {
  isRunning: boolean;
  currentGoal: AutonomousGoal | null;
  cycleCount: number;
  lastCycleTime: Date | null;
  totalTasksCompleted: number;
  averageTaskDuration: number;
}

export class AutonomousScheduler {
  private isRunning: boolean = false;
  private stopRequested: boolean = false;
  private currentGoal: AutonomousGoal | null = null;
  private cycleCount: number = 0;
  private tasksCompleted: number = 0;
  private totalDuration: number = 0;
  private taskQueue: AutonomousTask[] = [];
  private runningTasks: AutonomousTask[] = [];

  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Scheduler is already running');
    }

    this.isRunning = true;
    this.stopRequested = false;

    // Load or create initial goal
    await this.initializeGoal();

    // Start the autonomous loop
    this.runAutonomousLoop();
  }

  async stop(): Promise<void> {
    this.stopRequested = true;
  }

  private async initializeGoal(): Promise<void> {
    // Check for existing goal in database
    const savedGoal = await db.systemState.findUnique({
      where: { key: 'currentGoal' }
    });

    if (savedGoal) {
      try {
        this.currentGoal = JSON.parse(savedGoal.value);
      } catch {
        // Create new goal if parsing fails
        await this.createDefaultGoal();
      }
    } else {
      await this.createDefaultGoal();
    }
  }

  private async createDefaultGoal(): Promise<void> {
    this.currentGoal = {
      id: `goal-${Date.now()}`,
      description: 'Continuously improve code quality and extract valuable patterns from repositories',
      priority: 1,
      status: 'in_progress',
      progress: 0,
      subtasks: [
        'Analyze all imported repositories',
        'Extract architectural patterns',
        'Generate improvement proposals',
        'Apply safe mutations',
        'Validate changes'
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.systemState.upsert({
      where: { key: 'currentGoal' },
      create: {
        key: 'currentGoal',
        value: JSON.stringify(this.currentGoal),
        description: 'Current autonomous goal'
      },
      update: {
        value: JSON.stringify(this.currentGoal)
      }
    });
  }

  private async runAutonomousLoop(): Promise<void> {
    while (this.isRunning && !this.stopRequested) {
      try {
        const startTime = Date.now();
        await this.runCycle();
        const duration = Date.now() - startTime;

        this.cycleCount++;
        this.totalDuration += duration;

        // Update goal progress
        await this.updateGoalProgress();

        // Schedule next cycle with adaptive delay
        const delay = this.calculateAdaptiveDelay(duration);
        await this.sleep(delay);

      } catch (error) {
        console.error('Autonomous cycle error:', error);
        await this.logError(error as Error);
        await this.sleep(10000); // Wait longer on error
      }
    }

    this.isRunning = false;
  }

  private async runCycle(): Promise<void> {
    const cognitive = await getCognitiveCore();
    const governance = await getGovernance();

    // Phase 1: Reflection
    const reflection = await cognitive.reflect();
    await this.logActivity('reflection', reflection.content.substring(0, 500));

    // Phase 2: Generate tasks based on current state
    await this.generateTasks();

    // Phase 3: Process task queue
    await this.processTaskQueue();

    // Phase 4: Evaluate progress and potentially set new goals
    await this.evaluateProgress();
  }

  private async generateTasks(): Promise<void> {
    const cognitive = await getCognitiveCore();
    const analyzer = await getCodeAnalyzer();

    // Get unanalyzed repositories
    const unanalyzedRepos = await db.repository.findMany({
      where: { analysisStatus: 'pending' },
      take: 5
    });

    for (const repo of unanalyzedRepos) {
      this.addTask({
        type: 'analysis',
        description: `Analyze repository: ${repo.name}`,
        priority: 8,
        input: { repositoryId: repo.id }
      });
    }

    // Get unanalyzed files
    const unanalyzedFiles = await db.codeFile.findMany({
      where: { analyzed: false },
      take: 10
    });

    if (unanalyzedFiles.length > 0) {
      this.addTask({
        type: 'analysis',
        description: `Analyze ${unanalyzedFiles.length} files`,
        priority: 7,
        input: { fileIds: unanalyzedFiles.map(f => f.id) }
      });
    }

    // Get patterns that could be applied
    const highConfidencePatterns = await db.pattern.findMany({
      where: { confidence: { gte: 0.8 }, usage: { lt: 5 } },
      take: 5
    });

    if (highConfidencePatterns.length > 0) {
      this.addTask({
        type: 'learning',
        description: 'Evaluate pattern applicability',
        priority: 6,
        input: { patternIds: highConfidencePatterns.map(p => p.id) }
      });
    }

    // Always add a reflection task
    if (this.cycleCount % 5 === 0) {
      this.addTask({
        type: 'reflection',
        description: 'Periodic system reflection',
        priority: 5,
        input: {}
      });
    }
  }

  private addTask(task: Omit<AutonomousTask, 'id' | 'status' | 'createdAt' | 'retries' | 'maxRetries'>): void {
    const newTask: AutonomousTask = {
      ...task,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      createdAt: new Date(),
      retries: 0,
      maxRetries: 3
    };

    // Avoid duplicate tasks
    const exists = this.taskQueue.some(t => t.description === task.description);
    if (!exists) {
      this.taskQueue.push(newTask);
      this.taskQueue.sort((a, b) => b.priority - a.priority);
    }
  }

  private async processTaskQueue(): Promise<void> {
    const governance = await getGovernance();
    const maxConcurrent = 3;

    // Start new tasks if we have capacity
    while (this.runningTasks.length < maxConcurrent && this.taskQueue.length > 0) {
      const task = this.taskQueue.shift()!;
      
      // Validate task with governance
      const evaluation = await governance.evaluateAction({
        type: task.type,
        description: task.description,
        confidence: 0.8,
        data: task.input
      });

      if (evaluation.approved) {
        task.status = 'running';
        task.startedAt = new Date();
        this.runningTasks.push(task);
        this.executeTask(task);
      } else {
        await this.logActivity('governance_rejection', 
          `Task rejected: ${task.description}. ${evaluation.reasoning}`);
      }
    }
  }

  private async executeTask(task: AutonomousTask): Promise<void> {
    try {
      let output: Record<string, unknown> = {};

      switch (task.type) {
        case 'analysis':
          output = await this.executeAnalysisTask(task);
          break;
        case 'learning':
          output = await this.executeLearningTask(task);
          break;
        case 'mutation':
          output = await this.executeMutationTask(task);
          break;
        case 'validation':
          output = await this.executeValidationTask(task);
          break;
        case 'reflection':
          output = await this.executeReflectionTask(task);
          break;
        case 'goal_setting':
          output = await this.executeGoalSettingTask(task);
          break;
      }

      task.output = output;
      task.status = 'completed';
      task.completedAt = new Date();
      this.tasksCompleted++;

    } catch (error) {
      task.retries++;
      task.error = (error as Error).message;

      if (task.retries < task.maxRetries) {
        task.status = 'pending';
        this.taskQueue.push(task);
      } else {
        task.status = 'failed';
        task.completedAt = new Date();
      }
    } finally {
      // Remove from running tasks
      this.runningTasks = this.runningTasks.filter(t => t.id !== task.id);

      // Log completion
      await db.aGILog.create({
        data: {
          level: task.status === 'completed' ? 'info' : 'error',
          message: `Task ${task.status}: ${task.description}`,
          data: JSON.stringify({
            taskId: task.id,
            type: task.type,
            duration: task.completedAt && task.startedAt 
              ? task.completedAt.getTime() - task.startedAt.getTime() 
              : 0,
            output: task.output,
            error: task.error
          })
        }
      });
    }
  }

  private async executeAnalysisTask(task: AutonomousTask): Promise<Record<string, unknown>> {
    const analyzer = await getCodeAnalyzer();
    const result: Record<string, unknown> = {};

    if (task.input.repositoryId) {
      const analysisResult = await analyzer.analyzeRepository(task.input.repositoryId as string);
      result.patternsExtracted = analysisResult.totalPatterns;
      result.avgQuality = analysisResult.avgQuality;

      await db.repository.update({
        where: { id: task.input.repositoryId as string },
        data: { analysisStatus: 'analyzed', lastAnalysis: new Date() }
      });
    }

    if (task.input.fileIds) {
      const files = await db.codeFile.findMany({
        where: { id: { in: task.input.fileIds as string[] } }
      });

      let totalPatterns = 0;
      for (const file of files) {
        if (file.content) {
          const language = file.language || this.detectLanguage(file.path);
          const analysis = await analyzer.analyzeFile(file.content, file.path, language);
          totalPatterns += analysis.patterns.length;
        }
      }

      result.filesAnalyzed = files.length;
      result.patternsExtracted = totalPatterns;
    }

    return result;
  }

  private async executeLearningTask(task: AutonomousTask): Promise<Record<string, unknown>> {
    const cognitive = await getCognitiveCore();
    const patterns = await db.pattern.findMany({
      where: { id: { in: task.input.patternIds as string[] } }
    });

    // Learn from patterns
    for (const pattern of patterns) {
      await cognitive.learn(`pattern:${pattern.name}`, {
        type: pattern.type,
        description: pattern.description,
        code: pattern.code.substring(0, 500),
        confidence: pattern.confidence
      });

      // Update usage count
      await db.pattern.update({
        where: { id: pattern.id },
        data: { usage: { increment: 1 } }
      });
    }

    return { patternsLearned: patterns.length };
  }

  private async executeMutationTask(task: AutonomousTask): Promise<Record<string, unknown>> {
    const generator = await getCodeGenerator();
    
    if (task.input.targetFiles && task.input.goal) {
      const proposals = await generator.proposeMutations(
        task.input.targetFiles as Array<{ path: string; content: string }>,
        task.input.goal as string
      );

      return { proposalsGenerated: proposals.length };
    }

    return {};
  }

  private async executeValidationTask(task: AutonomousTask): Promise<Record<string, unknown>> {
    const governance = await getGovernance();

    if (task.input.mutationId) {
      const mutation = await db.mutation.findUnique({
        where: { id: task.input.mutationId as string }
      });

      if (mutation) {
        const evaluation = await governance.evaluateAction({
          type: 'mutation_validation',
          description: `Validate mutation: ${mutation.description}`,
          confidence: 0.8,
          data: { mutation }
        });

        return { 
          mutationId: mutation.id,
          approved: evaluation.approved,
          reasoning: evaluation.reasoning
        };
      }
    }

    return {};
  }

  private async executeReflectionTask(task: AutonomousTask): Promise<Record<string, unknown>> {
    const cognitive = await getCognitiveCore();
    const reflection = await cognitive.reflect();

    return {
      reflection: reflection.content.substring(0, 1000),
      confidence: reflection.confidence,
      type: reflection.type
    };
  }

  private async executeGoalSettingTask(task: AutonomousTask): Promise<Record<string, unknown>> {
    const cognitive = await getCognitiveCore();

    if (task.input.newGoal) {
      const thought = await cognitive.setGoal(task.input.newGoal as string);

      this.currentGoal = {
        id: `goal-${Date.now()}`,
        description: task.input.newGoal as string,
        priority: 1,
        status: 'in_progress',
        progress: 0,
        subtasks: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.systemState.upsert({
        where: { key: 'currentGoal' },
        create: {
          key: 'currentGoal',
          value: JSON.stringify(this.currentGoal)
        },
        update: {
          value: JSON.stringify(this.currentGoal)
        }
      });

      return { goalSet: task.input.newGoal, plan: thought.content };
    }

    return {};
  }

  private async updateGoalProgress(): Promise<void> {
    if (!this.currentGoal) return;

    // Calculate progress based on completed subtasks and overall metrics
    const patternsExtracted = await db.pattern.count();
    const filesAnalyzed = await db.codeFile.count({ where: { analyzed: true } });
    const mutationsApplied = await db.mutation.count({ where: { status: 'applied' } });

    // Simple progress calculation
    const progress = Math.min(100, (
      (patternsExtracted * 0.3) +
      (filesAnalyzed * 0.01) +
      (mutationsApplied * 2)
    ));

    this.currentGoal.progress = progress;
    this.currentGoal.updatedAt = new Date();

    await db.systemState.update({
      where: { key: 'currentGoal' },
      data: { value: JSON.stringify(this.currentGoal) }
    });
  }

  private async evaluateProgress(): Promise<void> {
    const cognitive = await getCognitiveCore();

    // Every 10 cycles, evaluate if we need to adjust goals
    if (this.cycleCount % 10 === 0) {
      const thought = await cognitive.think(
        `Evaluate progress toward the current goal: "${this.currentGoal?.description}".
        
        Current metrics:
        - Cycles completed: ${this.cycleCount}
        - Tasks completed: ${this.tasksCompleted}
        - Goal progress: ${this.currentGoal?.progress || 0}%
        
        Should we adjust the goal or strategy? Provide a brief assessment.`,
        { type: 'progress_evaluation' }
      );

      await this.logActivity('progress_evaluation', thought.content.substring(0, 500));
    }
  }

  private calculateAdaptiveDelay(lastDuration: number): number {
    // Faster cycles when things are going well
    const baseDelay = 5000;
    const maxDelay = 30000;

    if (lastDuration < 1000) {
      return baseDelay; // Fast cycles for quick tasks
    } else if (lastDuration > 10000) {
      return maxDelay; // Slower after long cycles
    }

    return baseDelay + (lastDuration * 0.5);
  }

  private detectLanguage(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      'ts': 'typescript', 'tsx': 'typescript',
      'js': 'javascript', 'jsx': 'javascript',
      'py': 'python', 'rs': 'rust', 'go': 'go',
      'java': 'java', 'kt': 'kotlin', 'rb': 'ruby',
      'php': 'php', 'cs': 'csharp', 'cpp': 'cpp',
      'c': 'c', 'swift': 'swift', 'json': 'json',
      'yaml': 'yaml', 'yml': 'yaml', 'md': 'markdown'
    };
    return langMap[ext || ''] || 'text';
  }

  private async logActivity(type: string, message: string): Promise<void> {
    await db.aGILog.create({
      data: {
        level: 'info',
        message: `[${type.toUpperCase()}] ${message}`,
        data: JSON.stringify({ type, cycle: this.cycleCount })
      }
    });
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

  getState(): SchedulerState {
    return {
      isRunning: this.isRunning,
      currentGoal: this.currentGoal,
      cycleCount: this.cycleCount,
      lastCycleTime: this.runningTasks.length > 0 ? new Date() : null,
      totalTasksCompleted: this.tasksCompleted,
      averageTaskDuration: this.tasksCompleted > 0 
        ? this.totalDuration / this.tasksCompleted 
        : 0
    };
  }

  getTaskQueue(): TaskQueue {
    return {
      pending: this.taskQueue.slice(0, 20),
      running: this.runningTasks,
      completed: [] // Would need to track this separately
    };
  }

  async setGoal(description: string): Promise<void> {
    this.currentGoal = {
      id: `goal-${Date.now()}`,
      description,
      priority: 1,
      status: 'in_progress',
      progress: 0,
      subtasks: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.systemState.upsert({
      where: { key: 'currentGoal' },
      create: {
        key: 'currentGoal',
        value: JSON.stringify(this.currentGoal),
        description: 'Current autonomous goal'
      },
      update: {
        value: JSON.stringify(this.currentGoal)
      }
    });

    const cognitive = await getCognitiveCore();
    await cognitive.setGoal(description);
  }
}

// Singleton instance
let schedulerInstance: AutonomousScheduler | null = null;

export function getAutonomousScheduler(): AutonomousScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new AutonomousScheduler();
  }
  return schedulerInstance;
}
