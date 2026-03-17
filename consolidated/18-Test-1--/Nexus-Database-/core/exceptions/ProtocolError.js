/**
 * core/exceptions/ProtocolError.js
 * 
 * Custom error class for failures related to adherence to the Sovereign Manifest Protocol 
 * or core architectural contracts (e.g., required input compliance).
 */
class ProtocolError extends Error {
    constructor(message, context = {}) {
        super(message);
        this.name = 'ProtocolError';
        this.statusCode = 500; // Internal Protocol Failure
        this.context = context;
        Error.captureStackTrace(this, ProtocolError);
    }
}

module.exports = ProtocolError;