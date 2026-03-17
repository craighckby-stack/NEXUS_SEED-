import { NextRequest, NextResponse } from 'next/server';

// Enhanced type definitions for better type safety
interface RateLimitStore {
  count: number;
  resetTime: number;
}

interface ValidationResult {
  valid: boolean;
  message?: string;
}

interface ConfigValidation {
  valid: boolean;
  message: string;
  data?: any;
}

// Constants for better maintainability
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in ms
const RATE_LIMIT_MAX_REQUESTS = 30;
const GITHUB_TOKEN_PREFIX = 'ghp_';
const GEMINI_TOKEN_PREFIX = 'AIzaSy';
const MIN_TOKEN_LENGTH = 20;

// Enhanced in-memory store with better structure
const rateLimitStore = new Map<string, RateLimitStore>();

/**
 * Enhanced rate limiting with better error handling and performance
 */
export async function applyRateLimit(request: NextRequest): Promise<{ success: boolean; message?: string }> {
  try {
    const ip = getClientIP(request);
    const key = `rate-limit:${ip}`;
    const now = Date.now();

    // Get or create rate limit entry
    let entry = rateLimitStore.get(key);
    if (!entry) {
      entry = { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
      rateLimitStore.set(key, entry);
    }

    // Reset window if expired
    if (now > entry.resetTime) {
      entry.count = 0;
      entry.resetTime = now + RATE_LIMIT_WINDOW;
    }

    // Check rate limit
    if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
      const resetIn = Math.ceil((entry.resetTime - now) / 1000);
      return { 
        success: false, 
        message: `Rate limit exceeded. Reset in ${resetIn}s.` 
      };
    }

    // Increment counter
    entry.count++;
    rateLimitStore.set(key, entry);

    return { success: true };
  } catch (error) {
    console.error('Rate limiting error:', error);
    // Fail open to prevent service disruption
    return { success: true };
  }
}

/**
 * Enhanced environment variable validation
 */
export function validateEnvironment(): ValidationResult {
  try {
    const errors: string[] = [];

    // Validate GitHub token
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      errors.push('GITHUB_TOKEN environment variable is not set');
    } else if (!githubToken.startsWith(GITHUB_TOKEN_PREFIX)) {
      errors.push('GITHUB_TOKEN has invalid format');
    } else if (githubToken.length < MIN_TOKEN_LENGTH) {
      errors.push('GITHUB_TOKEN is too short');
    }

    // Validate Gemini API key
    const geminiApiKey = process.env.GOOGLE_API_KEY;
    if (!geminiApiKey) {
      errors.push('GOOGLE_API_KEY environment variable is not set');
    } else if (!geminiApiKey.startsWith(GEMINI_TOKEN_PREFIX)) {
      errors.push('GOOGLE_API_KEY has invalid format');
    } else if (geminiApiKey.length < MIN_TOKEN_LENGTH) {
      errors.push('GOOGLE_API_KEY is too short');
    }

    return {
      valid: errors.length === 0,
      message: errors.length > 0 ? errors.join('; ') : undefined
    };
  } catch (error) {
    return {
      valid: false,
      message: `Environment validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Enhanced repository parameter validation
 */
export function validateRepoParams(owner: string | null, repo: string | null): ValidationResult {
  try {
    if (!owner || !repo) {
      return { 
        valid: false, 
        message: 'Owner and repository parameters are required' 
      };
    }

    // Enhanced validation with better error messages
    if (owner.length < 1 || owner.length > 39) {
      return { 
        valid: false, 
        message: 'Invalid owner name length (must be 1-39 characters)' 
      };
    }

    if (repo.length < 1 || repo.length > 100) {
      return { 
        valid: false, 
        message: 'Invalid repository name length (must be 1-100 characters)' 
      };
    }

    // Enhanced character validation
    const validRepoPattern = /^[a-zA-Z0-9._-]+$/;
    if (!validRepoPattern.test(owner) || !validRepoPattern.test(repo)) {
      return { 
        valid: false, 
        message: 'Repository names can only contain alphanumeric characters, hyphens, underscores, and periods' 
      };
    }

    // Reserved names validation
    const reservedNames = ['www', 'help', 'api', 'support', 'blog', 'about'];
    if (reservedNames.includes(owner.toLowerCase()) || reservedNames.includes(repo.toLowerCase())) {
      return { 
        valid: false, 
        message: 'Repository name cannot be a reserved word' 
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      message: `Repository validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Enhanced configuration validation
 */
export function validateConfiguration(config: any): ConfigValidation {
  try {
    if (!config || typeof config !== 'object') {
      return {
        valid: false,
        message: 'Invalid configuration format'
      };
    }

    const { githubToken, geminiApiKey } = config;
    const errors: string[] = [];

    // Validate GitHub token
    if (!githubToken || typeof githubToken !== 'string') {
      errors.push('GitHub token is required and must be a string');
    } else if (!githubToken.startsWith(GITHUB_TOKEN_PREFIX)) {
      errors.push('Invalid GitHub token format');
    } else if (githubToken.length < MIN_TOKEN_LENGTH) {
      errors.push('GitHub token is too short');
    }

    // Validate Gemini API key
    if (!geminiApiKey || typeof geminiApiKey !== 'string') {
      errors.push('Gemini API key is required and must be a string');
    } else if (!geminiApiKey.startsWith(GEMINI_TOKEN_PREFIX)) {
      errors.push('Invalid Gemini API key format');
    } else if (geminiApiKey.length < MIN_TOKEN_LENGTH) {
      errors.push('Gemini API key is too short');
    }

    return {
      valid: errors.length === 0,
      message: errors.length > 0 ? errors.join('; ') : 'Configuration is valid',
      data: { githubToken: githubToken?.trim(), geminiApiKey: geminiApiKey?.trim() }
    };
  } catch (error) {
    return {
      valid: false,
      message: `Configuration validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Enhanced error handling for API responses
 */
export function handleApiError(error: unknown, context: string): NextResponse {
  console.error(`Error in ${context}:`, error);

  if (error instanceof Error) {
    // Enhanced error categorization
    if (error.message.includes('Rate limit')) {
      return NextResponse.json(
        { 
          error: 'API rate limit exceeded. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: 60
        },
        { status: 429 }
      );
    }

    if (error.message.includes('Authentication') || error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { 
          error: 'Authentication failed. Please check your API credentials.',
          code: 'AUTHENTICATION_ERROR'
        },
        { status: 401 }
      );
    }

    if (error.message.includes('Not Found') || error.message.includes('404')) {
      return NextResponse.json(
        { 
          error: 'Resource not found or not accessible.',
          code: 'NOT_FOUND'
        },
        { status: 404 }
      );
    }

    if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
      return NextResponse.json(
        { 
          error: 'Request timeout. Please try again.',
          code: 'TIMEOUT'
        },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { 
        error: error.message,
        code: 'UNKNOWN_ERROR'
      },
      { status: 500 }
    );
  }
}

/**
 * Enhanced success response helper
 */
export function createSuccessResponse(data: any, status: number = 200, meta?: any): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    timestamp: new Date().toISOString(),
    ...meta
  }, { status });
}

/**
 * Enhanced error response helper
 */
export function createErrorResponse(message: string, status: number = 400, code?: string, meta?: any): NextResponse {
  return NextResponse.json({
    success: false,
    error: message,
    code,
    timestamp: new Date().toISOString(),
    ...meta
  }, { status });
}

/**
 * Helper function to get client IP with better handling
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP.trim();
  }
  
  return request.ip || 'unknown';
}

/**
 * Cleanup function for rate limiting (call periodically)
 */
export function cleanupRateLimit(): void {
  const now = Date.now();
  const expiredKeys: string[] = [];

  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      expiredKeys.push(key);
    }
  }

  // Clean up expired entries
  expiredKeys.forEach(key => rateLimitStore.delete(key));
}

// Auto-cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimit, 5 * 60 * 1000);
}