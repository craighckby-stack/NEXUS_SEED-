/**
 * Evolution System Service
 * 7-phase autonomous evolution backend
 * Uses ZAI SDK for AI integration
 */

'use server';

import ZAI from 'z-ai-web-dev-sdk';
import type { PhaseContext, EvolutionPhase, getRandomQuestion, getNextPhase, PHASE_NAMES } from './evolution-phases';
import type { Placeholder } from '@/system/placeholders';

// Configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const GITHUB_API_BASE = 'https://api.github.com';
const REPO_OWNER = process.env.GITHUB_REPO_OWNER || 'craighckby-stack';
const REPO_NAME = process.env.GITHUB_REPO_NAME || 'darlik-khan-v2';

export interface EvolutionState {
  cycleNumber: number;
  phase: EvolutionPhase;
  phaseContext: PhaseContext;
  isRunning: boolean;
  error?: string;
}

export interface FileMutationResult {
  file: string;
  originalCode: string;
  evolvedCode: string;
  success: boolean;
  error?: string;
}

export interface CommitResult {
  sha: string;
  success: boolean;
  error?: string;
}

/**
 * Phase 1: Generate Technical Question
 */
export async function phase1_GenerateQuestion(context: PhaseContext): Promise<PhaseContext> {
  const question = getRandomQuestion();

  return {
    ...context,
    phase: 'question',
    question,
    startTime: Date.now()
  };
}

/**
 * Phase 2: Get AI Answer (using ZAI SDK)
 */
export async function phase2_GetAnswer(context: PhaseContext): Promise<PhaseContext> {
  try {
    const zai = await ZAI.create({
      apiKey: process.env.NEXT_PUBLIC_LLM_API_KEY || ''
    });

    const prompt = `You are an expert React/TypeScript developer. Analyze this question and provide a detailed, technical answer:

Question: ${context.question}

Your answer should:
1. Directly address the question with technical precision
2. Provide specific code examples where relevant
3. Explain trade-offs and considerations
4. Reference best practices from modern React development
5. Consider performance implications

Answer format:
- Main solution (2-3 paragraphs)
- Code examples (if applicable)
- Trade-offs and alternatives
- Implementation notes

Provide your answer as plain text without markdown code blocks.`;

    const response = await zai.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      maxTokens: 2000,
      temperature: 0.7
    });

    const answer = response.choices?.[0]?.message?.content || 'Failed to generate answer';

    return {
      ...context,
      phase: 'answer',
      answer,
      startTime: Date.now()
    };
  } catch (error) {
    console.error('Error in phase2_GetAnswer:', error);
    return {
      ...context,
      phase: 'answer',
      answer: 'Failed to generate answer',
      error: String(error),
      startTime: Date.now()
    };
  }
}

/**
 * Phase 3: PRO/CON Debate
 */
export async function phase3_Debate(context: PhaseContext): Promise<PhaseContext> {
  try {
    const zai = await ZAI.create({
      apiKey: process.env.NEXT_PUBLIC_LLM_API_KEY || ''
    });

    const prompt = `Analyze the following question and answer. Generate PRO (arguments FOR making code changes) and CON (arguments AGAINST making changes).

Question: ${context.question}
Answer: ${context.answer}

Generate your analysis as:

PRO Arguments (3-5 points):
- Each point should support making code changes
- Be specific about benefits
- Consider performance, maintainability, features

CON Arguments (3-5 points):
- Each point should argue against making changes
- Consider risks, complexity, breaking changes
- Be realistic about downsides

Format each argument as a single paragraph. Be balanced and objective.`;

    const response = await zai.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      maxTokens: 1500,
      temperature: 0.8
    });

    const responseText = response.choices?.[0]?.message?.content || 'Failed to generate debate';

    // Parse PRO and CON sections
    const proMatch = responseText.match(/PRO Arguments[^:]*:(.*?)(?=\n\nCON|$)/is);
    const conMatch = responseText.match(/CON Arguments[^:]*:(.*)/is);

    const proArguments = proMatch?.[1]?.trim() || 'No PRO arguments generated';
    const conArguments = conMatch?.[1]?.trim() || 'No CON arguments generated';

    return {
      ...context,
      phase: 'debate',
      proArguments,
      conArguments,
      startTime: Date.now()
    };
  } catch (error) {
    console.error('Error in phase3_Debate:', error);
    return {
      ...context,
      phase: 'debate',
      proArguments: 'Failed to generate PRO arguments',
      conArguments: 'Failed to generate CON arguments',
      error: String(error),
      startTime: Date.now()
    };
  }
}

/**
 * Phase 4: Decision Making
 */
export async function phase4_Decision(context: PhaseContext): Promise<PhaseContext> {
  try {
    const zai = await ZAI.create({
      apiKey: process.env.NEXT_PUBLIC_LLM_API_KEY || ''
    });

    const prompt = `Based on the following analysis, make a GO/NO-GO decision about whether to proceed with code changes.

Question: ${context.question}
Answer: ${context.answer}

PRO Arguments:
${context.proArguments || 'Not available'}

CON Arguments:
${context.conArguments || 'Not available'}

Analyze the PRO vs CON arguments and decide:

Format your response as exactly one word:
GO (proceed with code changes) or NO-GO (skip this cycle)

Be decisive. Only respond with GO or NO-GO.`;

    const response = await zai.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      maxTokens: 10,
      temperature: 0.3
    });

    const decisionText = response.choices?.[0]?.message?.content?.trim().toUpperCase();
    const decision = decisionText === 'GO';

    return {
      ...context,
      phase: 'decision',
      decision,
      startTime: Date.now()
    };
  } catch (error) {
    console.error('Error in phase4_Decision:', error);
    return {
      ...context,
      phase: 'decision',
      decision: false,
      error: String(error),
      startTime: Date.now()
    };
  }
}

/**
 * Build prompt for placeholder filling
 */
function buildPlaceholderPrompt(placeholder: Placeholder): string {
  return `# STRATEGIC PLACEHOLDER IMPLEMENTATION

## Placeholder Details
- ID: ${placeholder.id}
- Title: ${placeholder.title}
- Category: ${placeholder.category}
- Priority: ${placeholder.priority}
- Complexity: ${placeholder.estimatedComplexity}/5

## Implementation Instructions
${placeholder.instruction}

## Requirements
1. Create file: ${placeholder.file}
2. Follow instruction precisely
3. Write production-ready code (no TODOs or placeholders)
4. Include error handling
5. Add TypeScript types
6. Include JSDoc comments
7. Make it testable

## Output Format
Return ONLY the complete file content. No markdown blocks. No explanations.
Code must be syntactically perfect and ready to commit.

---

BEGIN CODE:
`;
}

/**
 * Build prompt for file mutation
 */
function buildMutationPrompt(
  question: string,
  answer: string,
  targetFile: string,
  originalCode: string
): string {
  return `# CODE EVOLUTION TASK

## Context
Question: ${question}

Answer: ${answer}

## Target File
File: ${targetFile}

## Current Code

\`\`\`typescript
${originalCode}
\`\`\`

## Task
Improve the code above based on the question and answer. Your evolved code should:

1. Maintain the same functionality
2. Improve performance or code quality
3. Add better error handling
4. Improve TypeScript types
5. Add useful comments
6. Follow React/TypeScript best practices
7. Keep code under 60KB

## Output Format
Return ONLY the evolved file content. No markdown blocks. No explanations.
Code must be syntactically perfect TypeScript/React code.

---

BEGIN CODE:
`;
}

/**
 * Validate evolved code
 */
function validateEvolvedCode(original: string, evolved: string): boolean {
  if (!evolved || evolved.length < 20) return false;
  if (evolved === original) return false;
  if (evolved.includes('// TODO') || evolved.includes('// PLACEHOLDER')) return false;
  return true;
}

/**
 * Phase 5: Code Mutation
 */
export async function phase5_Mutation(
  context: PhaseContext,
  targetFile: string,
  placeholder?: Placeholder
): Promise<PhaseContext & { mutationResult?: FileMutationResult }> {
  try {
    const fileUrl = `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${targetFile}`;

    // First, try to get file to check if it exists
    const getResponse = await fetch(fileUrl, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!getResponse.ok) {
      throw new Error(`Failed to fetch file: ${getResponse.statusText}`);
    }

    const fileData = await getResponse.json();
    const originalCode = Buffer.from(fileData.content, 'base64').toString('utf-8');

    // Generate evolved code using AI
    const zai = await ZAI.create({
      apiKey: process.env.NEXT_PUBLIC_LLM_API_KEY || ''
    });

    const prompt = placeholder
      ? buildPlaceholderPrompt(placeholder)
      : buildMutationPrompt(context.question, context.answer, targetFile, originalCode);

    const response = await zai.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      maxTokens: 3000,
      temperature: 0.7
    });

    const evolvedCode = response.choices?.[0]?.message?.content || originalCode;

    // Validate evolved code
    const isValid = validateEvolvedCode(originalCode, evolvedCode);

    return {
      ...context,
      phase: 'mutation',
      targetFile,
      evolvedCode,
      mutationResult: {
        file: targetFile,
        originalCode,
        evolvedCode,
        success: isValid && evolvedCode !== originalCode
      }
    };
  } catch (error) {
    console.error('Error in phase5_Mutation:', error);
    return {
      ...context,
      phase: 'mutation',
      targetFile,
      mutationResult: {
        file: targetFile,
        originalCode: '',
        evolvedCode: '',
        success: false,
        error: String(error)
      }
    };
  }
}

/**
 * Phase 6: Commit to GitHub
 */
export async function phase6_Commit(
  context: PhaseContext,
  commitMessage: string
): Promise<PhaseContext & { commitResult?: CommitResult }> {
  try {
    if (!context.targetFile || !context.evolvedCode) {
      throw new Error('No file to commit');
    }

    const fileUrl = `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${context.targetFile}`;

    // Get file first to check if it exists
    const getResponse = await fetch(fileUrl, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    const content = Buffer.from(context.evolvedCode, 'utf-8').toString('base64');

    let commitResult;

    if (getResponse.ok) {
      // File exists - update it
      const fileData = await getResponse.json();
      commitResult = await fetch(fileUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: commitMessage,
          content,
          sha: fileData.sha
        })
      }).then(res => res.json());
    } else {
      // File doesn't exist - create it
      commitResult = await fetch(fileUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: commitMessage,
          content,
          branch: 'master'
        })
      }).then(res => res.json());
    }

    const sha = commitResult.commit?.sha || '';
    return {
      ...context,
      phase: 'commit',
      commitSha: sha.substring(0, 7),
      commitResult: {
        sha,
        success: true
      }
    };
  } catch (error) {
    console.error('Error in phase6_Commit:', error);
    return {
      ...context,
      phase: 'commit',
      commitResult: {
        sha: '',
        success: false,
        error: String(error)
      }
    };
  }
}

/**
 * Phase 7: Monitor Deployment
 */
export async function phase7_DeploymentMonitor(
  context: PhaseContext,
  commitSha: string
): Promise<PhaseContext> {
  try {
    // Check GitHub Actions deployment status
    const actionsUrl = `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/actions/runs?per_page=1`;
    let attempts = 0;
    const maxAttempts = 60;
    const pollInterval = 10000;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      attempts++;

      const response = await fetch(actionsUrl, {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const latestRun = data.workflow_runs?.[0] || data[0];

        if (latestRun) {
          const status = latestRun.status;
          const conclusion = latestRun.conclusion;

          if (status === 'completed') {
            return {
              ...context,
              phase: 'deployment',
              deploymentStatus: conclusion === 'success' ? 'success' : 'failed',
              commitSha
            };
          }

          return {
            ...context,
            phase: 'deployment',
            deploymentStatus: 'in_progress',
            commitSha
          };
        }
      }
    }

    return {
      ...context,
      phase: 'deployment',
      deploymentStatus: 'pending',
      commitSha
    };
  } catch (error) {
    console.error('Error in phase7_DeploymentMonitor:', error);
    return {
      ...context,
      phase: 'deployment',
      deploymentStatus: 'failed',
      commitSha,
      error: String(error)
    };
  }
}

/**
 * Get repository files for random selection
 */
export async function getRepositoryFiles(): Promise<string[]> {
  try {
    const treeUrl = `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/git/trees/master?recursive=1`;
    const response = await fetch(treeUrl, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch repository: ${response.statusText}`);
    }

    const data = await response.json();

    return data.tree
      .filter((file: any) => {
        if (file.type !== 'blob') return false;
        if (!file.path) return false;

        const excludePaths = ['node_modules', '.next', 'dist', 'build', 'examples', 'skills', 'mini-services', 'db'];
        if (excludePaths.some(excl => file.path.includes(excl))) return false;

        const codeExtensions = ['.ts', '.tsx', '.js', '.jsx'];
        if (!codeExtensions.some(ext => file.path.endsWith(ext))) return false;

        if (file.size && file.size > 60000) return false;

        return true;
      })
      .map((file: any) => file.path);
  } catch (error) {
    console.error('Error in getRepositoryFiles:', error);
    return [];
  }
}
