import * as fs from 'fs';

/**
 * Interface definition for the policy evaluation tool/plugin.
 * This tool is responsible for implementing the complex policy matching logic.
 */
export interface PolicyEvaluationEngineTool {
    execute(args: { policy: any, scope: string, data: string }): { allowed: boolean, action: string, message?: string };
}

export class PolicyEnforcementPoint {
    #policy: any;
    #evaluator: PolicyEvaluationEngineTool; 

    /**
     * Initializes the PolicyEnforcementPoint by loading the policy file
     * and injecting the necessary evaluation engine dependency.
     *
     * @param policyPath The file path to the JSON policy configuration.
     * @param evaluator The PolicyEvaluationEngineTool instance.
     */
    constructor(policyPath: string, evaluator: PolicyEvaluationEngineTool) {
        this.#setupDependencies(policyPath, evaluator);
    }

    /**
     * Extracts synchronous dependency resolution and initialization.
     * Handles evaluator assignment, policy file loading, and logging.
     */
    #setupDependencies(policyPath: string, evaluator: PolicyEvaluationEngineTool): void {
        this.#validateEvaluator(evaluator);
        this.#evaluator = evaluator;

        const policyData = this.#loadAndParsePolicy(policyPath);
        
        // Basic validation check after loading
        if (!policyData.policyId || !policyData.policyVersion) {
            throw new Error("Policy structure invalid (missing policyId or policyVersion).");
        }

        this.#policy = policyData;
        this.#logInfo(`[PEP] Loaded Policy: ${this.#policy.policyId} v${this.#policy.policyVersion}`);
    }

    /** Synchronously checks input data against defined filters based on target scope. */
    public enforce(scope: string, data: string): { allowed: boolean, action: string, message?: string } {
        // Delegate complex evaluation logic to the specialized plugin
        return this.#delegateToEvaluatorExecution({
            policy: this.#policy,
            scope: scope,
            data: data
        });
    }

    // --- I/O Proxy Methods ---

    /** Handles synchronous file reading and JSON parsing. */
    #loadAndParsePolicy(policyPath: string): any {
        try {
            const content = fs.readFileSync(policyPath, 'utf-8');
            return JSON.parse(content);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            throw new Error(`Failed to load or parse governance policy from ${policyPath}: ${errorMessage}`);
        }
    }

    /** Handles delegation to the external policy evaluation tool. */
    #delegateToEvaluatorExecution(args: Parameters<PolicyEvaluationEngineTool['execute']>[0]): ReturnType<PolicyEvaluationEngineTool['execute']> {
        // Uses the assigned private field #evaluator
        return this.#evaluator.execute(args);
    }

    /** Handles console logging. */
    #logInfo(message: string): void {
        console.log(message);
    }
    
    /** Handles synchronous dependency validation. */
    #validateEvaluator(evaluator: PolicyEvaluationEngineTool): void {
        if (!evaluator) {
            throw new Error("Critical dependency PolicyEvaluationEngineTool is missing.");
        }
    }
}