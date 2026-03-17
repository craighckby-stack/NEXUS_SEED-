// core/Telemetry/GAXEventRegistry.js

/**
 * Helper to construct the standardized event name: NAMESPACE:SUBDOMAIN:ACTION
 * @param {string} namespace 
 * @param {string} subdomain 
 * @param {string} action 
 * @returns {string}
 */
const _createEvent = (namespace, subdomain, action) => 
    `${namespace}:${subdomain}:${action}`;

/**
 * Defines the hierarchical map defining all GAX Telemetry Events.
 * Structure: NAMESPACE -> SUBDOMAIN -> [ACTIONS]
 * 
 * This map is frozen to guarantee the immutability of the core event contract definitions.
 * @returns {Object}
 */
const _defineRawEventMap = () => Object.freeze({
    // System Lifecycle (SYS)
    SYS: {
        INIT: ['START', 'COMPLETE'],
        EXECUTION: ['START', 'END'],
        SHUTDOWN: ['IMMINENT'],
    },
    // Policy & Verification (PV)
    PV: {
        REQUEST: ['INITIATED'],
        RULE: ['CHECK_SUCCESS', 'CHECK_FAILURE'],
        ACCESS: ['DENIED'],
    },
    // Autonomous Evolution (AXIOM)
    AXIOM: {
        GENERATION: ['START'],
        EVOLUTION: ['STEP_PERFORMED'],
        CODE: ['COMMITTED', 'REVERTED'],
        TEST: ['RUN_SUCCESS', 'RUN_FAILURE'],
    },
    // Planning and Context Management (PLAN)
    PLAN: {
        GOAL: ['DEFINED'],
        STEP: ['GENERATED', 'COMPLETED'],
        CONTEXT: ['RETRIEVAL_START', 'RETRIEVAL_COMPLETE'],
    },
    // External API Interaction (API)
    API: {
        EXTERNAL: ['REQUEST_SENT', 'RESPONSE_RECEIVED', 'RATE_LIMIT_HIT'],
    },
    // Data/Context Storage (DATA)
    DATA: {
        CACHE: ['HIT', 'MISS'],
        STORAGE: ['WRITE_FAILURE'],
    },
    // System Diagnostics, Errors, and Warnings (DIAG)
    DIAG: {
        CONFIGURATION: ['FAULT'],
        CONTEXT: ['RESOLUTION_MISSING'],
        COMPONENT: ['FATAL_ERROR'],
        WARNING: ['THRESHOLD_EXCEEDED'],
    },
    // Telemetry Infrastructure (TEL)
    TEL: {
        PUBLISH: ['SUCCESS', 'FAILURE'],
        DATA: ['DROPPED'],
    },
});

/**
 * Generates the flat, standardized event registry object from the hierarchical map.
 * @param {Object} definitions 
 * @returns {Object}
 */
const _buildFlatRegistry = (definitions) => {
    const registry = {};

    for (const namespace in definitions) {
        if (Object.prototype.hasOwnProperty.call(definitions, namespace)) {
            const subdomains = definitions[namespace];
            
            for (const subdomain in subdomains) {
                if (Object.prototype.hasOwnProperty.call(subdomains, subdomain)) {
                    const actions = subdomains[subdomain];
                    
                    for (const action of actions) {
                        // Key format: NAMESPACE_SUBDOMAIN_ACTION (e.g., SYS_INIT_START)
                        const key = `${namespace}_${subdomain}_${action}`.toUpperCase();
                        // Value format: NAMESPACE:SUBDOMAIN:ACTION (e.g., SYS:INIT:START)
                        registry[key] = _createEvent(namespace, subdomain, action);
                    }
                }
            }
        }
    }
    // Freeze the final output for immutability.
    return Object.freeze(registry);
};

/**
 * Standardized Event Names for the GAX Telemetry Service (Global Autonomous X-System).
 * 
 * Structure: NAMESPACE:SUBDOMAIN:ACTION
 * Ensures consistency, machine readability, effective filtering, and standardized consumption.
 */
const GAXEventRegistry = _buildFlatRegistry(_defineRawEventMap());

module.exports = GAXEventRegistry;