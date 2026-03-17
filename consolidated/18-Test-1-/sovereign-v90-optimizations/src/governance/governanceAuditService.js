import { ISerializedAsyncQueueWriterToolKernel } from "../interfaces/ISerializedAsyncQueueWriterToolKernel";
import { IEventFactoryGeneratorToolKernel } from "../interfaces/IEventFactoryGeneratorToolKernel";
import { ILoggerToolKernel } from "../interfaces/ILoggerToolKernel";
import { IHighEfficiencyStateRetrieverToolKernel } from "../interfaces/IHighEfficiencyStateRetrieverToolKernel";
import { IConceptIdRegistryKernel } from "../registries/IConceptIdRegistryKernel";

/**
 * Governance Audit Kernel - GAK v1.0
 * Role: Auditable and Asynchronous Logging and History Retrieval for Governance State Transitions.
 *
 * This kernel replaces the synchronous GovernanceAuditService, enforcing the AIA Enforcement Layer
 * mandate for non-blocking execution and delegated persistence via specialized tool kernels.
 */
export class GovernanceAuditKernel {
    
    /**
     * @param {ISerializedAsyncQueueWriterToolKernel} asyncQueueWriter Kernel for asynchronous audit log persistence.
     * @param {IEventFactoryGeneratorToolKernel} eventFactoryGenerator Kernel for canonical audit record construction.
     * @param {ILoggerToolKernel} logger Kernel for auditable logging.
     * @param {IHighEfficiencyStateRetrieverToolKernel} hesr Kernel for high-performance history retrieval.
     * @param {IConceptIdRegistryKernel} conceptIdRegistry Registry for standardized concepts (e.g., queue keys).
     */
    constructor(
        private asyncQueueWriter: ISerializedAsyncQueueWriterToolKernel,
        private eventFactoryGenerator: IEventFactoryGeneratorToolKernel,
        private logger: ILoggerToolKernel,
        private hesr: IHighEfficiencyStateRetrieverToolKernel,
        private conceptIdRegistry: IConceptIdRegistryKernel
    ) {}

    /**
     * Initializes the kernel, performing necessary setup and dependency checks.
     */
    async initialize(): Promise<void> {
        await this.logger.info("GovernanceAuditKernel initialized successfully.", { component: 'GAK' });
    }

    /**
     * Records a critical state transition within the governance lifecycle.
     * This operation is strictly asynchronous and non-blocking.
     * @param {string} transitionConceptId The high-level concept identifier for the transition type (e.g., 'GOV_TRANSITION_EVAL').
     * @param {string} componentId The ID of the component undergoing transition.
     * @param {Object} previousState Snapshot of the previous governance state.
     * @param {Object} nextState Snapshot of the subsequent governance state.
     */
    async recordTransition(
        transitionConceptId: string,
        componentId: string,
        previousState: any,
        nextState: any
    ): Promise<void> {
        try {
            // 1. Delegate canonical audit log entry creation (replaces executeCanonicalGenerator)
            const auditEvent = await this.eventFactoryGenerator.createGovernanceAuditRecord({
                conceptId: transitionConceptId,
                sourceComponent: componentId,
                previousState: previousState,
                nextState: nextState
            });

            // 2. Asynchronously write the record (replaces synchronous in-memory push)
            const queueKey = await this.conceptIdRegistry.get('AUDIT_LOG_QUEUE_KEY');
            
            if (!queueKey) {
                // Log critical configuration error but proceed non-blockingly
                await this.logger.error("Configuration Error: Missing AUDIT_LOG_QUEUE_KEY for GAK. Audit skipped.", { component: 'GAK' });
                return;
            }
            
            await this.asyncQueueWriter.write(queueKey, auditEvent);
            
            await this.logger.debug(`Transition recorded for ${componentId} via async queue.`, {
                component: 'GAK',
                transitionId: auditEvent.transitionId
            });

        } catch (error) {
            // Critical logging failures must be non-fatal to the main execution path.
            await this.logger.error("FATAL: Failed to record governance transition. Integrity risk.", {
                component: 'GAK',
                error: error.message,
                componentId: componentId
            });
        }
    }

    /**
     * Retrieves the history of a specific component asynchronously.
     * Delegates retrieval to the High Efficiency State Retriever (HESR).
     * @param {string} componentId
     * @returns {Promise<any[]>}
     */
    async getHistory(componentId: string): Promise<any[]> {
        const queryKey = await this.conceptIdRegistry.get('AUDIT_HISTORY_QUERY_KEY'); 
        
        if (!queryKey) {
             await this.logger.warn("Missing AUDIT_HISTORY_QUERY_KEY. Returning empty history.", { component: 'GAK' });
             return [];
        }
        
        // The HESR handles filtering, sorting, and high-performance retrieval from the audit store.
        return this.hesr.queryState(queryKey, { componentId: componentId });
    }
}