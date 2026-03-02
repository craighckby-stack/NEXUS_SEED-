/**
 * TQM_Remediation_Dispatcher
 * Executes defined remedial policies by routing commands based on protocol (RPC/QUEUE).
 * It utilizes specialized clients and is structured for improved auditability and testability.
 */
import { policies } from '../../config/governance/TQM_PolicyMapping.json';
import { RPCClient } from '../platform/RPCClient';
import { QueueManager } from '../platform/QueueManager';
// import { GovernanceAuditService } from './GovernanceAuditService'; // Proposed Scaffold integration

export class TQM_Remediation_Dispatcher {
    
    /**
     * @param {RPCClient} [rpcClient] - Optional injected RPC client instance.
     * @param {QueueManager} [queueManager] - Optional injected Queue manager instance.
     */
    constructor(rpcClient, queueManager) {
        // Map policies by ID for O(1) lookup, safely handling potentially undefined configuration structure.
        this.policiesMap = new Map((policies.remedial_policies || []).map(p => [p.id, p]));
        
        // Dependency initialization, supporting DI and fixing the double 'new' syntax error.
        this.rpcClient = rpcClient || new RPCClient();
        this.queueManager = queueManager || new QueueManager();
    }

    /**
     * Executes a policy identified by ID, incorporating dynamic context into the payload.
     * @param {string} policyId - The ID of the remedial policy to execute.
     * @param {object} dynamicContext - Runtime data to merge into the execution payload.
     * @returns {Promise<any>} The result of the dispatch operation.
     */
    async executePolicy(policyId, dynamicContext = {}) {
        const policy = this.policiesMap.get(policyId);
        
        if (!policy) {
            console.error(`[TQM Dispatcher] Lookup failed: Policy ID ${policyId} not found.`);
            // GovernanceAuditService.log(policyId, 'LOOKUP_FAILURE', dynamicContext);
            throw new Error(`TQM Policy ID ${policyId} not found.`);
        }

        const { execution, severity } = policy;
        // Ensure essential traceability metadata is included in the payload.
        const finalPayload = { 
            ...execution.payload, 
            ...dynamicContext, 
            _dispatchTimestamp: Date.now() 
        };

        try {
            let result;
            
            switch (execution.protocol) {
                case 'RPC':
                    result = await this.rpcClient.send(
                        execution.target,
                        execution.endpoint,
                        finalPayload,
                        // Explicitly handle synchronous flag, defaulting to true if not defined.
                        execution.synchronous ?? true 
                    );
                    break;
                case 'QUEUE':
                    result = await this.queueManager.publish(
                        execution.target, 
                        finalPayload,
                        severity
                    );
                    break;
                default:
                    throw new Error(`Unsupported execution protocol: ${execution.protocol} for policy ${policyId}`);
            }

            // GovernanceAuditService.logExecution(policyId, 'SUCCESS', finalPayload, result);
            return result;

        } catch (error) {
            console.error(`[TQM Dispatcher] Execution failure for ${policyId} (${execution.protocol} to ${execution.target}): ${error.message}`, error);
            // GovernanceAuditService.logExecution(policyId, 'FAILURE', finalPayload, { error: error.message, stack: error.stack });
            
            throw error; 
        }
    }
}