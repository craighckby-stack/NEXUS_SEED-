/**
 * Sovereign AGI v94.1 | SMC Transition Enforcer
 * Enforces state changes and command execution against the defined State Machine Contract (SMC).
 * Adheres strictly to the Principle of Least Transition (PoLT) and Governance Thresholds.
 */

// Assuming RoleThresholdScorer plugin is globally available after initialization
declare const RoleThresholdScorer: {
    execute: (
        args: {
            requiredRolesSet: Set<string>;
            providedRoles: string[];
            requiredThreshold: number;
        }
    ) => {
        score: number;
        required: number;
        met: boolean;
        error?: string;
    };
};

// Assuming GovernanceThresholdManager plugin is globally available after initialization
declare const GovernanceThresholdManager: {
    new (): {
        loadModel(authModel: any): void;
        isTransitionExempt(transitionIdentifier: string): boolean;
        scoreCredentials(
            providedRoles: string[] | null
        ): { score: number; required: number; met: boolean; error?: string };
    };
};

/**
 * Internal implementation class enforcing strict architectural separation.
 */
class SMCTransitionEnforcerKernel {
    #protocolSpecs: Record<
        string,
        { allowed_commands: Set<string>; next_states: Set<string> }
    >;
    #authManager: GovernanceThresholdManager | null = null;

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
        AUTH_ERROR: 'AUTH_ERROR',
    };

    /**
     * Initializes the enforcer, pre-processing the specification into efficient Set structures (O(1) lookups).
     * @param {object} spec - The State Machine Contract specification (must contain protocol_map and authorization_model).
     */
    constructor(spec: any) {
        // 1. Setup Dependencies and Validate Configuration
        if (!spec || !spec.protocol_map || !spec.authorization_model) {
            this.#throwSetupError(
                "SMC Enforcer requires a valid specification object containing protocol_map and authorization_model."
            );
        }

        this.#protocolSpecs = this.#processProtocolMap(spec.protocol_map);

        // 2. Delegate Authorization Manager Setup
        this.#setupAuthorizationManager(spec.authorization_model);
    }

    /**
     * Private I/O Proxy: Handles synchronous dependency instantiation and model loading.
     * Satisfies the synchronous setup extraction goal for external dependency initialization.
     */
    #setupAuthorizationManager(authModel: any) {
        try {
            // Proxy for dependency instantiation
            this.#authManager = this.#delegateToAuthManagerInstantiation();
            // Proxy for external dependency method call
            this.#delegateToAuthManagerModelLoad(authModel);
        } catch (e) {
            this.#throwSetupError(
                `Failed to initialize GovernanceThresholdManager: ${e.message}`
            );
        }
    }

    /** Private I/O Proxy: Handles dependency instantiation. */
    #delegateToAuthManagerInstantiation(): GovernanceThresholdManager {
        return new GovernanceThresholdManager();
    }

    /** Private I/O Proxy: Handles dependency model loading. */
    #delegateToAuthManagerModelLoad(authModel: any): void {
        if (this.#authManager) {
            this.#authManager.loadModel(authModel);
        }
    }

    /** Private I/O Proxy: Throws critical setup errors. */
    #throwSetupError(message: string): never {
        throw new Error(message);
    }

    /**
     * Converts raw map entries (arrays) into Sets for efficient O(1) validation.
     * @param {object} rawMap
     * @returns {object}
     */
    private #processProtocolMap(rawMap: any): Record<
        string,
        { allowed_commands: Set<string>; next_states: Set<string> }
    > {
        const processedMap: Record<
            string,
            { allowed_commands: Set<string>; next_states: Set<string> }
        > = {};
        for (const state in rawMap) {
            processedMap[state] = {
                allowed_commands: new Set(rawMap[state].allowed_commands || []),
                next_states: new Set(rawMap[state].next_states || []),
            };
        }
        return processedMap;
    }

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
     * @param {object} [request.credentials] - Authorization credentials/signatures (must include 'roles' array).
     * @returns {{valid: boolean, reason: string, code: string}} Validation result.
     */
    validateTransition(
        request: {
            current: string;
            target?: string;
            command: string;
            credentials?: any;
        }
    ): { valid: boolean; reason: string; code: string } {
        const { current, target, command, credentials } = request;
        const { StatusCodes } = SMCTransitionEnforcerKernel;

        // 1. State Existence Check
        const currentSpec = this.#protocolSpecs[current];
        if (!currentSpec) {
            return this.#fail(
                StatusCodes.STATE_UNDEFINED,
                `Current state '${current}' is undefined in specification.`
            );
        }

        // 2. Command Allowance Check (O(1))
        if (!currentSpec.allowed_commands.has(command)) {
            return this.#fail(
                StatusCodes.COMMAND_DISALLOWED,
                `Command '${command}' not allowed in state ${current}.`
            );
        }

        // If no target is provided, we only validate command execution and stop.
        if (!target) {
            return this.#success(
                StatusCodes.SUCCESS,
                "Command execution validated (no state transition requested)."
            );
        }

        // 3. State Transition Validity Check (PoLT Enforcement)
        if (!currentSpec.next_states.has(target)) { // O(1) lookup
            return this.#fail(
                StatusCodes.TRANSITION_INVALID,
                `Invalid transition path requested: ${current} -> ${target}.`
            );
        }

        // 4. Authorization Requirement Check
        const authCheck = this.#validateAuthorization(current, target, credentials);
        if (!authCheck.valid) {
            return authCheck;
        }

        return this.#success(
            StatusCodes.SUCCESS,
            "Transition and command execution validated successfully."
        );
    }

    /**
     * Checks credentials against the required roles and governance threshold set in the specification.
     * @param {string} current
     * @param {string} target
     * @param {object} credentials
     * @returns {{valid: boolean, reason: string, code: string}} Result of authorization check.
     */
    private #validateAuthorization(
        current: string,
        target: string,
        credentials: any
    ): { valid: boolean; reason: string; code: string } {
        const { StatusCodes } = SMCTransitionEnforcerKernel;

        const transitionIdentifier = `${current} -> ${target}`;

        // 4a. Check for Exemption (PROXY)
        if (this.#delegateToAuthExemptionCheck(transitionIdentifier)) {
            return this.#success(
                StatusCodes.AUTH_EXEMPT,
                "Transition exempted from governance threshold checks."
            );
        }

        const providedRoles = credentials ? credentials.roles : null;

        // 4b/4c. Threshold Enforcement using the plugin (PROXY)
        const scoringResult = this.#delegateToAuthScoring(providedRoles);

        if (scoringResult.error) {
            return this.#fail(
                StatusCodes.AUTH_ERROR,
                `Authorization Check Failed: ${scoringResult.error}`
            );
        }

        if (!scoringResult.met) {
            return this.#fail(
                StatusCodes.AUTH_INSUFFICIENT,
                `Governance threshold failed: Requires ${scoringResult.required}, only ${scoringResult.score} matched.`
            );
        }

        // Note: Actual cryptographic signature verification is delegated to a higher security component.
        return this.#success(StatusCodes.AUTH_MET, "Authorization threshold met.");
    }

    /**
     * Private I/O Proxy: Delegates to GovernanceThresholdManager to check for transition exemptions.
     */
    #delegateToAuthExemptionCheck(transitionIdentifier: string): boolean {
        return this.#authManager?.isTransitionExempt(transitionIdentifier) ?? false;
    }

    /**
     * Private I/O Proxy: Delegates to GovernanceThresholdManager to score credentials.
     */
    #delegateToAuthScoring(
        providedRoles: string[] | null
    ): { score: number; required: number; met: boolean; error?: string } {
        if (!this.#authManager) {
            return { score: 0, required: 1, met: false, error: "Auth Manager not initialized." };
        }
        return this.#authManager.scoreCredentials(providedRoles);
    }

    /**
     * Helper to generate standardized success responses.
     * @param {string} code
     * @param {string} reason
     * @returns {{valid: boolean, reason: string, code: string}}
     */
    private #success(code: string, reason: string) {
        return { valid: true, reason, code };
    }

    /**
     * Helper to generate standardized failure responses.
     * @param {string} code
     * @param {string} reason
     * @returns {{valid: boolean, reason: string, code: string}}
     */
    private #fail(code: string, reason: string) {
        return { valid: false, reason, code };
    }
}

// Preserve original external interface
const SMCTransitionEnforcer = SMCTransitionEnforcerKernel;
