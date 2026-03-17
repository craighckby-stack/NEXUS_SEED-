/**
 * Component: IPSM State Producer
 * Purpose: Calculates, aggregates, and validates the IPSM runtime state
 * against the IPSM_State_Schema prior to persistence or transmission.
 * Required because aggregating telemetry, diagnostic counts, and cycle latency
 * is a complex responsibility requiring a dedicated, optimized process.
 */
export class IPSMStateProducer {
    private readonly agentManager: AgentManagementService;
    private readonly resourceMonitor: SystemResourceMonitor;
    
    constructor(agentManager: AgentManagementService, resourceMonitor: SystemResourceMonitor) {
        this.agentManager = agentManager;
        this.resourceMonitor = resourceMonitor;
    }

    /** Generates a complete state snapshot, including calculated latency. */
    public generateSnapshot(): IPSMStateSchema {
        const startTime = performance.now();

        const telemetry = this.resourceMonitor.gatherMetrics(); // CPU, Memory, IOPS

        const snapshot: Partial<IPSMStateSchema> = {
            ipms_version: Config.get('VERSION'),
            system_status: this.getOverallStatus(),
            agent_management: this.agentManager.getAgentMetrics(), // Includes active_agent_ids, total_supervised_processes, agents_in_critical_state
            resource_telemetry: telemetry,
            operational_diagnostics: Diagnostics.getCycleSummary(), // error_count_last_cycle, warning_flags
            last_update_timestamp_ms: Date.now()
        };
        
        // Calculate and finalize latency metric
        snapshot.resource_telemetry!.supervision_cycle_latency_ms = Math.round(performance.now() - startTime);

        // TODO: Validate snapshot against schema before returning
        return snapshot as IPSMStateSchema;
    }
    
    private getOverallStatus(): string { 
        // Logic to determine overall health based on agent health and internal diagnostics 
        return 'HEALTHY';
    }
}