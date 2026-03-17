// src/lib/agents/orchestrator.ts

import MockZAI from '@/lib/sdk-mock';
import { 
  AGENT_REGISTRY, 
  AgentConfig, 
  AgentResult, 
  SynthesisResult, 
  Task 
} from './agent-registry';
import { v4 as uuidv4 } from 'uuid';

class AgentOrchestrator {
  private zai: any = null;
  private agentMap: Record<string, AgentConfig> = {};

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    if (!this.zai) {
      this.zai = await MockZAI.create();
    }
  }

  async executeTask(task: Task): Promise<SynthesisResult> {
    await this.initialize();

    const selectedAgents = this.selectAgents(task);
    const results = await this.executeParallel(selectedAgents, task);
    const synthesized = await this.synthesizeResults(results, task);

    return synthesized;
  }

  private selectAgents(task: Task): AgentConfig[] {
    const agentScores: Record<string, number> = {};

    for (const agent of Object.values(AGENT_REGISTRY)) {
      const relevance = this.calculateRelevance(task, agent);
      if (relevance > 0.3) {
        agentScores[agent.id] = relevance;
      }
    }

    return Object.values(AGENT_REGISTRY)
      .filter(agent => Object.hasOwn(agentScores, agent.id))
      .map(agent => ({ ...agent, relevance: agentScores[agent.id] }))
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 10);
  }

  private calculateRelevance(task: Task, agent: AgentConfig): number {
    const domainRelevance = this.calculateDomainRelevance(task.domain, agent.domain);
    const expertiseRelevance = this.calculateExpertiseRelevance(task.query, agent.expertise);

    return domainRelevance * 0.5 + expertiseRelevance * 0.5;
  }

  private calculateDomainRelevance(taskDomain: string, agentDomain: string): number {
    const domainMap: Record<string, string[]> = {
      General: ['Chemistry', 'Ecology', 'Physics', 'AI Research', 'Data Science'],
      Technical: ['Integration', 'Cloud Infrastructure', 'DevOps'],
      Creative: ['Philosophy', 'Storytelling', 'Innovation'],
      Strategic: ['Business', 'Risk Management', 'Ethics']
    };

    if (taskDomain === agentDomain) {
      return 1.0;
    }

    for (const [category, domains] of Object.entries(domainMap)) {
      if (domains.includes(agentDomain)) {
        return domains.includes(taskDomain) ? 0.8 : 0.5;
      }
    }

    return 0.2;
  }

  private calculateExpertiseRelevance(query: string, expertise: string[]): number {
    const queryLower = query.toLowerCase();
    return expertise.filter(exp => queryLower.includes(exp.toLowerCase())).length / expertise.length;
  }

  private async executeParallel(
    agents: AgentConfig[],
    task: Task
  ): Promise<AgentResult[]> {
    const results = await Promise.all(
      agents.map(agent => this.executeAgent(agent, task))
    );

    return results;
  }

  private async executeAgent(
    agent: AgentConfig,
    task: Task
  ): Promise<AgentResult> {
    const startTime = Date.now();

    try {
      const response = await this.callLLM(agent, task);

      const duration = Date.now() - startTime;

      const result: AgentResult = {
        agentId: agent.id,
        response: response.text || '',
        confidence: response.confidence || 0.5,
        reasoning: response.reasoning || '',
        duration,
        errors: []
      };

      return result;
    } catch (error: any) {
      return {
        agentId: agent.id,
        response: '',
        confidence: 0.0,
        reasoning: '',
        duration: Date.now() - startTime,
        errors: [error.message]
      };
    }
  }

  private async callLLM(agent: AgentConfig, task: Task): Promise<any> {
    const prompt = `You are ${agent.name}, a specialized ${agent.domain} expert with expertise in: ${agent.expertise.join(', ')}.

Your task: ${task.query}

Provide:
1. Your analysis based on your expertise
2. Your reasoning process
3. Confidence in your response (0.0 to 1.0)

Format as JSON:
{
  "text": "your response",
  "reasoning": "your reasoning",
  "confidence": 0.0
}`;

    const response = await this.zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      thinking: { type: 'disabled' }
    });

    const text = response.choices[0]?.message?.content || '';

    try {
      const parsed = JSON.parse(text);
      return {
        text: parsed.text || text,
        reasoning: parsed.reasoning || '',
        confidence: parsed.confidence || 0.5
      };
    } catch {
      return {
        text: text,
        reasoning: '',
        confidence: 0.5
      };
    }
  }

  private async synthesizeResults(
    results: AgentResult[],
    task: Task
  ): Promise<SynthesisResult> {
    const successful = results.filter(r => r.errors.length === 0);

    const synthesisPrompt = `Synthesize following agent responses into a coherent answer:

${successful.map(r => `- ${r.agentId}: ${r.response}`).join('\n')}

Query: ${task.query}

Provide:
1. A unified answer
2. Key insights from each agent
3. Overall confidence (0.0 to 1.0}`;

    const response = await this.zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant.'
        },
        {
          role: 'user',
          content: synthesisPrompt
        }
      ],
      thinking: { type: 'disabled' }
    });

    return {
      queryId: task.id,
      agentResults: results,
      synthesizedOutput: response.choices[0]?.message?.content || '',
      confidence: 0.8
    };
  }
}

export default AgentOrchestrator;