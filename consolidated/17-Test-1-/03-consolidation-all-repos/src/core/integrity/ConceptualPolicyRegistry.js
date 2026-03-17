/**
 * @fileoverview ConceptualPolicyRegistry
 * A repository mapping declarative constraint types defined in concept manifests
 * to their specialized, executable validation functions (Policy Handlers).
 * 
 * NOTE: All handlers accept (constraint, context) and return a violation object (if failed) or null (if compliant).
 */

/**
 * Handler for MandatoryMarker policy. Checks if a critical marker was removed.
 * @param {Object} constraint {type: 'MandatoryMarker', marker: string, targetPath: string}
 * @param {Object} context {mutationType: string, filePath: string, contentDiff: string}
 * @returns {Object | null} Violation object or null.
 */
const mandatoryMarkerHandler = (constraint, context) => {
    if (context.mutationType === 'MODIFY' && context.filePath === constraint.targetPath) {
        // Checks for removal indication in the diff content (assuming typical diff format '-marker')
        if (context.contentDiff && typeof context.contentDiff === 'string' && context.contentDiff.includes(`-${constraint.marker}`)) {
             return {
                ruleId: constraint.id || 'MAND-001',
                detail: `Mandatory marker '${constraint.marker}' removed from critical file ${context.filePath}.`,
                severity: 'CRITICAL'
            };
        }
    }
    return null;
};

/**
 * Handler for AccessControl policy. Checks agent permissions for modification.
 * @param {Object} constraint {type: 'AccessControl', targetPrefix: string, allowedAgents: Array<string>}
 * @param {Object} context {filePath: string, agentId: string}
 * @returns {Object | null} Violation object or null.
 */
const accessControlHandler = (constraint, context) => {
    if (context.filePath.startsWith(constraint.targetPrefix)) {
        // Ensure constraint.allowedAgents is defined and includes the acting agent
        if (!constraint.allowedAgents || !constraint.allowedAgents.includes(context.agentId)) {
            return {
                ruleId: constraint.id || 'AC-002',
                detail: `Agent ${context.agentId} lacks permission to modify components prefixed by ${constraint.targetPrefix}.`,
                severity: 'MAJOR'
            };
        }
    }
    return null;
};


export const ConceptualPolicyRegistry = {
    // Register the available policy handlers:
    MandatoryMarker: mandatoryMarkerHandler,
    AccessControl: accessControlHandler,
    
    // Future expansion points for other high-level validation categories (e.g., Code Archetype, Dependency Audits, Schema Compliance):
    // 'CodeArchetype': /* handler function */,
    // 'SchemaCompliance': /* handler function */,
};
