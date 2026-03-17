// utils.ts

/**
 * Utility Functions
 * 
 * Location: {project_path}/skills/frontend-design/examples/typescript/utils.ts
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with proper precedence
 * Combines clsx and tailwind-merge for optimal class handling
 * 
 * @param inputs - Class values to merge
 * @returns Merged class string
 * 
 * @example
 * cn('px-4 py-2', 'px-6') // => 'py-2 px-6' (px-6 overwrites px-4)
 * cn('text-red-500', condition && 'text-blue-500') // => conditional classes
 */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

/**
 * Format file size in human-readable format
 * 
 * @param bytes - File size in bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string (e.g., "1.5 MB")
 */
export const formatFileSize = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = Math.max(decimals, 0);
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(dm)} ${sizes[i]}`;
};

/**
 * Debounce function to limit execution rate
 * 
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function to limit execution frequency
 * 
 * @param func - Function to throttle
 * @param limit - Time limit in milliseconds
 * @returns Throttled function
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void => {
  let inThrottle: boolean = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Generate a random ID
 * 
 * @param length - Length of the ID (default: 8)
 * @returns Random ID string
 */
export const generateId = (length: number = 8): string =>
  Math.random().toString(36).slice(2, 2 + length);

/**
 * Check if code is running in browser
 */
export const isBrowser = typeof window !== 'undefined';

/**
 * Safely access localStorage
 */
export const storage = {
  get: (key: string): string | null => {
    if (!isBrowser) return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set: (key: string, value: string): void => {
    if (!isBrowser) return;
    try {
      localStorage.setItem(key, value);
    } catch {
      // Handle quota exceeded or other errors
    }
  },
  remove: (key: string): void => {
    if (!isBrowser) return;
    try {
      localStorage.removeItem(key);
    } catch {
      // Handle errors
    }
  },
};

/**
 * Copy text to clipboard
 * 
 * @param text - Text to copy
 * @returns Promise<boolean> - Success status
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  if (!isBrowser) return false;

  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    }
  } catch {
    return false;
  }
};

/**
 * Format date in relative time (e.g., "2 hours ago")
 * 
 * @param date - Date to format
 * @returns Formatted relative time string
 */
export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  return `${Math.floor(diffInSeconds / 31536000)}y ago`;
};

/**
 * Truncate text with ellipsis
 * 
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
export const truncate = (text: string, maxLength: number): string =>
  text.length <= maxLength ? text : text.slice(0, maxLength - 3) + '...';

/**
 * Sleep/delay function
 * 
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after delay
 */
export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Clamp a number between min and max
 * 
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean =>
  isBrowser && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Check if user prefers dark mode
 */
export const prefersDarkMode = (): boolean =>
  isBrowser && window.matchMedia('(prefers-color-scheme: dark)').matches;

/**
 * Format number with commas
 * 
 * @param num - Number to format
 * @returns Formatted number string
 * 
 * @example
 * formatNumber(1000) // => "1,000"
 * formatNumber(1000000) // => "1,000,000"
 */
export const formatNumber = (num: number): string =>
  num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/**
 * Abbreviate large numbers
 * 
 * @param num - Number to abbreviate
 * @returns Abbreviated number string
 * 
 * @example
 * abbreviateNumber(1000) // => "1K"
 * abbreviateNumber(1000000) // => "1M"
 * abbreviateNumber(1500000) // => "1.5M"
 */
export const abbreviateNumber = (num: number): string => {
  if (num < 1000) return num.toString();
  if (num < 1000000) return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  if (num < 1000000000) return `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  return `${(num / 1000000000).toFixed(1).replace(/\.0$/, '')}B`;
};

/**
 * Get initials from name
 * 
 * @param name - Full name
 * @param maxLength - Maximum number of initials (default: 2)
 * @returns Initials string
 * 
 * @example
 * getInitials("John Doe") // => "JD"
 * getInitials("Mary Jane Watson") // => "MJ"
 */
export const getInitials = (name: string, maxLength: number = 2): string =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, maxLength);

/**
 * Validate email format
 * 
 * @param email - Email to validate
 * @returns True if valid email format
 */
export const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/**
 * Validate URL format
 * 
 * @param url - URL to validate
 * @returns True if valid URL format
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Remove HTML tags from string
 * 
 * @param html - HTML string
 * @returns Plain text
 */
export const stripHtml = (html: string): string => {
  if (!isBrowser) return html;
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

/**
 * Capitalize first letter of string
 * 
 * @param str - String to capitalize
 * @returns Capitalized string
 */
export const capitalize = (str: string): string =>
  str.charAt(0).toUpperCase() + str.slice(1);

/**
 * Convert camelCase to kebab-case
 * 
 * @param str - camelCase string
 * @returns kebab-case string
 */
export const camelToKebab = (str: string): string =>
  str.replace(/([A-Z])/g, '-$1').toLowerCase();

/**
 * Convert kebab-case to camelCase
 * 
 * @param str - kebab-case string
 * @returns camelCase string
 */
export const kebabToCamel = (str: string): string =>
  str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());