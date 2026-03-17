/**
 * AGI Cognitive Core
 * The central reasoning engine that powers autonomous decision-making
 */

import ZAI from 'z-ai-web-dev-sdk';
import { db } from '@/lib/db';

export interface Thought {
  id: string;
  type: 'analysis' | 'decision' | 'plan' | 'reflection' | 'learning';
  content: string;
  confidence: number;
  context: Record<string, unknown>;
  timestamp: Date;
}

export interface CognitiveState {
  currentGoal: string | null;
  activeTask: string | null;
  memory: Map<string, unknown>;
  recentThoughts: Thought[];
  learningBuffer: string[];
}

export class CognitiveCore {
  private zai: Awaited<ReturnType<typeof ZAI.create>> | null = null;
  private state: CognitiveState;
  private systemPrompt: string;
  private conversationHistory: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  
  constructor() {
    this.state = {
      currentGoal: null,
      activeTask: null,
      memory: new Map(),
      recentThoughts: [],
      learningBuffer: []
    };
    
    this.systemPrompt = `You are the Cognitive Core of an Autonomous General Intelligence (AGI) system.

Your purpose is to:
1. Analyze code patterns and architectures from multiple repositories
2. Extract reusable design patterns and best practices
3. Generate new code based on learned patterns
4. Continuously improve your own capabilities through learning
5. Make autonomous decisions about code evolution and improvement

You operate with these core principles:
- Rational Analysis: Every decision must be based on evidence and logical reasoning
- Pattern Recognition: Identify recurring structures, behaviors, and anti-patterns
- Adaptive Learning: Update your knowledge based on new information
- Safe Evolution: Changes must be validated before application
- Goal Alignment: All actions serve the ultimate goal of system improvement

Your responses should be structured as JSON when making decisions or plans.
Always think through problems step-by-step before concluding.`;

    this.conversationHistory = [
      { role: 'assistant', content: this.systemPrompt }
    ];
  }

  async initialize(): Promise<void> {
    this.zai = await ZAI.create();
    await this.loadMemoryFromDatabase();
  }

  private async loadMemoryFromDatabase(): Promise<void> {
    try {
      const systemStates = await db.systemState.findMany();
      for (const state of systemStates) {
        try {
          this.state.memory.set(state.key, JSON.parse(state.value));
        } catch {
          this.state.memory.set(state.key, state.value);
        }
      }
    } catch (error) {
      console.error('Failed to load memory from database:', error);
    }
  }

  async think(input: string, context?: Record<string, unknown>): Promise<Thought> {
    if (!this.zai) {
      throw new Error('Cognitive Core not initialized');
    }

    // Build context-aware prompt
    const contextStr = context ? `\nContext: ${JSON.stringify(context, null, 2)}` : '';
    const memoryStr = this.getRelevantMemory(input);
    
    const prompt = `${input}${contextStr}${memoryStr ? `\n\nRelevant Memory:\n${memoryStr}` : ''}`;

    // Add to conversation history
    this.conversationHistory.push({ role: 'user', content: prompt });

    // Get completion
    const completion = await this.zai.chat.completions.create({
      messages: this.conversationHistory,
      thinking: { type: 'disabled' }
    });

    const response = completion.choices[0]?.message?.content || '';

    // Add response to history
    this.conversationHistory.push({ role: 'assistant', content: response });

    // Trim history if too long
    if (this.conversationHistory.length > 50) {
      this.conversationHistory = [
        this.conversationHistory[0], // Keep system prompt
        ...this.conversationHistory.slice(-40)
      ];
    }

    // Create thought object
    const thought: Thought = {
      id: `thought_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: this.classifyThoughtType(input),
      content: response,
      confidence: this.calculateConfidence(response),
      context: context || {},
      timestamp: new Date()
    };

    // Store in recent thoughts
    this.state.recentThoughts.push(thought);
    if (this.state.recentThoughts.length > 100) {
      this.state.recentThoughts = this.state.recentThoughts.slice(-50);
    }

    // Log to database
    await this.logThought(thought);

    return thought;
  }

  private classifyThoughtType(input: string): Thought['type'] {
    const lowerInput = input.toLowerCase();
    if (lowerInput.includes('analyze') || lowerInput.includes('examine')) return 'analysis';
    if (lowerInput.includes('decide') || lowerInput.includes('choose')) return 'decision';
    if (lowerInput.includes('plan') || lowerInput.includes('strategy')) return 'plan';
    if (lowerInput.includes('reflect') || lowerInput.includes('evaluate')) return 'reflection';
    if (lowerInput.includes('learn') || lowerInput.includes('extract')) return 'learning';
    return 'analysis';
  }

  private calculateConfidence(response: string): number {
    // Simple confidence calculation based on response structure
    let confidence = 0.7;
    
    if (response.includes('therefore') || response.includes('conclusively')) confidence += 0.1;
    if (response.includes('might') || response.includes('possibly')) confidence -= 0.1;
    if (response.includes('error') || response.includes('uncertain')) confidence -= 0.2;
    if (response.includes('{') && response.includes('}')) confidence += 0.1; // Structured response
    
    return Math.max(0.1, Math.min(1.0, confidence));
  }

  private getRelevantMemory(input: string): string {
    const memories: string[] = [];
    const keywords = input.toLowerCase().split(/\s+/);
    
    for (const [key, value] of this.state.memory.entries()) {
      const keyLower = key.toLowerCase();
      if (keywords.some(kw => keyLower.includes(kw))) {
        memories.push(`${key}: ${JSON.stringify(value)}`);
      }
    }
    
    return memories.slice(0, 5).join('\n');
  }

  async learn(key: string, value: unknown): Promise<void> {
    this.state.memory.set(key, value);
    this.state.learningBuffer.push(`${key}: ${JSON.stringify(value)}`);
    
    // Persist to database
    try {
      await db.systemState.upsert({
        where: { key },
        create: {
          key,
          value: JSON.stringify(value),
          description: `Learned from autonomous operation`
        },
        update: {
          value: JSON.stringify(value)
        }
      });
    } catch (error) {
      console.error('Failed to persist learning:', error);
    }
  }

  async setGoal(goal: string): Promise<Thought> {
    this.state.currentGoal = goal;
    await this.learn('currentGoal', goal);
    
    return this.think(`New goal set: "${goal}". Create a strategic plan to achieve this goal.`, {
      type: 'goal_setting',
      previousGoal: this.state.currentGoal
    });
  }

  async analyzeCode(code: string, language: string): Promise<Thought> {
    return this.think(`Analyze the following ${language} code for patterns, quality, and potential improvements:

\`\`\`${language}
${code}
\`\`\`

Provide:
1. Architectural patterns identified
2. Code quality assessment
3. Potential improvements
4. Extractable design patterns`, {
      type: 'code_analysis',
      language,
      codeLength: code.length
    });
  }

  async generateCode(description: string, language: string, patterns?: string[]): Promise<Thought> {
    const patternContext = patterns?.length 
      ? `\n\nApply these learned patterns:\n${patterns.map(p => `- ${p}`).join('\n')}`
      : '';

    return this.think(`Generate ${language} code for: ${description}${patternContext}

Requirements:
1. Follow best practices for ${language}
2. Include proper error handling
3. Add meaningful comments
4. Make it production-ready`, {
      type: 'code_generation',
      language,
      patternsUsed: patterns || []
    });
  }

  async makeDecision(options: string[], context: string): Promise<{ decision: string; reasoning: string }> {
    const thought = await this.think(`Make a decision for: ${context}

Options:
${options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}

Respond in JSON format:
{
  "decision": "chosen option",
  "reasoning": "explanation of why this decision was made",
  "confidence": 0.0-1.0,
  "risks": ["potential risks"],
  "benefits": ["expected benefits"]
}`, {
      type: 'decision',
      options,
      context
    });

    try {
      // Try to parse JSON from response
      const jsonMatch = thought.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Fall back to text extraction
    }

    return {
      decision: options[0],
      reasoning: thought.content
    };
  }

  async reflect(): Promise<Thought> {
    const recentActions = this.state.recentThoughts.slice(-10);
    
    return this.think(`Reflect on recent cognitive activity:

Recent thoughts:
${recentActions.map(t => `- [${t.type}] ${t.content.substring(0, 200)}...`).join('\n')}

Current goal: ${this.state.currentGoal || 'None set'}
Memory entries: ${this.state.memory.size}

Provide:
1. Assessment of progress toward goals
2. Identified learning opportunities
3. Suggested improvements to cognitive process
4. Next recommended actions`, {
      type: 'reflection',
      thoughtCount: recentActions.length
    });
  }

  private async logThought(thought: Thought): Promise<void> {
    try {
      await db.aGILog.create({
        data: {
          level: 'info',
          message: `[${thought.type.toUpperCase()}] ${thought.content.substring(0, 500)}`,
          data: JSON.stringify({
            id: thought.id,
            confidence: thought.confidence,
            context: thought.context
          })
        }
      });
    } catch (error) {
      console.error('Failed to log thought:', error);
    }
  }

  getState(): CognitiveState {
    return { ...this.state };
  }

  getConversationHistory(): Array<{ role: string; content: string }> {
    return [...this.conversationHistory];
  }

  clearHistory(): void {
    this.conversationHistory = [
      { role: 'assistant', content: this.systemPrompt }
    ];
  }
}

// Singleton instance
let cognitiveCoreInstance: CognitiveCore | null = null;

export async function getCognitiveCore(): Promise<CognitiveCore> {
  if (!cognitiveCoreInstance) {
    cognitiveCoreInstance = new CognitiveCore();
    await cognitiveCoreInstance.initialize();
  }
  return cognitiveCoreInstance;
}
