/**
 * Component: IPSM State Producer
 * Purpose: Calculates, aggregates, and validates the IPSM runtime state
 * against the IPSM_State_Schema prior to persistence or transmission.
 * Required because aggregating telemetry, diagnostic counts, and cycle latency
 * is a complex responsibility requiring a dedicated, optimized process.
 */

// Placeholder Imports for context (assuming these exist in the system)
// Note: ExecutionTimerUtility is the newly defined plugin.
import { SchemaValidationEngineTool } from '@kernel/validation/SchemaValidationEngineTool';
import { CanonicalErrorSerializer } from '@kernel/utilities/CanonicalErrorSerializer';

// --- Utility Definition Placeholder ---
// In a real TS environment, this would be an import from the generated plugin wrapper.
declare const ExecutionTimerUtility: { 
    execute: (fn: () => any) => { result: any; latency_ms: number; }; 
};

// --- External Dependency Placeholders ---
interface AgentManagementService { getAgentMetrics(): any; }
interface SystemResourceMonitor { gatherMetrics(): any; }
declare class Config { static get(key: string): string; }
declare class Diagnostics { static getCycleSummary(): any; }

interface IPSMStateSchema {
    ipms_version: string;
    system_status: string;
    agent_management: any;
    resource_telemetry: {
        supervision_cycle_latency_ms: number;
        [key: string]: any;
    };
    operational_diagnostics: any;
    last_update_timestamp_ms: number;
}

// Placeholder for the imported schema definition
const IPSM_STATE_SCHEMA_DEFINITION = {};

export class IPSMStateProducer {
    private readonly agentManager: AgentManagementService;
    private readonly resourceMonitor: SystemResourceMonitor;
    private readonly schemaValidator: SchemaValidationEngineTool;
    
    constructor(
        agentManager: AgentManagementService, 
        resourceMonitor: SystemResourceMonitor,
        // Inject the required validation tool dependency
        schemaValidator: SchemaValidationEngineTool = new SchemaValidationEngineTool() 
    ) {
        this.agentManager = agentManager;
        this.resourceMonitor = resourceMonitor;
        this.schemaValidator = schemaValidator;
    }

    /** Generates a complete state snapshot, including calculated latency and performing validation. */
    public generateSnapshot(): IPSMStateSchema {
        
        // 1. Use ExecutionTimerUtility (new plugin) to wrap aggregation and calculate latency
        const timerResult = ExecutionTimerUtility.execute(() => {
            // Aggregation logic
            const telemetry = this.resourceMonitor.gatherMetrics(); // CPU, Memory, IOPS

            const snapshot: Partial<IPSMStateSchema> = {
                ipms_version: Config.get('VERSION'),
                system_status: this.getOverallStatus(),
                agent_management: this.agentManager.getAgentMetrics(), // Includes active_agent_ids, total_supervised_processes, agents_in_critical_state
                resource_telemetry: telemetry,
                operational_diagnostics: Diagnostics.getCycleSummary(), // error_count_last_cycle, warning_flags
                last_update_timestamp_ms: Date.now()
            };
            return snapshot;
        });

        const snapshot = timerResult.result;
        
        // 2. Finalize latency metric using the result from the timer utility
        snapshot.resource_telemetry = snapshot.resource_telemetry || {};
        snapshot.resource_telemetry!.supervision_cycle_latency_ms = timerResult.latency_ms;

        const finalSnapshot = snapshot as IPSMStateSchema;

        // 3. CRITICAL: Validate snapshot against schema using SchemaValidationEngineTool
        const validationResult = this.schemaValidator.validate(finalSnapshot, IPSM_STATE_SCHEMA_DEFINITION);
        
        if (!validationResult.isValid) {
            // Use CanonicalErrorSerializer for standardized error reporting
            const validationError = CanonicalErrorSerializer.serialize(
                'IPSM_STATE_VALIDATION_FAILURE',
                'Generated state snapshot failed schema validation.',
                { details: validationResult.errors }
            );
            console.error('State Validation Error:', validationError);
            throw new Error('IPSM State Snapshot is invalid according to schema.');
        }

        return finalSnapshot;
    }
    
    private getOverallStatus(): string { 
        // Logic to determine overall health based on agent health and internal diagnostics 
        return 'HEALTHY';
    }
}