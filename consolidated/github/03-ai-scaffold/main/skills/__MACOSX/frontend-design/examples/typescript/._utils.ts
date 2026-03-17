/**
 * Utility functions for frontend development.
 *
 * @module utils
 */

const { join } = require('path');

/**
 * Returns the path to the global CSS file.
 *
 * @returns {string} Path to global CSS file.
 */
function getGlobalsCssPath() {
  return join(process.cwd(), 'src', 'globals.css');
}

/**
 * Returns the path to the design tokens file.
 *
 * @returns {string} Path to design tokens file.
 */
function getDesignTokensPath() {
  return join(process.cwd(), 'src', 'design-tokens.ts');
}

module.exports = { getGlobalsCssPath, getDesignTokensPath };