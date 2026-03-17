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
 * @interface IDataSourceHandler
 * Defines the necessary contract for all concrete data source strategy handlers 
 * (e.g., API, Database, Message Bus).
 * 
 * Handlers must ensure connection management, strategy execution, and result normalization.
 */
class IDataSourceHandler {
    
    /**
     * Executes the specific data interaction strategy.
     * @param {Object} context - Execution context data (e.g., query details, payload, connection info).
     * @returns {Promise<Object>} The normalized result data object.
     */
    async execute(context) {
        throw new Error("Method 'execute(context)' must be implemented by the concrete handler class.");
    }

    /**
     * Optional teardown method for closing persistent connections or cleaning resources.
     */
    async teardown() {
        // Default implementation is a no-op, allowing handlers to ignore if cleanup is not necessary.
    }
}

export { IDataSourceHandler };