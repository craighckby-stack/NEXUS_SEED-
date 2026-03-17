/**
 * TQM_RemediationDispatcherKernel
 * Executes defined remedial policies by routing commands based on protocol (RPC/QUEUE, etc.).
 * Designed for resilience, auditability, and clear separation of execution concerns.
 */
import { policies } from '../../config/governance/TQM_PolicyMapping.json';
import { RPCClient } from '../platform/RPCClient';
import { QueueManager } from '../platform/QueueManager';
import { GovernanceAuditKernel } from './GovernanceAuditKernel';

// Define the interface for the command routing tool
interface ICommandRouter {
    register(protocolKey: string, handlerFn: Function): void;
    route(protocolKey: string, ...args: any[]): Promise<any>;
}

// NOTE: ProtocolRouterToolKernel is implemented as a plugin.
declare class ProtocolRouterToolKernel implements ICommandRouter {
    constructor();
    register(protocolKey: string, handlerFn: Function): void;
    route(protocolKey: string, ...args: any[]): Promise<any>;
}

export class TQM_RemediationDispatcherKernel {
    
    #policiesMap: Map<string, any>;
    #rpcClient: RPCClient;
    #queueManager: QueueManager;
    #auditService: GovernanceAuditKernel;
    #commandRouter: ICommandRouter; // Field for protocol routing

    /**
     * @param {object} [dependencies] - Optional dependencies container for robust DI.
     */
    constructor(dependencies: any = {}) {
        this.#setupDependencies(dependencies);
    }

    /**
     * Executes synchronous dependency validation, configuration loading, and assignment.
     */
    #setupDependencies(dependencies: any = {}): void {
        const { rpcClient, queueManager, auditService, commandRouter } = dependencies;
        
        // 1. Configuration Safety Check and Mapping
        if (!policies || !Array.isArray(policies.remedial_policies)) {
            this.#throwSetupError("Invalid TQM configuration: remedial_policies array is missing or malformed.");
        }
        this.#policiesMap = new Map(policies.remedial_policies.map((p: any) => [p.id, p]));
        
        // 2. Dependency Initialization using encapsulation
        this.#rpcClient = rpcClient || new RPCClient();
        this.#queueManager = queueManager || new QueueManager();
        // GovernanceAuditService refactored to GovernanceAuditKernel
        this.#auditService = auditService || new GovernanceAuditKernel({});

        // 3. Command Router Initialization and Registration
        this.#commandRouter = commandRouter || new ProtocolRouterToolKernel();
        
        this.#registerHandlers();
    }

    /**
     * Internal proxy to register communication handlers with the router.
     */
    #registerHandlers(): void {
        // Register handlers, ensuring 'this' context is preserved via dedicated private proxies
        this.#commandRouter.register('RPC', this.#delegateToRpcClientSend.bind(this));
        this.#commandRouter.register('QUEUE', this.#delegateToQueueManagerPublish.bind(this));
    }

    /**
     * I/O Proxy: Throws a fatal setup error.
     */
    #throwSetupError(message: string): never {
        throw new Error(`[TQM_RemediationDispatcherKernel Setup Failure] ${message}`);
    }

    /**
     * I/O Proxy: Retrieves a policy and validates its existence.
     */
    #retrievePolicyAndValidate(policyId: string): any {
        const policy = this.#policiesMap.get(policyId);
        if (!policy) {
            this.#logLookupFailure(policyId);
            throw new Error(`TQM Policy ID ${policyId} not found in map.`);
        }
        return policy;
    }

    /**
     * I/O Proxy: Logs a policy lookup failure via the Audit Kernel.
     */
    #logLookupFailure(policyId: string): void {
        this.#auditService.log(policyId, 'LOOKUP_FAILURE', { message: `Policy ID ${policyId} not found.` });
    }

    /**
     * I/O Proxy: Executes the RPC protocol command via RPCClient.
     */
    async #delegateToRpcClientSend(execution: any, payload: any): Promise<any> {
        const isSynchronous = execution.synchronous ?? true;
        
        return this.#rpcClient.send(
            execution.target,
            execution.endpoint,
            payload,
            isSynchronous
        );
    }

    /**
     * I/O Proxy: Executes the QUEUE protocol command via QueueManager.
     */
    async #delegateToQueueManagerPublish(execution: any, payload: any, severity: string): Promise<any> {
        return this.#queueManager.publish(
            execution.target, 
            payload,
            severity
        );
    }

    /**
     * I/O Proxy: Delegates routing and execution to the Command Router.
     */
    async #delegateToCommandRouterRoute(executionProtocol: string, execution: any, finalPayload: any, severity: string): Promise<any> {
        return this.#commandRouter.route(
            executionProtocol,
            execution, 
            finalPayload,
            severity
        );
    }

    /**
     * I/O Proxy: Logs a successful execution attempt via the Audit Kernel.
     */
    #logExecutionAttempt(policyId: string, finalPayload: any, result: any): void {
        this.#auditService.logExecution(policyId, 'SUCCESS', finalPayload, result);
    }

    /**
     * I/O Proxy: Logs a failure to the console and the Audit Kernel, then re-throws the error.
     */
    #logFailureAndReThrow(policyId: string, error: any, finalPayload: any): never {
        const errorInstance = error instanceof Error ? error : new Error(String(error));
        
        console.error(`[TQM_RemediationDispatcherKernel] Execution failed for ${policyId}:`, errorInstance);
        
        this.#auditService.logExecution(policyId, 'FAILURE', finalPayload, { 
            error: errorInstance.message, 
            stack: errorInstance.stack 
        });
        
        throw errorInstance; 
    }
    
    /**
     * Executes a policy identified by ID, incorporating dynamic context into the payload.
     * @param {string} policyId - The ID of the remedial policy to execute.
     * @param {object} dynamicContext - Runtime data to merge into the execution payload.
     * @returns {Promise<any>} The result of the dispatch operation.
     */
    async executePolicy(policyId: string, dynamicContext: any = {}): Promise<any> {
        const policy = this.#retrievePolicyAndValidate(policyId);
        const { execution, severity } = policy;
        
        // Construct Payload: Stamp with explicit metadata for enhanced traceability.
        const finalPayload = { 
            ...execution.payload, 
            ...dynamicContext, 
            _policyId: policyId,
            _dispatchTimestamp: Date.now() 
        };

        try {
            // Delegate routing and execution to the command router via proxy
            const result = await this.#delegateToCommandRouterRoute(
                execution.protocol,
                execution, 
                finalPayload, 
                severity
            );

            this.#logExecutionAttempt(policyId, finalPayload, result);
            return result;

        } catch (error) {
            this.#logFailureAndReThrow(policyId, error, finalPayload);
        }
    }
}