/**
 * Application Constants
 */

export const APP_NAME = 'Dalek Linear Evolution';
export const APP_VERSION = '18.0.0';
export const APP_DESCRIPTION = 'Autonomous code evolution system powered by AI';

export const REPO_CONFIG = {
  owner: 'craighckby-stack',
  name: 'ai-scaffold',
  defaultBranch: 'main',
};

export const EVOLUTION_CONFIG = {
  defaultCycles: 5,
  maxCycles: 20,
  minCycles: 1,
  branchPrefix: 'linear-evolution-',
};

export const API_ENDPOINTS = {
  github: 'https://api.github.com',
  gemini: 'https://generativelanguage.googleapis.com',
};

export const STORAGE_KEYS = {
  githubToken: 'gh_token',
  geminiKey: 'gemini_key',
  evolutionHistory: 'evolution_history',
};

export const FILE_PATTERNS = {
  include: [/\.(js|jsx|ts|tsx|py|md|css|html|json)$/],
  exclude: [/node_modules/, /dist/, /build/, /.next/, /__MACOSX/],
};

export const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  SUCCESS: 'success',
};
