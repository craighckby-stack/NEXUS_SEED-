/**
 * Error Handling Utilities
 * Centralized error handling for better error management and user feedback
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'NETWORK_ERROR', 503, details);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT_ERROR', 429);
    this.name = 'RateLimitError';
  }
}

/**
 * Safely execute async function with error handling
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  defaultValue?: T
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    console.error('Safe async error:', error);
    return defaultValue;
  }
}

/**
 * Safely execute function with error handling
 */
export function safeExecute<T>(
  fn: () => T,
  defaultValue?: T
): T | undefined {
  try {
    return fn();
  } catch (error) {
    console.error('Safe execute error:', error);
    return defaultValue;
  }
}

/**
 * Validate required fields in an object
 */
export function validateRequired<T extends Record<string, any>>(
  obj: T,
  requiredFields: (keyof T)[]
): ValidationError | null {
  const missing = requiredFields.filter(field => !obj[field]);

  if (missing.length > 0) {
    return new ValidationError(
      `Missing required fields: ${missing.join(', ')}`,
      { missing }
    );
  }

  return null;
}

/**
 * Format error for display
 */
export function formatError(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred';
}

/**
 * Check if error is a specific type
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  return error instanceof NetworkError;
}

/**
 * Check if error is a validation error
 */
export function isValidationError(error: unknown): boolean {
  return error instanceof ValidationError;
}

/**
 * Log error with context
 */
export function logError(error: unknown, context?: Record<string, any>) {
  const errorData = {
    timestamp: new Date().toISOString(),
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error,
    context
  };

  console.error('[Error Log]', JSON.stringify(errorData, null, 2));
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    backoffMultiplier?: number;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    backoffMultiplier = 2
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) {
        throw error;
      }

      const delay = initialDelay * Math.pow(backoffMultiplier, attempt);
      console.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Sanitize error for client response
 */
export function sanitizeError(error: unknown): {
  message: string;
  code?: string;
} {
  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message
    };
  }

  return {
    message: 'An unexpected error occurred'
  };
}
