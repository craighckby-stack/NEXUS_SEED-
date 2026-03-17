/**
 * core/exceptions/ProtocolError.js
 * 
 * Custom error class for failures related to adherence to the Sovereign Manifest Protocol 
 * or core architectural contracts.
 * Inherits standardized error handling from BaseApplicationError.
 */
const BaseApplicationError = require('./BaseApplicationError');

class ProtocolError extends BaseApplicationError {
    // Enforce the error contract using static, canonical fields
    static ERROR_NAME = 'ProtocolError';
    static ERROR_PREFIX = 'AGI_PRTCL';
    static HTTP_STATUS_CODE = 500;

    /**
     * @param {string} message - Human-readable error message.
     * @param {object} [context={}] - Optional metadata relevant to the error occurrence.
     */
    constructor(message, context = {}) {
        // Protocol failures are typically Internal Server Errors (500).
        // Use the canonical static status code definition, ensuring consistency.
        super(message, ProtocolError.HTTP_STATUS_CODE, context);
    }
}

module.exports = ProtocolError;