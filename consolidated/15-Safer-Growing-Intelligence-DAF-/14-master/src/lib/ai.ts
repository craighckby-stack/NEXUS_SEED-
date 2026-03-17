/**
 * AI Service using Official Google Generative AI SDK
 * @package @google/generative-ai (CORRECT package name)
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Type definitions
interface AIRequest {
  content: string;
  context?: string;
  temperature?: number;
  maxTokens?: number;
}

interface AIResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

interface EnhancementOptions {
  addComments?: boolean;
  optimizePerformance?: boolean;
  maintainCompatibility?: boolean;
  improveErrorHandling?: boolean;
}

// Constants
const DEFAULT_TEMPERATURE = 0.2;
const DEFAULT_MAX_TOKENS = 8192;
const MAX_CONTENT_LENGTH = 30000;
const MIN_CONTENT_LENGTH = 10;
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000;

// System context for code enhancement
const SYSTEM_CONTEXT = `You are an expert code reviewer and enhancer. Your task is to improve code quality by:
1. Adding clear, helpful comments
2. Optimizing performance where possible
3. Improving error handling
4. Maintaining backward compatibility
5. Following best practices

Return ONLY the improved code without explanations or markdown formatting.`;

// Initialize AI client (singleton)
let genAI: GoogleGenerativeAI | null = null;

function getAIClient(): GoogleGenerativeAI {
  // Always create fresh client to get latest environment variables
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Please set GOOGLE_API_KEY or GEMINI_API_KEY environment variable');
  }
  
  if (apiKey.includes('placeholder') || apiKey === 'AIzaSy_placeholder_key') {
    throw new Error(
      'Placeholder API key detected. Please replace with a real Gemini API key from https://makersuite.google.com/app/apikey'
    );
  }
  
  // Return fresh client each time to pick up new environment variables
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Make AI request using official Google Generative AI SDK
 */
async function makeAIRequest(config: AIRequest): Promise<AIResponse> {
  const client = getAIClient();
  
  // Get the model
  const model = client.getGenerativeModel({ 
    model: 'gemini-2.0-flash',
    systemInstruction: SYSTEM_CONTEXT,
    generationConfig: {
      temperature: config.temperature || DEFAULT_TEMPERATURE,
      maxOutputTokens: config.maxTokens || DEFAULT_MAX_TOKENS,
    },
  });

  try {
    // Generate content
    const result = await model.generateContent(config.content);
    const response = result.response;
    const text = response.text();

    // Validate response
    if (!text || text.trim().length === 0) {
      throw new Error('Empty response from AI model');
    }

    return {
      content: text,
      model: 'gemini-1.5-flash',
      usage: response.usageMetadata ? {
        promptTokens: response.usageMetadata.promptTokenCount,
        completionTokens: response.usageMetadata.candidatesTokenCount,
        totalTokens: response.usageMetadata.totalTokenCount,
      } : undefined,
    };
  } catch (error: any) {
    // Enhanced error categorization
    const errorMsg = error?.message?.toLowerCase() || '';
    
    if (errorMsg.includes('api key') || errorMsg.includes('authentication')) {
      throw new Error(`Authentication failed: ${error.message}. Check your GOOGLE_API_KEY`);
    }
    
    if (errorMsg.includes('rate limit') || errorMsg.includes('quota')) {
      throw new Error(`Rate limit exceeded: ${error.message}. Try again later`);
    }
    
    if (errorMsg.includes('timeout')) {
      throw new Error(`Request timeout: ${error.message}. Try again`);
    }
    
    throw new Error(`AI request failed: ${error.message}`);
  }
}

/**
 * Retry wrapper with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES
): Promise<T> {
  let lastError: Error = new Error('Unknown error');
  
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry authentication errors
      if (error.message?.includes('Authentication') || error.message?.includes('API key')) {
        throw error;
      }
      
      // Wait before retry
      if (i < retries - 1) {
        const delay = RETRY_DELAY_BASE * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

/**
 * Preprocess content before sending to AI
 */
function preprocessContent(content: string): string {
  let processed = content.trim();
  
  // Remove markdown code blocks if present
  processed = processed.replace(/```[\w]*\n?/g, '');
  
  // Remove leading/trailing whitespace from lines
  processed = processed.split('\n').map(line => line.trimEnd()).join('\n');
  
  // Truncate if too long
  if (processed.length > MAX_CONTENT_LENGTH) {
    processed = processed.substring(0, MAX_CONTENT_LENGTH) + '\n// ... (truncated)';
  }
  
  return processed;
}

/**
 * Clean AI response
 */
function cleanResponse(response: string): string {
  let cleaned = response.trim();
  
  // Remove markdown code blocks
  cleaned = cleaned.replace(/```[\w]*\n?/g, '');
  cleaned = cleaned.replace(/```\n?/g, '');
  
  // Remove explanatory text before/after code
  const lines = cleaned.split('\n');
  let startIdx = 0;
  let endIdx = lines.length;
  
  // Find first line that looks like code
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/^(import|export|const|let|var|function|class|interface|type|async|\/\/|\/\*|\{|\})/)) {
      startIdx = i;
      break;
    }
  }
  
  // Find last line that looks like code
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].trim().length > 0 && !lines[i].match(/^(here|this|the|note|explanation|summary|improved)/i)) {
      endIdx = i + 1;
      break;
    }
  }
  
  cleaned = lines.slice(startIdx, endIdx).join('\n');
  
  return cleaned.trim();
}

/**
 * Main enhancement function
 */
export async function sendToAI(
  code: string,
  options: EnhancementOptions = {}
): Promise<string> {
  // Validate input
  if (!code || code.trim().length < MIN_CONTENT_LENGTH) {
    throw new Error('Code content is too short or empty');
  }

  // Preprocess
  const processedCode = preprocessContent(code);
  
  // Build prompt
  let prompt = `Enhance the following code:\n\n${processedCode}\n\n`;
  
  if (options.addComments) prompt += 'Add helpful comments. ';
  if (options.optimizePerformance) prompt += 'Optimize for performance. ';
  if (options.improveErrorHandling) prompt += 'Improve error handling. ';
  if (options.maintainCompatibility) prompt += 'Maintain backward compatibility. ';

  // Make request with retry
  const response = await retryWithBackoff(() => 
    makeAIRequest({
      content: prompt,
      temperature: DEFAULT_TEMPERATURE,
      maxTokens: DEFAULT_MAX_TOKENS,
    })
  );

  // Clean and return
  return cleanResponse(response.content);
}

/**
 * Check if file should be enhanced
 */
export function shouldEnhanceFile(path: string, content: string): {
  should: boolean;
  reason: string;
  priority: number;
} {
  const ext = path.split('.').pop()?.toLowerCase();
  const size = content.length;
  
  // Skip binary files
  if (['jpg', 'png', 'gif', 'pdf', 'zip', 'tar', 'gz'].includes(ext || '')) {
    return { should: false, reason: 'Binary file', priority: 0 };
  }
  
  // Skip lock files
  if (path.includes('lock') || path.includes('.lock')) {
    return { should: false, reason: 'Lock file', priority: 0 };
  }
  
  // Skip very large files
  if (size > 100000) {
    return { should: false, reason: 'File too large', priority: 0 };
  }
  
  // Skip very small files
  if (size < 50) {
    return { should: false, reason: 'File too small', priority: 0 };
  }
  
  // Prioritize code files
  const codeExts = ['ts', 'tsx', 'js', 'jsx', 'py', 'java', 'cpp', 'c', 'go', 'rs'];
  if (codeExts.includes(ext || '')) {
    return { should: true, reason: 'Code file', priority: 2 };
  }
  
  // Lower priority for config files
  const configExts = ['json', 'yaml', 'yml', 'toml', 'ini'];
  if (configExts.includes(ext || '')) {
    return { should: true, reason: 'Config file', priority: 1 };
  }
  
  return { should: false, reason: 'Unknown file type', priority: 0 };
}

/**
 * Process multiple files
 */
export async function processMultipleFiles(
  files: Array<{ path: string; content: string }>,
  options: EnhancementOptions = {}
): Promise<Array<{ path: string; enhanced: string; error?: string }>> {
  const results = [];
  
  for (const file of files) {
    try {
      const analysis = shouldEnhanceFile(file.path, file.content);
      
      if (!analysis.should) {
        results.push({
          path: file.path,
          enhanced: file.content,
          error: `Skipped: ${analysis.reason}`,
        });
        continue;
      }
      
      const enhanced = await sendToAI(file.content, options);
      results.push({ path: file.path, enhanced });
    } catch (error: any) {
      results.push({
        path: file.path,
        enhanced: file.content,
        error: error.message,
      });
    }
  }
  
  return results;
}

/**
 * Health check
 */
export async function healthCheck(): Promise<{ ok: boolean; model: string; message?: string }> {
  try {
    const client = getAIClient();
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    // Simple test
    const result = await model.generateContent('Hello');
    const text = result.response.text();
    
    return {
      ok: !!text,
      model: 'gemini-2.0-flash',
    };
  } catch (error: any) {
    // Check if it's just a quota issue (which means API key is valid)
    const errorMsg = error?.message?.toLowerCase() || '';
    if (errorMsg.includes('quota') || errorMsg.includes('rate limit')) {
      return {
        ok: true, // API key is valid, just quota limited
        model: 'gemini-2.0-flash',
        message: 'API key valid but quota limited'
      };
    }
    
    return {
      ok: false,
      model: 'gemini-2.0-flash',
      message: error.message,
    };
  }
}

/**
 * Generate enhancement summary for pull requests
 */
export async function generateEnhancementSummary(
  fileList: string,
  description: string
): Promise<string> {
  try {
    const client = getAIClient();
    const model = client.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      systemInstruction: 'You are an AI assistant that generates clear, professional commit messages and pull request descriptions.',
    });

    const prompt = `Generate a professional pull request description for the following code enhancements:

Files modified: ${fileList}
Description: ${description}

Please create a concise but informative PR description that:
1. Summarizes the changes made
2. Highlights key improvements
3. Maintains a professional tone
4. Is suitable for a technical audience

Format as a clean PR description without markdown formatting.`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error: any) {
    console.error('Failed to generate enhancement summary:', error);
    return `${description}\n\nFiles: ${fileList}`;
  }
}