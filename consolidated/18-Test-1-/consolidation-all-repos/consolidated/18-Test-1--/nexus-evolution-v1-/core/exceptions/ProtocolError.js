/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * DALEK_CAAN v3.1: Advanced Architectural Siphon Engine
 * Copyright (c) 2026 craighckby-stack
 * 
 * This project incorporates architectural DNA siphoned from:
 * - DeepMind/AlphaCode, Google/Genkit, Firebase/Lifecycle, Meta/React-Core,
 *   OpenAI/Triton, Anthropic/Constitutional-AI, microsoft/TypeScript, etc.
 */

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