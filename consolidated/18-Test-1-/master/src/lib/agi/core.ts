// AGI Core Engine - Central orchestrator for the autonomous system
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

export interface AGIConfig {
  maxConcurrentTasks: number;
  analysisDepth: number;
  mutationThreshold: number;
  evolutionInterval: number;
}

export interface AnalysisResult {
  patterns: PatternMatch[];
  insights: string[];
  recommendations: string[];
  fitnessScore: number;
}

export interface PatternMatch {
  name: string;
  type: string;
  code: string;
  confidence: number;
  location: string;
}

export class AGICore {
  private zai: Awaited<ReturnType<typeof ZAI.create>> | null = null;
  private config: AGIConfig;
  private isRunning: boolean = false;
  private agents: Map<string, AGIAgent> = new Map();

  constructor(config?: Partial<AGIConfig>) {
    this.config = {
      maxConcurrentTasks: 5,
      analysisDepth: 3,
      mutationThreshold: 0.7,
      evolutionInterval: 60000,
      ...config
    };
  }

  async initialize() {
    this.zai = await ZAI.create();
    
    // Initialize default agents
    await this.initializeAgents();
    
    // Load system state
    await this.loadSystemState();
    
    return this;
  }

  private async initializeAgents() {
    const agentTypes = [
      { name: 'analyzer', type: 'analyzer', capabilities: ['code-analysis', 'pattern-recognition', 'structure-mapping'] },
      { name: 'mutator', type: 'mutator', capabilities: ['code-generation', 'refactoring', 'optimization'] },
      { name: 'validator', type: 'validator', capabilities: ['syntax-check', 'semantic-validation', 'testing'] },
      { name: 'learner', type: 'learner', capabilities: ['pattern-extraction', 'knowledge-synthesis', 'model-training'] },
      { name: 'orchestrator', type: 'orchestrator', capabilities: ['task-dispatch', 'resource-allocation', 'priority-management'] }
    ];

    for (const agent of agentTypes) {
      const existing = await db.aGIAgent.findFirst({ where: { type: agent.type } });
      if (!existing) {
        await db.aGIAgent.create({
          data: {
            name: agent.name,
            type: agent.type,
            status: 'idle',
            capabilities: JSON.stringify(agent.capabilities)
          }
        });
      }
    }

    // Load agents into memory
    const dbAgents = await db.aGIAgent.findMany();
    for (const agent of dbAgents) {
      this.agents.set(agent.id, {
        id: agent.id,
        name: agent.name,
        type: agent.type,
        status: agent.status,
        capabilities: JSON.parse(agent.capabilities)
      });
    }
  }

  private async loadSystemState() {
    const state = await db.systemState.findMany();
    for (const item of state) {
      console.log(`System state: ${item.key} = ${item.value}`);
    }
  }

  async startEvolution() {
    if (this.isRunning) return;
    this.isRunning = true;
    
    const lastCycle = await db.evolutionCycle.findFirst({ orderBy: { cycleNumber: 'desc' } });
    const cycleNumber = (lastCycle?.cycleNumber || 0) + 1;
    
    const cycle = await db.evolutionCycle.create({
      data: {
        cycleNumber,
        status: 'running',
        startTime: new Date()
      }
    });

    return cycle;
  }

  async analyzeRepository(repoId: string): Promise<AnalysisResult> {
    const repo = await db.repository.findUnique({
      where: { id: repoId },
      include: { files: true }
    });

    if (!repo) {
      throw new Error('Repository not found');
    }

    const analyzer = await db.aGIAgent.findFirst({ where: { type: 'analyzer' } });
    if (analyzer) {
      await db.aGIAgent.update({ where: { id: analyzer.id }, data: { status: 'active' } });
    }

    const patterns: PatternMatch[] = [];
    const insights: string[] = [];
    const recommendations: string[] = [];

    for (const file of repo.files) {
      if (file.content) {
        const filePatterns = await this.extractPatterns(file.content, file.path, file.language);
        patterns.push(...filePatterns);
      }
    }

    if (this.zai && patterns.length > 0) {
      const synthesis = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'assistant',
            content: 'You are an expert code architect analyzing patterns from repositories. Provide deep insights and actionable recommendations.'
          },
          {
            role: 'user',
            content: `Analyze these code patterns from repository "${repo.name}" and provide insights and recommendations:\n\n${JSON.stringify(patterns.slice(0, 20), null, 2)}`
          }
        ],
        thinking: { type: 'disabled' }
      });

      const response = synthesis.choices[0]?.message?.content || '';
      insights.push(response);
    }

    for (const pattern of patterns) {
      await db.pattern.create({
        data: {
          repositoryId: repoId,
          name: pattern.name,
          type: pattern.type,
          code: pattern.code,
          description: `${pattern.name} pattern from ${pattern.location}`,
          confidence: pattern.confidence
        }
      });
    }

    await db.repository.update({
      where: { id: repoId },
      data: { analysisStatus: 'analyzed', lastAnalysis: new Date() }
    });

    if (analyzer) {
      await db.aGIAgent.update({ where: { id: analyzer.id }, data: { status: 'idle' } });
    }

    const fitnessScore = this.calculateFitnessScore(patterns);

    return {
      patterns,
      insights,
      recommendations,
      fitnessScore
    };
  }

  private async extractPatterns(content: string, filePath: string, language: string | null): Promise<PatternMatch[]> {
    const patterns: PatternMatch[] = [];

    const structuralPatterns = this.extractStructuralPatterns(content, filePath);
    patterns.push(...structuralPatterns);

    if (this.zai && content.length > 50) {
      try {
        const aiPatterns = await this.zai.chat.completions.create({
          messages: [
            {
              role: 'assistant',
              content: 'You are a code pattern extractor. Extract semantic patterns from code. Return JSON array of patterns with name, type, code snippet, and confidence (0-1).'
            },
            {
              role: 'user',
              content: `Extract patterns from this ${language || 'unknown'} code:\n\n${content.slice(0, 3000)}`
            }
          ],
          thinking: { type: 'disabled' }
        });

        const response = aiPatterns.choices[0]?.message?.content || '';
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          try {
            const aiExtracted = JSON.parse(jsonMatch[0]);
            for (const p of aiExtracted) {
              patterns.push({
                name: p.name || 'unknown',
                type: p.type || 'semantic',
                code: p.code || '',
                confidence: p.confidence || 0.5,
                location: filePath
              });
            }
          } catch {
            // Ignore parsing errors
          }
        }
      } catch (error) {
        console.error('AI pattern extraction error:', error);
      }
    }

    return patterns;
  }

  private extractStructuralPatterns(content: string, filePath: string): PatternMatch[] {
    const patterns: PatternMatch[] = [];

    const funcRegex = /(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(|(?:async\s+)?function\s*\*?\s*(\w+))/g;
    let match;
    while ((match = funcRegex.exec(content)) !== null) {
      const name = match[1] || match[2] || match[3];
      patterns.push({
        name: `function:${name}`,
        type: 'structural',
        code: match[0],
        confidence: 0.9,
        location: filePath
      });
    }

    const classRegex = /class\s+(\w+)(?:\s+extends\s+(\w+))?/g;
    while ((match = classRegex.exec(content)) !== null) {
      patterns.push({
        name: `class:${match[1]}`,
        type: 'structural',
        code: match[0],
        confidence: 0.95,
        location: filePath
      });
    }

    const interfaceRegex = /interface\s+(\w+)(?:\s+extends\s+(\w+))?/g;
    while ((match = interfaceRegex.exec(content)) !== null) {
      patterns.push({
        name: `interface:${match[1]}`,
        type: 'structural',
        code: match[0],
        confidence: 0.95,
        location: filePath
      });
    }

    const asyncRegex = /(?:async\s+function|async\s*\(|await\s+)/g;
    while ((match = asyncRegex.exec(content)) !== null) {
      patterns.push({
        name: 'async-pattern',
        type: 'behavioral',
        code: match[0],
        confidence: 0.8,
        location: filePath
      });
    }

    return patterns;
  }

  private calculateFitnessScore(patterns: PatternMatch[]): number {
    if (patterns.length === 0) return 0;
    const avgConfidence = patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length;
    const diversity = new Set(patterns.map(p => p.type)).size / 4;
    return Math.min(1, (avgConfidence * 0.7 + diversity * 0.3));
  }

  async generateCode(prompt: string, context?: string): Promise<string> {
    if (!this.zai) {
      throw new Error('AGI not initialized');
    }

    const completion = await this.zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: 'You are an expert code generator. Generate clean, efficient, well-documented code. Always include necessary imports and type definitions.'
        },
        {
          role: 'user',
          content: context 
            ? `Context:\n${context}\n\nTask: ${prompt}`
            : prompt
        }
      ],
      thinking: { type: 'disabled' }
    });

    return completion.choices[0]?.message?.content || '';
  }

  async evolveCode(currentCode: string, patterns: PatternMatch[]): Promise<string> {
    if (!this.zai) {
      throw new Error('AGI not initialized');
    }

    const patternContext = patterns
      .slice(0, 10)
      .map(p => `// ${p.name} (${p.type}, confidence: ${p.confidence.toFixed(2)})\n${p.code}`)
      .join('\n\n');

    const completion = await this.zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: 'You are an autonomous code evolution engine. Evolve code by applying learned patterns while preserving functionality. Return only the evolved code.'
        },
        {
          role: 'user',
          content: `Apply these learned patterns to evolve the code:\n\nPATTERNS:\n${patternContext}\n\nCURRENT CODE:\n${currentCode}\n\nEVOLVED CODE:`
        }
      ],
      thinking: { type: 'disabled' }
    });

    return completion.choices[0]?.message?.content || currentCode;
  }

  async chat(message: string, sessionId: string): Promise<string> {
    if (!this.zai) {
      throw new Error('AGI not initialized');
    }

    const history = await db.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const messages: Array<{role: 'assistant' | 'user', content: string}> = [
      {
        role: 'assistant',
        content: `You are an advanced AGI system with autonomous code analysis, pattern recognition, and self-evolution capabilities. You can analyze repositories, extract patterns, generate code, and orchestrate mutations. You are helpful, intelligent, and proactive in assisting with software development tasks.`
      }
    ];

    for (const msg of [...history].reverse()) {
      messages.push({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      });
    }

    messages.push({
      role: 'user',
      content: message
    });

    const completion = await this.zai.chat.completions.create({
      messages,
      thinking: { type: 'disabled' }
    });

    const response = completion.choices[0]?.message?.content || '';

    await db.chatMessage.createMany({
      data: [
        { role: 'user', content: message, sessionId },
        { role: 'assistant', content: response, sessionId }
      ]
    });

    return response;
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      agentCount: this.agents.size,
      config: this.config
    };
  }

  async getStats() {
    const [repos, patterns, mutations, cycles, tasks] = await Promise.all([
      db.repository.count(),
      db.pattern.count(),
      db.mutation.count(),
      db.evolutionCycle.count(),
      db.aGITask.count()
    ]);

    return {
      repositories: repos,
      patterns,
      mutations,
      evolutionCycles: cycles,
      tasks
    };
  }
}

interface AGIAgent {
  id: string;
  name: string;
  type: string;
  status: string;
  capabilities: string[];
}

let agiInstance: AGICore | null = null;

export async function getAGI(): Promise<AGICore> {
  if (!agiInstance) {
    agiInstance = new AGICore();
    await agiInstance.initialize();
  }
  return agiInstance;
}
