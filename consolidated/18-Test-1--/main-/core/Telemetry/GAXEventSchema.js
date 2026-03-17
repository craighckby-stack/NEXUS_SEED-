/**
 * Telemetry Event Schema Definition (v94.1 AGI Enhancement).
 * Defines the required structure, types, and constraints for core GAX event payloads.
 * This structure supports runtime validation to ensure data consistency and quality.
 */
const GAXEventSchema = Object.freeze({
    // System Lifecycle Events
    'SYS:INIT:START': {
        description: 'Records system version and entry parameters at startup.',
        schema: {
            version: { type: 'string', required: true, pattern: /^v[0-9]+\.[0-9]+(\.[0-9]+)?$/ },
            executionId: { type: 'string', required: true, format: 'uuid' },
            startupMode: { type: 'string', required: true, enum: ['standard', 'recovery', 'test', 'maintenance'] }
        }
    },
    
    // Policy Verification Events
    'PV:REQUEST:INITIATED': {
        description: 'Records the beginning of a formal policy verification request.',
        schema: {
            policyType: { type: 'string', required: true, enum: ['security', 'compliance', 'resource'] },
            componentId: { type: 'string', required: true },
            contextHash: { type: 'string', required: true, format: 'sha256' },
            requestDataSize: { type: 'number', required: false, min: 0 }
        }
    },
    
    // Autonomous Evolution Events
    'AXIOM:CODE:COMMITTED': {
        description: 'Logs successful commit of autonomously generated or evolved code.',
        schema: {
            targetFile: { type: 'string', required: true },
            commitHash: { type: 'string', required: true, format: 'sha1' },
            diffSize: { type: 'number', required: true, min: 1 },
            evolutionaryObjective: { type: 'string', required: true },
            previousHash: { type: 'string', required: false, format: 'sha1' }
        }
    },
    
    // Diagnostic Events
    'DIAG:COMPONENT:FATAL_ERROR': {
        description: 'Reports a critical, system-halting error within a component.',
        schema: {
            componentName: { type: 'string', required: true },
            errorCode: { type: 'string', required: true },
            errorMessage: { type: 'string', required: true },
            stackTrace: { type: 'string', required: true, allowEmpty: true },
            isRetryable: { type: 'boolean', required: false }
        }
    }
});

module.exports = GAXEventSchema;