/**
 * @typedef {object} ErrorDefinition
 * @property {string} code - The standardized error code (E_...).
 * @property {string} category - Classification (e.g., 'Validation', 'System', 'Network').
 * @property {number} httpStatus - Recommended HTTP status code (if API exposed).
 * @property {string} templateMessage - A default or template human-readable message.
 */

/**
 * Central repository for all defined system errors.
 * This registry enables centralized management of codes, categories, and default messages,
 * allowing derived errors to potentially be generated purely from this map using a Factory pattern
 * or BaseCustomError improvements, significantly reducing class boilerplate.
 * @type {Record<string, ErrorDefinition>}
 */
const ERROR_REGISTRY = {
    // Example mapping
    E_INVALID_ARTIFACT: {
        code: 'E_INVALID_ARTIFACT',
        category: 'Validation',
        httpStatus: 400,
        templateMessage: 'The provided artifact structure is invalid or missing required components.'
    },
    // ... other error definitions (E_NETWORK_TIMEOUT, E_UNAUTHORIZED, etc.)
};

module.exports = { ERROR_REGISTRY };