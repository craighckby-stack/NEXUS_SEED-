// services/governance/PolicyEnforcementKernel.js

// This critical service implements the reactive measures defined in GFRM_Policy.json.

const GFRM_Policy = require('../../config/governance/GFRM_Policy.json');

/**
 * Interface definition for the Policy Threshold Matcher Tool (Simulated import)
 * @interface PolicyThresholdMatcherTool
 * @function execute
 * @param {object} args
 * @param {object} args.policyConfig The full policy structure.
 * @param {string} args.riskCategory The category key.
 * @param {number} args.score The measured score.
 * @returns {object|null} { directive, directiveKey } if violation, else null.
 */

class PolicyEnforcementKernel {
    #policy: any;
    #policyMatcher: PolicyThresholdMatcherTool;
    #systemFacade: any; // Refers to the original kernel/system API reference

    /**
     * @param {object} dependencies
     * @param {PolicyThresholdMatcherTool} dependencies.policyMatcher - The tool for evaluating thresholds.
     * @param {object} dependencies.systemFacade - Reference to the core system APIs (e.g., system, resourceManager, notifications).
     */
    constructor({ policyMatcher, systemFacade }) {
        this.#setupDependencies({ policyMatcher, systemFacade });
    }

    /**
     * Initializes internal state, loads config, and validates dependencies.
     */
    #setupDependencies({ policyMatcher, systemFacade }): void {
        // 1. Dependency Validation
        if (!policyMatcher || typeof policyMatcher.execute !== 'function') {
            this.#throwSetupError("PolicyThresholdMatcherTool is required and must implement 'execute'.");
        }
        if (!systemFacade) {
            this.#throwSetupError("System Facade reference is required for critical actions.");
        }

        // 2. State Assignment
        this.#policy = GFRM_Policy; // Load config synchronously
        this.#policyMatcher = policyMatcher;
        this.#systemFacade = systemFacade;
    }

    /**
     * Throws a fatal error during kernel setup.
     */
    #throwSetupError(message: string): never {
        throw new Error(`[PolicyEnforcementKernel Setup] Configuration Error: ${message}`);
    }

    /**
     * Evaluates a generated risk score against the policy thresholds using the dedicated tool.
     * @param {string} riskCategory - e.g., 'Existential_Drift'
     * @param {number} score - Measured risk score (0.0 - 1.0)
     */
    evaluateAndEnforce(riskCategory: string, score: number): boolean {
        const result = this.#delegateToPolicyMatcherExecute(riskCategory, score);

        if (result) {
            const { directive, directiveKey } = result;
            this.#logPolicyViolation(riskCategory, directiveKey);
            
            // Dispatch the defined action in a protected zone.
            this.#executePolicyDirective(directive);
            return true;
        }
        return false;
    }

    // I/O Proxy: Delegates execution to the external matching tool.
    #delegateToPolicyMatcherExecute(riskCategory: string, score: number): object | null {
        // Note: Assumed synchronous based on original implementation
        return this.#policyMatcher.execute({
            policyConfig: this.#policy,
            riskCategory: riskCategory,
            score: score
        });
    }

    // I/O Proxy: Logs the detection of a policy violation.
    #logPolicyViolation(riskCategory: string, directiveKey: string): void {
        console.warn(`[GFRM] Policy Violation Detected: ${riskCategory}. Executing ${directiveKey}.`);
    }

    // I/O Proxy: Executes the defined action directive against the system facade.
    #executePolicyDirective(directive: any): void {
        const action: string = directive.action || '';

        if (action.includes('Hard shutdown')) {
            this.#initiateHardStop();
        } else if (action.includes('Segmented quarantine')) {
            this.#isolateSubsystem();
        }
        
        // Notify relevant systems
        if (Array.isArray(directive.alert)) {
             directive.alert.forEach(target => this.#sendNotification(target, action));
        }
    }
    
    // Low-Level I/O Proxy: System Hard Stop
    #initiateHardStop(): void {
        // Highly secured, irreversible command sequence
        const system = this.#systemFacade.system;
        if (system && typeof system.initiateHardStop === 'function') {
            console.error("[CRITICAL] Initiating Hard Stop sequence.");
            system.initiateHardStop();
        } else {
            console.error("[CRITICAL FAILURE] Attempted Hard Stop but API was unavailable on systemFacade.");
        }
    }

    // Low-Level I/O Proxy: Subsystem Isolation
    #isolateSubsystem(): void {
        const resourceManager = this.#systemFacade.resourceManager;
        if (resourceManager && typeof resourceManager.isolateSubsystem === 'function') {
            console.warn("[ACTION] Initiating Subsystem Isolation (Quarantine).");
            resourceManager.isolateSubsystem();
        } else {
            console.error("[FAILURE] Attempted Subsystem Isolation but API was unavailable on systemFacade.");
        }
    }
    
    // Low-Level I/O Proxy: Send Notification
    #sendNotification(target: string, action: string): void {
        const notifications = this.#systemFacade.notifications;
        if (notifications && typeof notifications.send === 'function') {
             notifications.send(target, action);
        } else {
             console.warn(`[NOTIFICATION SKIP] Could not notify ${target} about action: ${action}. Notification service unavailable.`);
        }
    }
}

module.exports = PolicyEnforcementKernel;