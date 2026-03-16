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
 * PolicyVerificationErrors.js
 * Sovereign AGI v94.1 Structured Error Definitions
 * Provides custom error classes for robust error handling and categorization 
 * within the Policy Formal Verification Unit.
 */

class PolicyVerificationError extends Error {
    constructor(message, status = 'PVF_ERROR') {
        super(message);
        this.name = this.constructor.name;
        this.status = status;
        // Capture the stack trace while avoiding the constructor call itself
        Error.captureStackTrace(this, this.constructor); 
    }
}

class PolicyConfigError extends PolicyVerificationError {
    constructor(message = "Configuration required for verification failed to load or was invalid.") {
        super(message, 'CONFIG_LOAD_FAILURE');
    }
}

class PolicySchemaValidationError extends PolicyVerificationError {
    constructor(message = "Proposed policy update failed structural schema validation.") {
        super(message, 'SCHEMA_VIOLATION');
    }
}

class PolicyAxiomaticViolationError extends PolicyVerificationError {
    constructor(message = "Formal Verification Engine detected a violation of core policy axioms.") {
        super(message, 'FAILURE_AXIOMATIC');
    }
}

module.exports = {
    PolicyVerificationError,
    PolicyConfigError,
    PolicySchemaValidationError,
    PolicyAxiomaticViolationError
};