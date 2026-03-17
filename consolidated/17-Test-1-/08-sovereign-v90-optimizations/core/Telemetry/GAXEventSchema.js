/**
 * Telemetry Event Schema Definition (v94.1 AGI Enhancement).
 * Defines the required structure, types, and constraints for core GAX event payloads.
 * This structure supports runtime validation to ensure data consistency and quality.
 */

/**
 * Recursively builds the flat event registry from the hierarchical map.
 * Enforces the NAMESPACE:SUBDOMAIN:ACTION format and freezes resulting objects.
 * This function handles the synchronous data transformation.
 * @param {Object} map - The hierarchical definition map.
 * @param {string} [prefix=''] - The current key prefix.
 * @param {Object} registry - The resulting flat registry object.
 * @returns {Object}
 */
function _buildFlatRegistry(map, prefix = '', registry = {}) {
    for (const key in map) {
        if (!Object.prototype.hasOwnProperty.call(map, key)) continue;

        const currentKey = prefix ? `${prefix}:${key}` : key;
        const value = map[key];

        // An action node must contain 'schema' and 'description'
        if (value && typeof value === 'object' && value.schema && value.description) {
            // Enforce N:S:A structure for final action key (exactly 3 components)
            if (currentKey.split(':').length !== 3) {
                 throw new Error(`[GAX Schema Setup Error] Event key must adhere to NAMESPACE:SUBDOMAIN:ACTION format. Invalid key: ${currentKey}`);
            }
            registry[currentKey] = value;
        } else if (value && typeof value === 'object') {
            // Recurse for Namespace or Subdomain node
            _buildFlatRegistry(value, currentKey, registry);
        } else {
            // Structural error in definition
            throw new Error(`[GAX Schema Setup Error] Invalid structure detected at key: ${currentKey}`);
        }
    }
    return registry;
}


/**
 * Defines the RAW_EVENT_MAP structure, including all reusable schema constants
 * needed for validation definitions.
 * @returns {Object} The immutable hierarchical event map.
 */
function _defineRawEventMap() {
    // --- Reusable Schema Field Definitions (Constants) ---
    const RequiredString = Object.freeze({ type: 'string', required: true });
    const RequiredNumber = Object.freeze({ type: 'number', required: true });
    const OptionalBoolean = Object.freeze({ type: 'boolean', required: false });

    const Formats = Object.freeze({
        VERSION: Object.freeze({ ...RequiredString, pattern: /^v[0-9]+\.[0-9]+(\.[0-9]+)?$/ }),
        UUID: Object.freeze({ ...RequiredString, format: 'uuid' }),
        SHA256: Object.freeze({ ...RequiredString, format: 'sha256' }),
        
        /** Creates a schema definition for a SHA1 hash field. */
        SHA1: (required = true) => Object.freeze({ type: 'string', required: required, format: 'sha1' }),
    });
    // ---------------------------------------------------

    // Declarative, hierarchical definition of all core GAX telemetry events.
    // Structure enforces: NAMESPACE:SUBDOMAIN:ACTION
    const RAW_EVENT_MAP = Object.freeze({
        // System Lifecycle Events
        SYS: Object.freeze({
            INIT: Object.freeze({
                START: Object.freeze({
                    description: 'Records system version and entry parameters at startup.',
                    schema: Object.freeze({
                        version: Formats.VERSION,
                        executionId: Formats.UUID,
                        startupMode: Object.freeze({
                            ...RequiredString,
                            enum: ['standard', 'recovery', 'test', 'maintenance']
                        })
                    })
                })
            }),
        }),
        
        // Policy Verification Events
        PV: Object.freeze({
            REQUEST: Object.freeze({
                INITIATED: Object.freeze({
                    description: 'Records the beginning of a formal policy verification request.',
                    schema: Object.freeze({
                        policyType: Object.freeze({
                            ...RequiredString,
                            enum: ['security', 'compliance', 'resource']
                        }),
                        componentId: RequiredString,
                        contextHash: Formats.SHA256,
                        requestDataSize: Object.freeze({ type: 'number', required: false, min: 0 })
                    })
                })
            }),
        }),
        
        // Autonomous Evolution Events
        AXIOM: Object.freeze({
            CODE: Object.freeze({
                COMMITTED: Object.freeze({
                    description: 'Logs successful commit of autonomously generated or evolved code.',
                    schema: Object.freeze({
                        targetFile: RequiredString,
                        commitHash: Formats.SHA1(true),
                        diffSize: Object.freeze({ ...RequiredNumber, min: 1 }),
                        evolutionaryObjective: RequiredString,
                        previousHash: Formats.SHA1(false) 
                    })
                })
            }),
        }),
        
        // Diagnostic Events
        DIAG: Object.freeze({
            COMPONENT: Object.freeze({
                FATAL_ERROR: Object.freeze({
                    description: 'Reports a critical, system-halting error within a component.',
                    schema: Object.freeze({
                        componentName: RequiredString,
                        errorCode: RequiredString,
                        errorMessage: RequiredString,
                        stackTrace: Object.freeze({ ...RequiredString, allowEmpty: true }),
                        isRetryable: OptionalBoolean
                    })
                })
            })
        })
    });

    return RAW_EVENT_MAP;
}

// --- Module Export Initialization ---

/**
 * The final, canonical, and immutable telemetry event schema.
 * Generated programmatically from the RAW_EVENT_MAP.
 */
const GAXEventSchema = Object.freeze(
    _buildFlatRegistry(_defineRawEventMap())
);

module.exports = GAXEventSchema;