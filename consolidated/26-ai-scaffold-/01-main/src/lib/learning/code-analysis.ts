// Learning Layer - Code Analysis System
// Analyzes code complexity, bottlenecks, and code smells

import { fetch } from 'node-fetch';

export interface ComplexityMetric {
  linesOfCode: number;
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  maintainabilityIndex: number;
  technicalDebt: number;
}

export interface CodeSmell {
  id: string;
  type: 'duplicate_code' | 'long_method' | 'long_parameter_list' | 'god_class' | 'complex_conditional' | 'data_clumps' | 'feature_envy' | 'magic_numbers' | 'dead_code' | 'uncommented_code';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location: string;
  suggestion: string;
}

export interface Bottleneck {
  id: string;
  type: 'performance' | 'memory' | 'io' | 'concurrency' | 'database' | 'network';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location: string;
  impact: string;
  suggestion: string;
}

export interface CodeAnalysisReport {
  timestamp: number;
  filePath: string;
  language: string;
  complexity: ComplexityMetric;
  codeSmells: CodeSmell[];
  bottlenecks: Bottleneck[];
  qualityScore: number; // 0.0 to 1.0
  improvementSuggestions: string[];
  estimatedRefactorTime: number;
}

export const LANGUAGE_SUPPORT = {
  typescript: {
    extensions: ['.ts', '.tsx'],
    complexityMultipliers: {
      functions: 1.0,
      classes: 1.2,
      interfaces: 0.8,
      enums: 0.6,
    },
  },
  javascript: {
    extensions: ['.js', '.jsx'],
    complexityMultipliers: {
      functions: 1.1,
      classes: 1.3,
      objects: 1.0,
      prototypes: 1.2,
    },
  },
  python: {
    extensions: ['.py'],
    complexityMultipliers: {
      functions: 0.9,
      classes: 1.1,
      modules: 1.0,
      methods: 1.0,
    },
  },
} as const;

// Code Analyzer
class CodeAnalyzer {
  private readonly apiUrl = '/api/learning/code-analysis';

  async analyzeCode(params: {
    filePath: string;
    language?: string;
    content?: string;
    includeDetailedAnalysis?: boolean;
  }): Promise<CodeAnalysisReport> {
    const { filePath, language, content } = params;

    const detectedLanguage = language || this.detectLanguage(filePath);
    const languageSupport = LANGUAGE_SUPPORT[detectedLanguage];

    if (!languageSupport) {
      throw new Error(`Unsupported language: ${detectedLanguage}`);
    }

    const fileContent = content || await this.readFileContent(filePath);

    const complexity = this.calculateComplexity(fileContent, languageSupport.complexityMultipliers);

    const codeSmells = this.detectCodeSmells(fileContent, detectedLanguage);
    const bottlenecks = this.detectBottlenecks(fileContent, detectedLanguage);

    const qualityScore = this.calculateQualityScore(complexity, codeSmells, bottlenecks);
    const improvementSuggestions = this.generateSuggestions(complexity, codeSmells, bottlenecks);
    const estimatedRefactorTime = this.estimateRefactorTime(complexity, codeSmells, bottlenecks);

    const report: CodeAnalysisReport = {
      timestamp: Date.now(),
      filePath,
      language: detectedLanguage,
      complexity,
      codeSmells,
      bottlenecks,
      qualityScore,
      improvementSuggestions,
      estimatedRefactorTime,
    };

    await this.saveReport(report);

    return report;
  }

  private detectLanguage(filePath: string): string {
    const extension = filePath.split('.').pop()?.toLowerCase();

    if (!extension) return 'typescript';

    const languageExtensions: Record<string, string> = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.py': 'python',
      '.java': 'java',
      '.cs': 'csharp',
      '.cpp': 'cpp',
      '.c': 'c',
      '.go': 'go',
      '.rs': 'rust',
    };

    return languageExtensions[extension] || 'typescript';
  }

  private async readFileContent(filePath: string): Promise<string> {
    return await fetch(filePath, { method: 'text' });
  }

  private calculateComplexity(content: string, multipliers: any): ComplexityMetric {
    const lines = content.split('\n');
    const linesOfCode = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed.length > 0 && !trimmed.startsWith('//') && !trimmed.startsWith('/*');
    }).length;

    const cyclomaticComplexity = this.estimateCyclomaticComplexity(content);
    const cognitiveComplexity = this.estimateCognitiveComplexity(content);

    const maintainabilityIndex = this.calculateMaintainabilityIndex(
      cyclomaticComplexity,
      cognitiveComplexity,
      linesOfCode
    );

    const technicalDebt = this.estimateTechnicalDebt(
      cyclomaticComplexity,
      cognitiveComplexity,
      linesOfCode
    );

    return {
      linesOfCode,
      cyclomaticComplexity,
      cognitiveComplexity,
      maintainabilityIndex,