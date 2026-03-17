import manifest from '../../config/protocol/remediation_command_manifest.json';
import { RemediationService } from './RemediationService';
import { PolicyApplicationPlugin } from "./PolicyApplicationPlugin";

/**
 * CommandExecutorPolicyEngineKernel
 * Manages execution context, security validation, and policy adherence
 * (retry logic, idempotency checks) for RCRP commands based on the manifest definitions.
 */
class CommandExecutorPolicyEngineKernel {
    #commandMap: Map<string, any>;
    #service: RemediationService;
    #policyEngine: PolicyApplicationPlugin;

    constructor() {
        this.#setupDependencies();
    }

    /**
     * @private
     * Synchronously resolves and initializes all core dependencies and configuration.
     */
    #setupDependencies() {
        // Initialize dependencies
        this.#service = new RemediationService(); 
        this.#policyEngine = new PolicyApplicationPlugin();
        
        // Load configuration (satisfies synchronous setup extraction goal)
        this.#commandMap = this.#loadCommandConfiguration(manifest);
    }

    /**
     * @private
     * Loads the command definitions from the manifest data.
     */
    #loadCommandConfiguration(manifestData: { commands: any[] }) {
        const map = new Map();
        for (const command of manifestData.commands) {
            map.set(command.id, command);
        }
        return map;
    }

    /**
     * @private
     * I/O Proxy: Retrieves definition and throws if missing.
     */
    #getCommandDefinition(commandId: string) {
        const commandDef = this.#commandMap.get(commandId);
        if (!commandDef) {
            this.#throwCommandNotFoundError(commandId);
        }
        return commandDef;
    }

    /**
     * @private
     * I/O Proxy: Throws when command is missing.
     */
    #throwCommandNotFoundError(commandId: string) {
        throw new Error(`Command ID ${commandId} not defined.`);
    }

    /**
     * @private
     * Internal Authorization Check.
     */
    #checkAuthorization(requiredScope: any, currentClearance: any): boolean {
        // Logic implementation placeholder: Ensure current clearance satisfies required security scope.
        return true; 
    }

    /**
     * @private
     * I/O Proxy: Throws when authorization fails.
     */
    #throwAuthorizationError() {
        throw new Error('Insufficient clearance or scope mismatch for critical operation.');
    }

    /**
     * @private
     * I/O Proxy: Delegates raw execution to the underlying RemediationService.
     */
    async #delegateToServiceDispatch(target: string, id: string, parameters: any) {
        return await this.#service.dispatch(target, id, parameters);
    }

    /**
     * @private
     * I/O Proxy: Delegates execution wrapped in retry/policy logic to the PolicyApplicationPlugin.
     */
    async #delegateToPolicyExecution(commandId: string, commandDef: any, executionFn: () => Promise<any>) {
        // The PolicyApplicationPlugin handles maximum attempt exhaustion and throws the final error
        return await this.#policyEngine.executeWithPolicy(
            commandId,
            commandDef,
            executionFn
        );
    }

    /**
     * Executes a command, managing authorization and applying configured retry policies.
     */
    async execute(commandId: string, parameters: any, currentClearance: any) {
        const commandDef = this.#getCommandDefinition(commandId);

        // 1. Authorization & Validation Checks
        if (!this.#checkAuthorization(commandDef.security_scope, currentClearance)) {
            this.#throwAuthorizationError();
        }

        // Define the execution logic that will be retried (delegates to raw service dispatch)
        const executionFn = async () => {
            return await this.#delegateToServiceDispatch(
                commandDef.execution_target, 
                commandDef.id, 
                parameters
            );
        };

        // Delegates to the policy engine for execution, handling retry/backoff logic.
        // The Policy engine will propagate errors if all attempts fail.
        return await this.#delegateToPolicyExecution(
            commandId,
            commandDef,
            executionFn
        );
    }
}

export default CommandExecutorPolicyEngineKernel;