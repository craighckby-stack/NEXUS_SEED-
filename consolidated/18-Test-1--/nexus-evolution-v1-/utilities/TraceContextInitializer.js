import { randomUUID } from 'crypto';

/**
 * TEDS Trace Context Manager (Optimized Functional Abstraction)
 * Manages the generation and propagation of the mandatory 'trace_id' for TEDS.
 */

/**
 * CORE_PRIMITIVE: Generates a new, globally unique execution trace ID (UUIDv4).
 * Uses the highly optimized Node.js built-in `crypto.randomUUID()` (C++ bindings).
 * This serves as the atomic, foundational operation.
 * @returns {string} Canonical UUID v4 string (36 characters).
 */
const generateTraceId = randomUUID;

/**
 * RECURSIVE_ABSTRACTION: Initializes or validates the trace context for a new execution cycle.
 * It prioritizes using a valid incoming context ID to maintain flow continuity, or falls back 
 * entirely upon the core generation primitive.
 * @param {string | null} incomingId - Optional ID inherited from external source.
 * @returns {string} The verified or newly generated trace ID.
 */
const getOrInitializeContext = (incomingId = null) => {
    // Maximum computational efficiency achieved by using simple type/length checks over regex.
    // Canonical UUID v4 length (32 hex characters + 4 hyphens) is 36.
    if (incomingId && typeof incomingId === 'string' && incomingId.length === 36) {
        // Note: Full content validation (regex) is computationally expensive and delegated 
        // downstream to the logger utility, maximizing runtime speed here.
        return incomingId;
    }
    
    // Fallback relies entirely on the CORE_PRIMITIVE, ensuring self-sufficiency.
    return generateTraceId();
};

export {
    generateTraceId,
    getOrInitializeContext
};

export default getOrInitializeContext;