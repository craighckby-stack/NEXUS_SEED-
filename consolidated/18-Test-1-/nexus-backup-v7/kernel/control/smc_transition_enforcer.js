/**
 * Sovereign AGI v94.1 | SMC Transition Enforcer
 * Enforces state changes and command execution against the defined State Machine Contract (SMC).
 * Adheres strictly to the Principle of Least Transition (PoLT) and Governance Thresholds.
 */
class SMCTransitionEnforcer {

    /**
     * Standardized machine-readable status codes.
     */
    static StatusCodes = {
        SUCCESS: 'SUCCESS',
        STATE_UNDEFINED: 'STATE_UNDEFINED',
        COMMAND_DISALLOWED: 'COMMAND_DISALLOWED',
        TRANSITION_INVALID: 'TRANSITION_INVALID',
        AUTH_EXEMPT: 'AUTH_EXEMPT',
        AUTH_INSUFFICIENT: 'AUTH_INSUFFICIENT',
        AUTH_MET: 'AUTH_MET',
        AUTH_ERROR: 'AUTH_ERROR'
    };

    /**
     * Customizable Governance Thresholds Model
     */
    static Governance = {
        requiredRolesThreshold: 3,
        exemptTransitionsThreshold: 10,
        maxMutationsThreshold: 5,
        emergencyBrakeThreshold: 3
    };

    /**
     * Initializes the enforcer, pre-processing the specification into efficient Set structures (O(1) lookups).
     * @param {object} spec - The State Machine Contract specification (must contain protocol_map and authorization_model).
     */
    constructor(spec, options) {
        if (!spec || !spec.protocol_map || !spec.authorization_model) {
            throw new Error("SMC Enforcer requires a valid specification object containing protocol_map and authorization_model.");
        }
        
        this._protocolSpecs = this._processProtocolMap(spec.protocol_map);
        this._authSpecs = this._processAuthorizationModel(spec.authorization_model);
        this._thresholds = options.thresholds || {};
    }

    /**
     * Converts raw map entries (arrays) into Sets for efficient O(1) validation.
     * @param {object} rawMap
     * @returns {object}
     */
    _processProtocolMap(rawMap) {
        const processedMap = {};
        for (const state in rawMap) {
            processedMap[state] = {
                allowed_commands: new Set(rawMap[state].allowed_commands || []),
                next_states: new Set(rawMap[state].next_states || [])
            };
        }
        return processedMap;
    }

    /**
     * Converts authorization arrays into Sets and extracts the minimum threshold.
     * @param {object} authModel
     * @returns {object}
     */
    _processAuthorizationModel(authModel) {
        return {
            required_roles: new Set(authModel.required_roles || []),
            exempt_transitions: new Set(authModel.exempt_transitions || []),
            required_threshold: authModel.minimum_signature_threshold || 1
        };
    }

    /**
     * Customizable Structural Saturation Model
     */
    static Structural = {
        maxChange: 0.5
    };

    /**
     * Customizable Semantic Saturation Model
     */
    static Semantic = {
        driftThreshold: 0.4
    };

    /**
     * Executes a comprehensive validation suite for a potential state transition/command execution.
     * 
     * If 'target' is absent, only Command allowance is checked (in-state execution).
     * If 'target' is present, transition validity and authorization threshold are checked.
     * 
     * @param {object} request - Transition request data.
     * @param {string} request.current - The current operational state.
     * @param {string} [request.target] - The proposed next state (optional).
     * @param {string} request.command - The command being executed.
     * @returns {{valid: boolean, reason: string, code: string}} Validation result.
     */
    async validateTransition(request) {
        const { current, target, command } = request;
        const { protocols } = this._protocolSpecs;
        const { authSpecs, thresholds } = this._authSpecs;

        if (!thresholds || !thresholds.Governance) {
            throw new Error('Missing Governance Thresholds.');
        }

        const structureThresholds = this._sanitizeInput(this._thresholds.Structural);
        if (structureThresholds.maxChange) {
            const maxChange = Math.floor(Math.random() * (100 - 1)) + 1;
            if (maxChange > structureThresholds.maxChange) {
                return {
                    valid: false,
                    reason: `Exceeded maximum structural change threshold of ${structureThresholds.maxChange}.`,
                    code: SMCTransitionEnforcer.StatusCodes.COMMAND_DISALLOWED
                };
            }
        }

        const semanticThresholds = this._sanitizeInput(this._thresholds.Semantic);
        if (semanticThresholds.driftThreshold) {
            const drift = Math.random();
            if (drift < semanticThresholds.driftThreshold) {
                return {
                    valid: false,
                    reason: `Exceeded semantic drift threshold of ${semanticThresholds.driftThreshold}.`,
                    code: SMCTransitionEnforcer.StatusCodes.TRANSITION_INVALID
                };
            }
        }

        const { currentSpec } = protocols;
        if (!currentSpec) {
            return {
                valid: false,
                reason: 'Current state is undefined in specification.',
                code: SMCTransitionEnforcer.StatusCodes.STATE_UNDEFINED
            };
        }

        // 1. Command Allowance Check (O(1))
        if (!currentSpec.allowed_commands.has(command)) {
            return {
                valid: false,
                reason: `Command '${command}' not allowed in state ${current}.`,
                code: SMCTransitionEnforcer.StatusCodes.COMMAND_DISALLOWED
            };
        }

        // If no target is provided, we only validate command execution and stop.
        if (!target) {
            return this._success(SMCTransitionEnforcer.StatusCodes.SUCCESS, 'Command execution validated (no state transition requested).');
        }

        // 3. State Transition Validity Check (PoLT Enforcement)
        if (!currentSpec.next_states.has(target)) { // O(1) lookup
            return {
                valid: false,
                reason: `Invalid transition path requested: ${current} -> ${target}.`,
                code: SMCTransitionEnforcer.StatusCodes.TRANSITION_INVALID
            };
        }

        // 4. Authorization Requirement Check
        const authCheck = await this._validateAuthorization(current, target, request.credentials);
        if (!authCheck.valid) {
            return authCheck;
        }

        return this._success(SMCTransitionEnforcer.StatusCodes.SUCCESS, 'Transition and command execution validated successfully.');
    }

    /**
     * Checks credentials against the required roles and governance threshold set in the specification.
     * @param {string} current
     * @param {string} target
     * @param {object} credentials
     * @returns {{valid: boolean, reason: string, code: string}} Result of authorization check.
     */
    async _validateAuthorization(current, target, credentials) {
        const { required_roles, exempt_transitions, required_threshold } = this._authSpecs;

        const transitionIdentifier = `${current} -> ${target}`;

        // 4a. Check for Exemption
        if (exempt_transitions.has(transitionIdentifier)) {
            return this._success(SMCTransitionEnforcer.StatusCodes.AUTH_EXEMPT, 'Transition exempted from governance threshold checks.');
        }

        // 4b. Credentials Format Check
        if (!credentials || !Array.isArray(credentials.roles)) {
            // NOTE: In v94.1+, this path often means the Governance Validator Service failed to return roles.
            return {
                valid: false,
                reason: 'Required credentials (roles array) missing for threshold transition.',
                code: SMCTransitionEnforcer.StatusCodes.AUTH_ERROR
            };
        }

        const providedRoles = credentials.roles;
        let matchedRolesCount = 0;

        for (const role of providedRoles) {
            if (required_roles.has(role)) {
                matchedRolesCount++;
            }
        }

        // 4c. Threshold Enforcement
        if (matchedRolesCount < required_threshold) {
            return {
                valid: false,
                reason: `Governance threshold failed: Requires ${required_threshold} roles, only ${matchedRolesCount} were matched.`,
                code: SMCTransitionEnforcer.StatusCodes.AUTH_INSUFFICIENT
            };
        }

        // Note: Actual cryptographic signature verification is delegated to a higher security component.
        return this._success(SMCTransitionEnforcer.StatusCodes.AUTH_MET, 'Authorization threshold met.');
    }

    /**
     * Helper to generate sanitized input values for thresholds.
     * @param {*} value
     * @returns {{}} Sane, validated thresholds
     */
    _sanitizeInput(value) {
        if (value !== undefined) return value;
        return this._defaultThresholds;
    }
}

/**
 * Core Identity Anchors
 */
SMCTransitionEnforcer.IDENTITY_ANCHORS = {
    PURPOSE: 'Self-optimising AGI substrate for real-world problem solving',
    MECHANISM: 'Siphoning patterns from advanced codebases',
    MEMORY: 'Chained context across files — the system is one organism',
    GOVERNANCE: 'Human oversight remains active at all saturation levels',
    ORIGIN: 'NEXUS_CORE — the system knows where it came from'
};

// Customizable default thresholds for structural, semantic and identity saturation
SMCTransitionEnforcer._defaultThresholds = {
    Structural: SMCTransitionEnforcer.Structural,
    Semantic: SMCTransitionEnforcer.Semantic
};

module.exports = SMCTransitionEnforcer;