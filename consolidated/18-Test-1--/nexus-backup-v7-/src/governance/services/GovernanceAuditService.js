/**
 * Governance Audit Kernel - src/governance/services/GovernanceAuditKernel.js
 * ID: GAK v2.0
 * Role: Immutable Logging and Traceability Endpoint
 *
 * This kernel replaces the synchronous GovernanceAuditService (GAS v1.1).
 * It ensures a complete, verifiable history of governance state transitions by
 * delegating all complex tasks—canonicalization, ID generation, and immutable
 * persistence—to specialized, asynchronous Tool Kernels.
 */

class GovernanceAuditKernel {
    #auditDisperserKernel;
    #logSchemaRegistryKernel;
    #traceableIdGeneratorKernel;

    /**
     * @param {object} dependencies - Tool Kernels injected by the runtime environment.
     * @param {MultiTargetAuditDisperserToolKernel} dependencies.MultiTargetAuditDisperserToolKernel
     * @param {GovernanceLogSchemaRegistryKernel} dependencies.GovernanceLogSchemaRegistryKernel
     * @param {ITraceableIdGeneratorToolKernel} dependencies.ITraceableIdGeneratorToolKernel
     */
    constructor(dependencies) {
        this.#auditDisperserKernel = dependencies.MultiTargetAuditDisperserToolKernel;
        this.#logSchemaRegistryKernel = dependencies.GovernanceLogSchemaRegistryKernel;
        this.#traceableIdGeneratorKernel = dependencies.ITraceableIdGeneratorToolKernel;

        if (!this.#auditDisperserKernel || !this.#logSchemaRegistryKernel || !this.#traceableIdGeneratorKernel) {
            throw new Error("GovernanceAuditKernel requires MultiTargetAuditDisperserToolKernel, GovernanceLogSchemaRegistryKernel, and ITraceableIdGeneratorToolKernel.");
        }
    }

    /**
     * Mandatory asynchronous initialization method.
     * @returns {Promise<void>}
     */
    async initialize() {
        // Ensure the audit log schemas are loaded and available for canonicalization.
        // Note: Actual schema registration is handled by IRegistryInitializerToolKernel during system boot.
        // This ensures the dependency is ready.
    }

    /**
     * Logs a state transition event, capturing component identity, status change, and metadata.
     * Delegation to MultiTargetAuditDisperserToolKernel ensures canonicalization, persistence, and non-blocking I/O.
     * 
     * @param {string} componentId - The unique ID of the component being governed.
     * @param {object} previousState - The state before the transition.
     * @param {object} nextState - The state after the transition.
     * @returns {Promise<void>}
     */
    async logTransition(componentId, previousState, nextState) {
        
        const traceId = await this.#traceableIdGeneratorKernel.generateTraceableId('GOVERNANCE_TRANSITION_AUDIT');
        
        const transitionPayload = {
            traceId: traceId,
            componentId: componentId,
            timestamp: Date.now(),
            previousStatus: previousState?.status || 'INITIAL', 
            nextStatus: nextState?.status || 'UNKNOWN',
            transitionData: { previous: previousState, next: nextState },
            // Map data to the GOVERNANCE_TRANSITION schema definition managed by GovernanceLogSchemaRegistryKernel
        };

        // The Audit Disperser handles canonicalization (based on registered schemas),
        // security checks, and persistent storage across defined audit targets.
        await this.#auditDisperserKernel.distributeAuditRecord(
            transitionPayload,
            'GOVERNANCE_TRANSITION' // Audit type defined in GovernanceLogSchemaRegistryKernel
        );
    }

    /**
     * Retrieves the complete audit history for a specific component.
     * This retrieval logic is delegated, assuming the Audit Disperser or a high-efficiency
     * state retriever provides the necessary query interface for archived logs.
     * 
     * @param {string} componentId
     * @returns {Promise<Array<Object>>}
     */
    async getHistory(componentId) {
        // Delegate complex data retrieval to a specialized kernel (e.g., IHighEfficiencyStateRetrieverToolKernel or a query interface on the Audit Disperser).
        return this.#auditDisperserKernel.queryAuditHistory(componentId, 'GOVERNANCE_TRANSITION');
    }

    // Note: Synchronous console logging removed in favor of auditable, asynchronous distribution via MTADK.
}

export { GovernanceAuditKernel };