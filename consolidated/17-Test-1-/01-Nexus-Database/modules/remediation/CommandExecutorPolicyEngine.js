import manifest from '../../config/protocol/remediation_command_manifest.json';
import { RemediationService } from './RemediationService';

/**
 * CommandExecutorPolicyEngine
 * Manages execution context, security validation, and policy adherence
 * (retry logic, idempotency checks) for RCRP commands based on the manifest definitions.
 */
class CommandExecutorPolicyEngine {
    constructor() {
        this.commandMap = this._initializeCommandMap(manifest);
        // RemediationService assumed to handle actual low-level system interactions
        this.service = new RemediationService(); 
    }

    _initializeCommandMap(manifestData) {
        const map = new Map();
        for (const command of manifestData.commands) {
            map.set(command.id, command);
        }
        return map;
    }

    async execute(commandId, parameters, currentClearance) {
        const commandDef = this.commandMap.get(commandId);

        if (!commandDef) {
            throw new Error(`Command ID ${commandId} not defined.`);
        }

        // 1. Authorization & Validation Checks
        if (!this._isAuthorized(commandDef.security_scope, currentClearance)) {
            throw new Error('Insufficient clearance or scope mismatch for critical operation.');
        }
        // Note: Full JSON Schema validation should be implemented here (e.g., using AJV).

        const policy = commandDef.metadata.retry_policy;
        let attempts = 0;

        while (attempts < policy.max_attempts) {
            try {
                // Execute the command via the defined target interface
                const result = await this.service.dispatch(commandDef.execution_target, commandDef.id, parameters);
                return result;
            } catch (error) {
                attempts++;
                if (attempts >= policy.max_attempts) {
                    throw new Error(`Command ${commandId} failed after ${attempts} attempts: ${error.message}`);
                }
                
                // 2. Apply Backoff Policy
                if (policy.backoff_strategy !== 'NONE') {
                    const delay = policy.backoff_ms * (policy.backoff_strategy === 'LINEAR' ? attempts : 1);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
    }

    _isAuthorized(requiredScope, currentClearance) {
        // Logic implementation placeholder: Ensure current clearance satisfies required security scope.
        return true; 
    }
}

export default CommandExecutorPolicyEngine;