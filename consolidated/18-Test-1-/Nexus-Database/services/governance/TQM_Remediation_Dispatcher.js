/**
 * TQM_Remediation_Dispatcher
 * Executes defined remedial policies by routing commands based on protocol (RPC/QUEUE, etc.).
 * Designed for resilience, auditability, and clear separation of execution concerns.
 */
import { policies } from '../../config/governance/TQM_PolicyMapping.json';
import { RPCClient } from '../platform/RPCClient';
import { QueueManager } from '../platform/QueueManager';
import { GovernanceAuditService } from './GovernanceAuditService';

export class TQM_Remediation_Dispatcher {
    
    #policiesMap;
    #rpcClient;
    #queueManager;
    #auditService;

    /**
     * @param {object} [dependencies] - Optional dependencies container for robust DI.
     * @param {RPCClient} [dependencies.rpcClient]
     * @param {QueueManager} [dependencies.queueManager]
     * @param {GovernanceAuditService} [dependencies.auditService]
     */
    constructor(dependencies = {}) {
        const { rpcClient, queueManager, auditService } = dependencies;
        
        // 1. Configuration Safety Check and Mapping
        if (!policies || !Array.isArray(policies.remedial_policies)) {
            throw new Error("Invalid TQM configuration: remedial_policies array is missing or malformed.");
        }
        this.#policiesMap = new Map(policies.remedial_policies.map(p => [p.id, p]));
        
        // 2. Dependency Initialization using encapsulation
        this.#rpcClient = rpcClient || new RPCClient();
        this.#queueManager = queueManager || new QueueManager();
        this.#auditService = auditService || new GovernanceAuditService();
    }

    /**
     * Retrieves a policy and validates its existence.
     * @param {string} policyId 
     * @returns {object} The policy object.
     */
    #getPolicyOrThrow(policyId) {
        const policy = this.#policiesMap.get(policyId);
        if (!policy) {
            this.#auditService.log(policyId, 'LOOKUP_FAILURE', { message: `Policy ID ${policyId} not found.` });
            throw new Error(`TQM Policy ID ${policyId} not found in map.`);
        }
        return policy;
    }

    /**
     * Executes the RPC protocol command.
     * @param {object} execution - Policy execution details.
     * @param {object} payload - The finalized execution payload.
     * @returns {Promise<any>}
     */
    async #handleRpcExecution(execution, payload) {
        const isSynchronous = execution.synchronous ?? true;
        
        return this.#rpcClient.send(
            execution.target,
            execution.endpoint,
            payload,
            isSynchronous
        );
    }

    /**
     * Executes the QUEUE protocol command.
     * @param {object} execution - Policy execution details.
     * @param {object} payload - The finalized execution payload.
     * @param {string} severity - Severity level for prioritization.
     * @returns {Promise<any>}
     */
    async #handleQueueExecution(execution, payload, severity) {
        return this.#queueManager.publish(
            execution.target, 
            payload,
            severity
        );
    }
    
    /**
     * Executes a policy identified by ID, incorporating dynamic context into the payload.
     * @param {string} policyId - The ID of the remedial policy to execute.
     * @param {object} dynamicContext - Runtime data to merge into the execution payload.
     * @returns {Promise<any>} The result of the dispatch operation.
     */
    async executePolicy(policyId, dynamicContext = {}) {
        const policy = this.#getPolicyOrThrow(policyId);
        const { execution, severity } = policy;
        
        // Construct Payload: Stamp with explicit metadata for enhanced traceability.
        const finalPayload = { 
            ...execution.payload, 
            ...dynamicContext, 
            _policyId: policyId,
            _dispatchTimestamp: Date.now() 
        };

        try {
            let result;
            
            switch (execution.protocol) {
                case 'RPC':
                    result = await this.#handleRpcExecution(execution, finalPayload);
                    break;
                case 'QUEUE':
                    result = await this.#handleQueueExecution(execution, finalPayload, severity);
                    break;
                default:
                    const errorMsg = `Unsupported execution protocol: ${execution.protocol}.`;
                    this.#auditService.logExecution(policyId, 'FAILURE', finalPayload, { error: errorMsg });
                    throw new Error(errorMsg);
            }

            this.#auditService.logExecution(policyId, 'SUCCESS', finalPayload, result);
            return result;

        } catch (error) {
            console.error(`[TQM Dispatcher] Execution failed for ${policyId}:`, error);
            
            // Log failure before re-throwing
            this.#auditService.logExecution(policyId, 'FAILURE', finalPayload, { 
                error: error.message, 
                stack: error.stack 
            });
            
            throw error; 
        }
    }
}