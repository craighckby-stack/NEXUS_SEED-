import { NextRequest, NextResponse } from 'next/server';
import { 
  applyRateLimit, 
  validateEnvironment, 
  validateRepoParams, 
  validateConfiguration, 
  handleApiError, 
  createSuccessResponse, 
  createErrorResponse 
} from '@/lib/api-middleware';

/**
 * Enhanced configuration API with comprehensive error handling and validation
 */
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting first
    const rateLimitResult = await applyRateLimit(request);
    if (!rateLimitResult.success) {
      return createErrorResponse(
        rateLimitResult.message || 'Rate limit exceeded',
        429,
        'RATE_LIMIT_EXCEEDED'
      );
    }

    // Validate environment before processing
    const envValidation = validateEnvironment();
    if (!envValidation.valid) {
      return createErrorResponse(
        envValidation.message || 'Environment validation failed',
        500,
        'ENVIRONMENT_ERROR'
      );
    }

    // Enhanced request parsing with better error handling
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return createErrorResponse(
        'Invalid JSON in request body',
        400,
        'INVALID_JSON'
      );
    }

    // Enhanced configuration validation
    const configValidation = validateConfiguration(body);
    if (!configValidation.valid) {
      return createErrorResponse(
        configValidation.message || 'Configuration validation failed',
        400,
        'VALIDATION_ERROR'
      );
    }

    const { githubToken, geminiApiKey } = configValidation.data!;

    // Enhanced environment variable update with security considerations
    try {
      // In a real application, you would use a secure secret management system
      // For this demo, we'll update in-memory with caution
      process.env.GITHUB_TOKEN = githubToken;
      process.env.GOOGLE_API_KEY = geminiApiKey;

      // Clear any cached data that might be using old credentials
      // This would be more sophisticated in a real application
      
      return createSuccessResponse({
        message: 'Configuration updated successfully',
        timestamp: new Date().toISOString(),
        credentialsUpdated: {
          github: !!githubToken,
          gemini: !!geminiApiKey
        }
      });

    } catch (updateError) {
      return createErrorResponse(
        `Failed to update configuration: ${updateError instanceof Error ? updateError.message : 'Unknown error'}`,
        500,
        'CONFIG_UPDATE_ERROR'
      );
    }

  } catch (error) {
    return handleApiError(error, 'config-update');
  }
}

/**
 * Enhanced configuration retrieval with security considerations
 */
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request);
    if (!rateLimitResult.success) {
      return createErrorResponse(
        rateLimitResult.message || 'Rate limit exceeded',
        429,
        'RATE_LIMIT_EXCEEDED'
      );
    }

    // Validate environment
    const envValidation = validateEnvironment();
    if (!envValidation.valid) {
      return createErrorResponse(
        envValidation.message || 'Environment validation failed',
        500,
        'ENVIRONMENT_ERROR'
      );
    }

    // Enhanced configuration status with security considerations
    const configStatus = {
      configured: !!process.env.GITHUB_TOKEN && !!process.env.GOOGLE_API_KEY,
      github: {
        configured: !!process.env.GITHUB_TOKEN,
        tokenLength: process.env.GITHUB_TOKEN?.length || 0,
        isValid: process.env.GITHUB_TOKEN?.startsWith('ghp_') || false
      },
      gemini: {
        configured: !!process.env.GOOGLE_API_KEY,
        keyLength: process.env.GOOGLE_API_KEY?.length || 0,
        isValid: process.env.GOOGLE_API_KEY?.startsWith('AIzaSy') || false
      },
      security: {
        environmentSet: !!process.env.NODE_ENV,
        isProduction: process.env.NODE_ENV === 'production',
        recommendations: []
      }
    };

    // Add security recommendations
    if (!configStatus.github.configured) {
      configStatus.security.recommendations.push('Set GITHUB_TOKEN environment variable');
    }

    if (!configStatus.gemini.configured) {
      configStatus.security.recommendations.push('Set GOOGLE_API_KEY environment variable');
    }

    if (!configStatus.environmentSet) {
      configStatus.security.recommendations.push('Set NODE_ENV environment variable');
    }

    if (configStatus.github.configured && !configStatus.github.isValid) {
      configStatus.security.recommendations.push('GitHub token format appears invalid');
    }

    if (configStatus.gemini.configured && !configStatus.gemini.isValid) {
      configStatus.security.recommendations.push('Gemini API key format appears invalid');
    }

    return createSuccessResponse(configStatus);

  } catch (error) {
    return handleApiError(error, 'config-status');
  }
}