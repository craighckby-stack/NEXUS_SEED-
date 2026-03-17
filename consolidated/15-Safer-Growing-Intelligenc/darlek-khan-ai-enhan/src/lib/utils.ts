/**
 * Utility functions for the Darlek Khan AI Autonomous Enhancer
 * Enhanced with intelligent class merging and comprehensive documentation
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Intelligently merges Tailwind CSS classes using clsx and tailwind-merge
 * 
 * This function combines the power of clsx (for conditional class names) 
 * with tailwind-merge (for intelligent Tailwind class deduplication)
 * to provide optimal CSS class management.
 * 
 * @param inputs - Class values to be merged (strings, objects, arrays)
 * @returns A single string with optimized Tailwind classes
 * 
 * @example
 * ```typescript
 * // Basic usage
 * cn('px-4', 'py-2', 'bg-blue-500') // => 'px-4 py-2 bg-blue-500'
 * 
 * // With conditional classes
 * cn('base-class', { 
 *   'active': isActive, 
 *   'disabled': isDisabled 
 * })
 * 
 * // With conflicting classes (tailwind-merge resolves)
 * cn('px-4', 'px-8') // => 'px-8' (last one wins)
 * ```
 */
export function cn(...inputs: ClassValue[]): string {
  try {
    // Validate inputs to prevent runtime errors
    if (!inputs || inputs.length === 0) {
      return '';
    }
    
    // Filter out null/undefined values for cleaner output
    const filteredInputs = inputs.filter(input => 
      input !== null && input !== undefined && input !== ''
    );
    
    // Merge classes using clsx for conditional logic, then tailwind-merge for optimization
    const mergedClasses = twMerge(clsx(filteredInputs));
    
    return mergedClasses;
  } catch (error) {
    // Fallback to basic string concatenation if clsx/twMerge fails
    console.warn('Class merging failed, using fallback:', error);
    return inputs
      .filter(input => typeof input === 'string')
      .join(' ');
  }
}

/**
 * Type guard to check if a value is a valid CSS class string
 * 
 * @param value - Value to check
 * @returns True if the value is a non-empty string
 */
export function isValidClass(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validates and sanitizes class names to prevent CSS injection
 * 
 * @param className - Class name to validate
 * @returns Sanitized class name or empty string if invalid
 */
export function sanitizeClassName(className: string): string {
  if (!isValidClass(className)) {
    return '';
  }
  
  // Remove any potentially dangerous characters
  return className
    .replace(/[^a-zA-Z0-9\s-_]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Creates a responsive class utility for consistent breakpoint usage
 * 
 * @param baseClass - Base class name
 * @param responsive - Object with breakpoint mappings
 * @returns Responsive class string
 * 
 * @example
 * ```typescript
 * responsive('text-sm', {
 *   sm: 'text-base',
 *   md: 'text-lg', 
 *   lg: 'text-xl'
 * })
 * // => 'text-sm sm:text-base md:text-lg lg:text-xl'
 * ```
 */
export function responsive(
  baseClass: string, 
  responsive: Record<string, string> = {}
): string {
  const classes = [baseClass];
  
  // Add responsive classes in standard Tailwind breakpoint order
  const breakpoints = ['sm', 'md', 'lg', 'xl', '2xl'];
  
  for (const bp of breakpoints) {
    if (responsive[bp]) {
      classes.push(`${bp}:${responsive[bp]}`);
    }
  }
  
  return classes.join(' ');
}

// Export all utilities for easy importing
export { clsx, twMerge };