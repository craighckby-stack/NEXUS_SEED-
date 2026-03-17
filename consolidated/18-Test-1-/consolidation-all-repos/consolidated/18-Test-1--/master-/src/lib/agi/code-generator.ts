/**
 * Code Generation Engine
 * Generates new code based on learned patterns and specifications
 */

import ZAI from 'z-ai-web-dev-sdk';
import { db } from '@/lib/db';
import { getCodeAnalyzer, type CodePattern } from './code-analyzer';

export interface GenerationRequest {
  description: string;
  language: string;
  framework?: string;
  patterns?: string[];
  constraints?: string[];
  targetFile?: string;
}

export interface GeneratedCode {
  code: string;
  language: string;
  explanation: string;
  patternsUsed: string[];
  confidence: number;
  tests?: string;
}

export interface MutationProposal {
  id: string;
  targetFile: string;
  type: 'create' | 'modify' | 'delete' | 'refactor';
  description: string;
  beforeCode?: string;
  afterCode: string;
  rationale: string;
  riskLevel: 'low' | 'medium' | 'high';
  patternsUsed: string[];
}

export class CodeGenerator {
  private zai: Awaited<ReturnType<typeof ZAI.create>> | null = null;
  
  async initialize(): Promise<void> {
    this.zai = await ZAI.create();
  }

  async generate(request: GenerationRequest): Promise<GeneratedCode> {
    if (!this.zai) {
      throw new Error('Code Generator not initialized');
    }

    // Get relevant patterns from the database
    const analyzer = await getCodeAnalyzer();
    const patterns = await analyzer.getPatternsForEvolution();
    
    // Filter patterns by relevance
    const relevantPatterns = this.filterRelevantPatterns(patterns, request);
    
    const patternsContext = relevantPatterns.length > 0
      ? `\n\nRelevant patterns to apply:\n${relevantPatterns.map(p => 
          `### ${p.name} (${p.type})\n${p.description}\n\`\`\`\n${p.code}\n\`\`\``
        ).join('\n\n')}`
      : '';

    const constraintsContext = request.constraints?.length
      ? `\n\nConstraints:\n${request.constraints.map(c => `- ${c}`).join('\n')}`
      : '';

    const frameworkContext = request.framework
      ? ` using ${request.framework} framework`
      : '';

    const prompt = `Generate ${request.language} code${frameworkContext} for:

${request.description}
${patternsContext}${constraintsContext}

Requirements:
1. Follow best practices and modern patterns
2. Include proper error handling
3. Add TypeScript types if applicable
4. Include meaningful comments
5. Make it production-ready
6. Include unit tests if appropriate

Respond in JSON format:
{
  "code": "the generated code",
  "explanation": "explanation of the approach",
  "patternsUsed": ["names of patterns applied"],
  "confidence": 0.0-1.0,
  "tests": "optional test code"
}`;

    const completion = await this.zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: 'You are an expert code generator. Generate clean, efficient, production-ready code. Always respond with valid JSON.'
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
          code: parsed.code || '',
          language: request.language,
          explanation: parsed.explanation || '',
          patternsUsed: parsed.patternsUsed || [],
          confidence: parsed.confidence || 0.7,
          tests: parsed.tests
        };
      }
    } catch (error) {
      console.error('Failed to parse generated code:', error);
    }

    // Fallback: try to extract code from response
    const codeMatch = response.match(/```[\w]*\n([\s\S]*?)```/);
    return {
      code: codeMatch ? codeMatch[1] : response,
      language: request.language,
      explanation: 'Generated code',
      patternsUsed: [],
      confidence: 0.5
    };
  }

  private filterRelevantPatterns(patterns: CodePattern[], request: GenerationRequest): CodePattern[] {
    const keywords = request.description.toLowerCase().split(/\s+/);
    const patternKeywords = request.patterns || [];
    
    return patterns.filter(pattern => {
      const patternLower = `${pattern.name} ${pattern.description}`.toLowerCase();
      
      // Check if pattern name is explicitly requested
      if (patternKeywords.some(pk => pattern.name.toLowerCase().includes(pk.toLowerCase()))) {
        return true;
      }
      
      // Check if pattern is relevant to the description
      const relevanceScore = keywords.filter(kw => patternLower.includes(kw)).length;
      return relevanceScore >= 2;
    }).slice(0, 5);
  }

  async proposeMutations(
    targetFiles: Array<{ path: string; content: string }>,
    goal: string
  ): Promise<MutationProposal[]> {
    if (!this.zai) {
      throw new Error('Code Generator not initialized');
    }

    const analyzer = await getCodeAnalyzer();
    const patterns = await analyzer.getPatternsForEvolution();

    const prompt = `Analyze these files and propose mutations to achieve the following goal:

GOAL: ${goal}

FILES:
${targetFiles.map(f => `### ${f.path}\n\`\`\`\n${f.content.substring(0, 3000)}\n\`\`\``).join('\n\n')}

AVAILABLE PATTERNS:
${patterns.slice(0, 10).map(p => `- ${p.name}: ${p.description}`).join('\n')}

Propose specific mutations in JSON format:
{
  "mutations": [
    {
      "targetFile": "path/to/file",
      "type": "create|modify|delete|refactor",
      "description": "What this mutation does",
      "beforeCode": "code before (for modify/refactor)",
      "afterCode": "code after",
      "rationale": "Why this change helps achieve the goal",
      "riskLevel": "low|medium|high",
      "patternsUsed": ["pattern names"]
    }
  ]
}`;

    const completion = await this.zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: 'You are a code evolution expert. Propose safe, effective mutations. Always respond with valid JSON.'
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
        return (parsed.mutations || []).map((m: Record<string, unknown>, i: number) => ({
          id: `mutation_${Date.now()}_${i}`,
          ...m
        })) as MutationProposal[];
      }
    } catch (error) {
      console.error('Failed to parse mutations:', error);
    }

    return [];
  }

  async improveCode(code: string, language: string): Promise<GeneratedCode> {
    return this.generate({
      description: `Improve and refactor the following ${language} code while maintaining its functionality:\n\n\`\`\`${language}\n${code}\n\`\`\``,
      language,
      constraints: [
        'Maintain backward compatibility',
        'Improve performance where possible',
        'Add better error handling',
        'Improve code readability'
      ]
    });
  }

  async generateTests(code: string, language: string): Promise<GeneratedCode> {
    return this.generate({
      description: `Generate comprehensive unit tests for the following ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``,
      language,
      constraints: [
        'Cover all public functions/methods',
        'Include edge cases',
        'Test error handling',
        'Use appropriate testing framework'
      ]
    });
  }

  async generateDocumentation(code: string, language: string): Promise<string> {
    if (!this.zai) {
      throw new Error('Code Generator not initialized');
    }

    const prompt = `Generate comprehensive documentation for the following ${language} code:

\`\`\`${language}
${code}
\`\`\`

Include:
1. Overview/Description
2. Usage examples
3. API reference for all public functions/classes
4. Configuration options if any
5. Dependencies`;

    const completion = await this.zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: 'You are a technical documentation expert. Generate clear, comprehensive documentation in Markdown format.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      thinking: { type: 'disabled' }
    });

    return completion.choices[0]?.message?.content || '';
  }

  async selfImprove(): Promise<{
    improvements: Array<{ file: string; improvement: string }>;
    reasoning: string;
  }> {
    // Get the AGI's own code files
    const agiFiles = await db.codeFile.findMany({
      where: { path: { contains: 'agi' } },
      take: 10
    });

    if (agiFiles.length === 0) {
      return {
        improvements: [],
        reasoning: 'No AGI files found to improve'
      };
    }

    if (!this.zai) {
      throw new Error('Code Generator not initialized');
    }

    const prompt = `Analyze these AGI system files and suggest improvements for self-evolution:

${agiFiles.map(f => `### ${f.path}\n\`\`\`\n${f.content?.substring(0, 2000) || ''}\n\`\`\``).join('\n\n')}

Suggest specific improvements that would:
1. Enhance reasoning capabilities
2. Improve code generation quality
3. Better pattern extraction
4. More efficient learning
5. Better decision making

Respond in JSON format:
{
  "improvements": [
    {
      "file": "path/to/file",
      "improvement": "specific improvement description"
    }
  ],
  "reasoning": "overall reasoning for these improvements"
}`;

    const completion = await this.zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: 'You are an AGI self-improvement expert. Suggest concrete, safe improvements.'
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
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Failed to parse self-improvements:', error);
    }

    return {
      improvements: [],
      reasoning: response
    };
  }
}

// Singleton instance
let codeGeneratorInstance: CodeGenerator | null = null;

export async function getCodeGenerator(): Promise<CodeGenerator> {
  if (!codeGeneratorInstance) {
    codeGeneratorInstance = new CodeGenerator();
    await codeGeneratorInstance.initialize();
  }
  return codeGeneratorInstance;
}
