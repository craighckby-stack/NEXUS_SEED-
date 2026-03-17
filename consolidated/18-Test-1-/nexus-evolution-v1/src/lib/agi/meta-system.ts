/**
 * AGI Meta System
 * Provides file introspection, lifecycle tracking, and self-reflection capabilities
 * Part of the DALEK_CAAN architecture integration
 */

import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';

export interface FileMetadata {
  name: string;
  path: string;
  status: 'instantiated' | 'analyzing' | 'ready' | 'mutated' | 'error';
  round: number;
  lifecycle: 'PENDING' | 'ANALYZING' | 'READY' | 'MUTATED';
  config: {
    Core: {
      version: string;
      mode: 'Active' | 'Passive' | 'Dormant';
    };
    Enhancement?: {
      source: string;
      vote: string;
      confidence: number;
    };
  };
  logs: string[];
  license: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MetaVote {
  source: string;
  confidence: number;
  timestamp: Date;
}

export interface MetaRound {
  roundNumber: number;
  filesProcessed: number;
  mutationsApplied: number;
  consensusAchieved: boolean;
  startedAt: Date;
  completedAt?: Date;
}

export class MetaSystem {
  private zai: Awaited<ReturnType<typeof ZAI.create>> | null = null;
  private currentRound: number = 0;
  private metaCache: Map<string, FileMetadata> = new Map();
  
  private readonly SYSTEM_NAME = 'Meta-123';
  private readonly VERSION = '1.0.4';
  private readonly LICENSE = 'MTCL-V1 (Proprietary)';

  async initialize(): Promise<void> {
    this.zai = await ZAI.create();
    await this.loadMetaState();
    console.log('Meta System initialized');
  }

  private async loadMetaState(): Promise<void> {
    try {
      const state = await db.systemState.findUnique({
        where: { key: 'meta_system_state' }
      });

      if (state) {
        const parsed = JSON.parse(state.value);
        this.currentRound = parsed.currentRound || 0;
      }
    } catch (error) {
      console.error('Failed to load meta state:', error);
    }
  }

  private async saveMetaState(): Promise<void> {
    await db.systemState.upsert({
      where: { key: 'meta_system_state' },
      create: {
        key: 'meta_system_state',
        value: JSON.stringify({
          currentRound: this.currentRound,
          lastUpdated: new Date().toISOString()
        }),
        description: 'Meta system state tracking'
      },
      update: {
        value: JSON.stringify({
          currentRound: this.currentRound,
          lastUpdated: new Date().toISOString()
        })
      }
    });
  }

  /**
   * Generate metadata for a file
   */
  async generateMetadata(filePath: string, content?: string): Promise<FileMetadata> {
    const existing = this.metaCache.get(filePath);
    
    const metadata: FileMetadata = {
      name: path.basename(filePath),
      path: filePath,
      status: existing?.status || 'instantiated',
      round: existing?.round || this.currentRound,
      lifecycle: existing?.lifecycle || 'PENDING',
      config: {
        Core: {
          version: this.VERSION,
          mode: 'Active'
        }
      },
      logs: existing?.logs || [],
      license: this.LICENSE,
      createdAt: existing?.createdAt || new Date(),
      updatedAt: new Date()
    };

    // Add lifecycle log
    if (!existing) {
      metadata.logs.push(`Meta-123: Lifecycle Instantiation R${this.currentRound} for ${path.basename(filePath)}`);
    }

    this.metaCache.set(filePath, metadata);
    return metadata;
  }

  /**
   * Analyze a file and update its metadata
   */
  async analyzeFile(filePath: string, content: string): Promise<FileMetadata> {
    if (!this.zai) {
      await this.initialize();
    }

    const metadata = await this.generateMetadata(filePath, content);
    metadata.status = 'analyzing';
    metadata.lifecycle = 'ANALYZING';

    try {
      // Analyze file for patterns, quality, and potential
      const analysis = await this.analyzeContent(content, filePath);
      
      // Update metadata with analysis results
      metadata.config.Enhancement = {
        source: analysis.suggestedSource,
        vote: analysis.vote,
        confidence: analysis.confidence
      };

      metadata.status = 'ready';
      metadata.lifecycle = 'READY';
      metadata.logs.push(`Analysis complete. Vote: **${analysis.vote}**`);

    } catch (error) {
      metadata.status = 'error';
      metadata.logs.push(`Analysis failed: ${(error as Error).message}`);
    }

    metadata.updatedAt = new Date();
    this.metaCache.set(filePath, metadata);
    
    return metadata;
  }

  private async analyzeContent(content: string, filePath: string): Promise<{
    suggestedSource: string;
    vote: string;
    confidence: number;
    patterns: string[];
    suggestions: string[];
  }> {
    if (!this.zai) {
      throw new Error('Meta system not initialized');
    }

    const ext = path.extname(filePath);
    const language = this.detectLanguage(ext);

    const prompt = `Analyze this ${language} file for metadata extraction:

File: ${filePath}
Content (first 2000 chars):
${content.substring(0, 2000)}

Determine:
1. What open-source project style does this code resemble most? (e.g., "Google/Genkit", "DeepSeek-Coder", "Qiskit/qiskit")
2. How confident are you in this assessment? (0.0-1.0)
3. What patterns are present?
4. What improvements could be made?

Respond in JSON:
{
  "suggestedSource": "project/style name",
  "vote": "Your vote for the most similar project",
  "confidence": 0.0-1.0,
  "patterns": ["pattern1", "pattern2"],
  "suggestions": ["suggestion1", "suggestion2"]
}`;

    try {
      const completion = await this.zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: 'You are a code metadata analyzer. Provide accurate assessments.' },
          { role: 'user', content: prompt }
        ],
        thinking: { type: 'disabled' }
      });

      const response = completion.choices[0]?.message?.content || '';
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Content analysis error:', error);
    }

    return {
      suggestedSource: 'Unknown',
      vote: 'local/custom',
      confidence: 0.5,
      patterns: [],
      suggestions: []
    };
  }

  /**
   * Run a meta round - process all AGI files and update metadata
   */
  async runMetaRound(): Promise<MetaRound> {
    this.currentRound++;
    const round: MetaRound = {
      roundNumber: this.currentRound,
      filesProcessed: 0,
      mutationsApplied: 0,
      consensusAchieved: false,
      startedAt: new Date()
    };

    try {
      // Get all AGI-related files
      const agiFiles = await this.getAGIFiles();
      
      for (const file of agiFiles) {
        try {
          await this.analyzeFile(file.path, file.content);
          round.filesProcessed++;
        } catch (error) {
          console.error(`Failed to analyze ${file.path}:`, error);
        }
      }

      // Log round completion
      await db.aGILog.create({
        data: {
          level: 'info',
          message: `Meta-123: Repo State R${this.currentRound}`,
          data: JSON.stringify({
            filesProcessed: round.filesProcessed,
            timestamp: new Date().toISOString()
          })
        }
      });

      round.consensusAchieved = true;
      round.completedAt = new Date();
      
      await this.saveMetaState();

    } catch (error) {
      console.error('Meta round error:', error);
      round.completedAt = new Date();
    }

    return round;
  }

  private async getAGIFiles(): Promise<Array<{ path: string; content: string }>> {
    // Get files from database that are AGI-related
    const files = await db.codeFile.findMany({
      where: {
        OR: [
          { path: { contains: 'agi' } },
          { path: { contains: 'cognitive' } },
          { path: { contains: 'evolution' } },
          { path: { contains: 'governance' } }
        ]
      },
      take: 50
    });

    return files
      .filter(f => f.content)
      .map(f => ({ path: f.path, content: f.content! }));
  }

  /**
   * Get metadata for a specific file
   */
  getMetadata(filePath: string): FileMetadata | undefined {
    return this.metaCache.get(filePath);
  }

  /**
   * Get all metadata
   */
  getAllMetadata(): FileMetadata[] {
    return Array.from(this.metaCache.values());
  }

  /**
   * Export metadata as JSON (for storage/transmission)
   */
  exportMetadata(): Record<string, FileMetadata> {
    const exported: Record<string, FileMetadata> = {};
    for (const [key, value] of this.metaCache) {
      exported[key] = value;
    }
    return exported;
  }

  /**
   * Vote on a file's enhancement source
   */
  async voteOnFile(filePath: string, sources: string[]): Promise<MetaVote> {
    if (!this.zai) {
      await this.initialize();
    }

    const metadata = this.metaCache.get(filePath);
    if (!metadata) {
      throw new Error('File not found in meta cache');
    }

    // Use AI to vote on the best enhancement source
    const prompt = `Vote on the best enhancement source for this file:

File: ${filePath}
Current Status: ${metadata.status}
Current Vote: ${metadata.config.Enhancement?.vote || 'None'}

Candidate Sources:
${sources.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Which source would provide the best enhancements for this file?
Respond with just the source name and confidence (0.0-1.0) in JSON:
{"source": "name", "confidence": 0.0-1.0}`;

    try {
      if (!this.zai) {
        throw new Error('Meta system not initialized');
      }
      const completion = await this.zai.chat.completions.create({
        messages: [
          { role: 'assistant', content: 'You are a voting engine. Pick the best option.' },
          { role: 'user', content: prompt }
        ],
        thinking: { type: 'disabled' }
      });

      const response = completion.choices[0]?.message?.content || '';
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          source: parsed.source,
          confidence: parsed.confidence,
          timestamp: new Date()
        };
      }
    } catch (error) {
      console.error('Voting error:', error);
    }

    return {
      source: sources[0] || 'unknown',
      confidence: 0.5,
      timestamp: new Date()
    };
  }

  /**
   * Get system status
   */
  getStatus(): {
    systemName: string;
    version: string;
    currentRound: number;
    filesTracked: number;
    status: string;
  } {
    return {
      systemName: this.SYSTEM_NAME,
      version: this.VERSION,
      currentRound: this.currentRound,
      filesTracked: this.metaCache.size,
      status: 'Active'
    };
  }

  private detectLanguage(ext: string): string {
    const langMap: Record<string, string> = {
      '.ts': 'TypeScript',
      '.tsx': 'TypeScript React',
      '.js': 'JavaScript',
      '.jsx': 'JavaScript React',
      '.py': 'Python',
      '.rs': 'Rust',
      '.go': 'Go',
      '.json': 'JSON',
      '.md': 'Markdown',
      '.yaml': 'YAML',
      '.yml': 'YAML'
    };
    return langMap[ext.toLowerCase()] || 'Unknown';
  }
}

// Singleton instance
let metaSystemInstance: MetaSystem | null = null;

export async function getMetaSystem(): Promise<MetaSystem> {
  if (!metaSystemInstance) {
    metaSystemInstance = new MetaSystem();
    await metaSystemInstance.initialize();
  }
  return metaSystemInstance;
}
