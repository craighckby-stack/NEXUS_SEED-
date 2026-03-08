/**
 * Code Analysis Module
 * Extracts patterns, architectures, and design decisions from codebases
 */

import ZAI from 'z-ai-web-dev-sdk';
import { db } from '@/lib/db';

export interface CodePattern {
  id: string;
  name: string;
  type: 'architectural' | 'structural' | 'behavioral' | 'semantic';
  description: string;
  code: string;
  language: string;
  confidence: number;
  usage: number;
  metadata: Record<string, unknown>;
}

export interface AnalysisResult {
  fileId: string;
  patterns: CodePattern[];
  quality: {
    score: number;
    issues: string[];
    suggestions: string[];
  };
  dependencies: string[];
  exports: string[];
  complexity: number;
}

export class CodeAnalyzer {
  private zai: Awaited<ReturnType<typeof ZAI.create>> | null = null;
  
  async initialize(): Promise<void> {
    this.zai = await ZAI.create();
  }

  async analyzeFile(content: string, path: string, language: string): Promise<AnalysisResult> {
    if (!this.zai) {
      throw new Error('Code Analyzer not initialized');
    }

    const prompt = `Analyze the following ${language} code file (${path}):

\`\`\`${language}
${content}
\`\`\`

Provide a comprehensive analysis in the following JSON format:
{
  "patterns": [
    {
      "name": "Pattern Name",
      "type": "architectural|structural|behavioral|semantic",
      "description": "What this pattern does",
      "code": "Code snippet representing the pattern",
      "confidence": 0.0-1.0,
      "metadata": {}
    }
  ],
  "quality": {
    "score": 0-100,
    "issues": ["list of issues found"],
    "suggestions": ["improvement suggestions"]
  },
  "dependencies": ["list of imported modules/packages"],
  "exports": ["list of exported functions/classes/variables"],
  "complexity": 1-10
}`;

    const completion = await this.zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: 'You are an expert code analyst. Analyze code for patterns, quality, and structure. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      thinking: { type: 'disabled' }
    });

    const response = completion.choices[0]?.message?.content || '';
    
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          fileId: path,
          patterns: parsed.patterns || [],
          quality: parsed.quality || { score: 50, issues: [], suggestions: [] },
          dependencies: parsed.dependencies || [],
          exports: parsed.exports || [],
          complexity: parsed.complexity || 5
        };
      }
    } catch (error) {
      console.error('Failed to parse analysis:', error);
    }

    return {
      fileId: path,
      patterns: [],
      quality: { score: 50, issues: ['Failed to analyze'], suggestions: [] },
      dependencies: [],
      exports: [],
      complexity: 5
    };
  }

  async extractPatterns(files: Array<{ path: string; content: string; language: string }>): Promise<CodePattern[]> {
    if (!this.zai) {
      throw new Error('Code Analyzer not initialized');
    }

    const allPatterns: CodePattern[] = [];

    // Process files in batches for efficiency
    const batchSize = 5;
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      const batchPatterns = await Promise.all(
        batch.map(file => this.analyzeFile(file.content, file.path, file.language))
      );
      
      for (const result of batchPatterns) {
        allPatterns.push(...result.patterns);
      }
    }

    // Deduplicate and consolidate patterns
    return this.consolidatePatterns(allPatterns);
  }

  private async consolidatePatterns(patterns: CodePattern[]): Promise<CodePattern[]> {
    if (!this.zai || patterns.length === 0) {
      return patterns;
    }

    // Group similar patterns
    const prompt = `Analyze these code patterns and consolidate duplicates or very similar patterns:

${JSON.stringify(patterns, null, 2)}

Return a consolidated list of unique, high-quality patterns in JSON format:
{
  "patterns": [
    {
      "name": "Consolidated Pattern Name",
      "type": "architectural|structural|behavioral|semantic",
      "description": "Description",
      "code": "Representative code snippet",
      "confidence": 0.0-1.0,
      "metadata": {}
    }
  ]
}`;

    try {
      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'assistant',
            content: 'You are a pattern consolidation expert. Merge similar patterns and return unique, valuable patterns.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        thinking: { type: 'disabled' }
      });

      const response = completion.choices[0]?.message?.content || '';
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.patterns || patterns;
      }
    } catch (error) {
      console.error('Failed to consolidate patterns:', error);
    }

    return patterns;
  }

  async analyzeRepository(repoId: string): Promise<{
    totalPatterns: number;
    avgQuality: number;
    topPatterns: CodePattern[];
  }> {
    const files = await db.codeFile.findMany({
      where: { repositoryId: repoId, analyzed: false }
    });

    let totalQuality = 0;
    const allPatterns: CodePattern[] = [];

    for (const file of files) {
      if (!file.content) continue;

      const language = this.detectLanguage(file.path);
      const result = await this.analyzeFile(file.content, file.path, language);

      totalQuality += result.quality.score;

      // Store patterns in database
      for (const pattern of result.patterns) {
        const created = await db.pattern.create({
          data: {
            repositoryId: repoId,
            fileId: file.id,
            name: pattern.name,
            type: pattern.type,
            description: pattern.description,
            code: pattern.code,
            confidence: pattern.confidence
          }
        });
        allPatterns.push({ ...pattern, id: created.id });
      }

      // Mark file as analyzed
      await db.codeFile.update({
        where: { id: file.id },
        data: { analyzed: true, language }
      });
    }

    // Get top patterns by confidence
    const topPatterns = allPatterns
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 20);

    return {
      totalPatterns: allPatterns.length,
      avgQuality: files.length > 0 ? totalQuality / files.length : 0,
      topPatterns
    };
  }

  private detectLanguage(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'py': 'python',
      'rs': 'rust',
      'go': 'go',
      'java': 'java',
      'kt': 'kotlin',
      'rb': 'ruby',
      'php': 'php',
      'cs': 'csharp',
      'cpp': 'cpp',
      'c': 'c',
      'swift': 'swift',
      'json': 'json',
      'yaml': 'yaml',
      'yml': 'yaml',
      'md': 'markdown',
      'sql': 'sql',
      'sh': 'bash',
      'css': 'css',
      'scss': 'scss',
      'html': 'html'
    };
    return langMap[ext || ''] || 'text';
  }

  async getPatternsForEvolution(): Promise<CodePattern[]> {
    const patterns = await db.pattern.findMany({
      where: { confidence: { gte: 0.7 } },
      orderBy: { usage: 'desc' },
      take: 50
    });

    return patterns.map(p => ({
      id: p.id,
      name: p.name,
      type: p.type as CodePattern['type'],
      description: p.description,
      code: p.code,
      language: 'typescript',
      confidence: p.confidence,
      usage: p.usage,
      metadata: {}
    }));
  }
}

// Singleton instance
let codeAnalyzerInstance: CodeAnalyzer | null = null;

export async function getCodeAnalyzer(): Promise<CodeAnalyzer> {
  if (!codeAnalyzerInstance) {
    codeAnalyzerInstance = new CodeAnalyzer();
    await codeAnalyzerInstance.initialize();
  }
  return codeAnalyzerInstance;
}
