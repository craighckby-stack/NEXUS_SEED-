/**
 * Type Definitions
 * For JSDoc/TypeScript-like documentation in JavaScript
 */

/**
 * @typedef {Object} LogEntry
 * @property {string} id - Unique identifier
 * @property {string} msg - Log message
 * @property {string} type - Log type (info, warning, error, success)
 * @property {string} time - Timestamp
 */

/**
 * @typedef {Object} EvolutionCycle
 * @property {number} cycle - Cycle number
 * @property {string} branch - Branch name
 * @property {string} meta - Metadata
 * @property {Object} timestamp - Firestore timestamp
 */

/**
 * @typedef {Object} GitHubFile
 * @property {string} path - File path
 * @property {string} sha - File SHA
 * @property {string} content - File content (base64)
 * @property {number} size - File size in bytes
 */

/**
 * @typedef {Object} GitHubRef
 * @property {string} ref - Full ref name
 * @property {string} sha - Commit SHA
 * @property {Object} object - Ref object with type and SHA
 */

/**
 * @typedef {Object} GitHubTree
 * @property {string} sha - Tree SHA
 * @property {string} url - Tree URL
 * @property {Array<GitHubTreeItem>} tree - Tree items
 */

/**
 * @typedef {Object} GitHubTreeItem
 * @property {string} path - Item path
 * @property {string} mode - File mode
 * @property {string} type - Item type (tree, blob)
 * @property {string} sha - Item SHA
 * @property {number} size - Item size (blob only)
 */
