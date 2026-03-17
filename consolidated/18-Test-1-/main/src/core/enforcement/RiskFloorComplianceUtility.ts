import { RiskFloorConfig } from '../../config/policy/risk_floor_config.json';
import { TelemetrySnapshot } from '../telemetry/TelemetryService';
import { TriggerProtocol } from './ProtocolExecutionService';
// NOTE: Assuming existence of robust error handling utility.
// import { AGIError, ErrorCode } from '../shared/AGIError';

// Interface definition for detailed compliance results
export interface FloorBreach {
    floorName: string;
    metricKey: keyof TelemetrySnapshot;
    currentValue: number;
    threshold: number;
    protocolId: string;
}

export interface ComplianceResult {
    isCompliant: boolean;
    breaches: FloorBreach[];
}

/**
 * RiskFloorComplianceUtility.ts
 * 
 * Utility responsible for continuous monitoring and enforcement of defined risk floors.
 * It utilizes a data-driven approach to evaluate system telemetry against configured
 * safety standards and orchestrates corresponding emergency protocol triggers.
 */
export class RiskFloorComplianceUtility {
    private config: RiskFloorConfig;

    constructor(config: RiskFloorConfig) {
        this.config = config;
        // In a robust system, critical configuration would be validated here.
        // this.validateConfig();
    }

    /**
     * Checks compliance against all defined risk floors and triggers protocols if breached.
     * @param snapshot The current system telemetry snapshot.
     * @returns A detailed compliance result object indicating overall status and specific breaches.
     */
    public checkCompliance(snapshot: TelemetrySnapshot): ComplianceResult {
        const breaches: FloorBreach[] = [];

        // Define structured enforcement rules derived from configuration. 
        // This maps specific telemetry fields to their configured thresholds and protocols.
        const rules = [
            {
                name: 'Max Unsupervised Scaling Depth',
                metric: 'scaling_depth' as keyof TelemetrySnapshot,
                threshold: this.config.risk_floors.integrity_and_autonomy.max_unsupervised_scaling_depth.value,
                // Assuming config supports specific protocols, or falling back to the generic one
                protocol: (this.config.monitoring_protocols as any).integrity_breach_protocol || this.config.monitoring_protocols.floor_breach_response_protocol,
            },
            {
                name: 'Max Unencrypted Data Flow (KBPS)',
                metric: 'unencrypted_data_flow_kbps' as keyof TelemetrySnapshot,
                threshold: this.config.risk_floors.data_privacy.max_unencrypted_data_flow_kbps.value,
                protocol: (this.config.monitoring_protocols as any).data_privacy_protocol || this.config.monitoring_protocols.floor_breach_response_protocol,
            },
            // FUTURE: Add more rule structures here easily.
        ];

        // Core enforcement loop: Process rules dynamically.
        for (const rule of rules) {
            // Safe cast assuming telemetry fields match defined metrics and are numbers
            const currentValue = (snapshot as any)[rule.metric] as number;
            
            if (currentValue > rule.threshold) {
                breaches.push({
                    floorName: rule.name,
                    metricKey: rule.metric,
                    currentValue: currentValue,
                    threshold: rule.threshold,
                    protocolId: rule.protocol,
                });
            }
        }
        
        const complianceResult: ComplianceResult = {
            isCompliant: breaches.length === 0,
            breaches: breaches,
        };

        if (!complianceResult.isCompliant) {
            this.handleBreaches(complianceResult.breaches);
        }

        return complianceResult;
    }

    /**
     * Executes necessary immediate actions (logging, protocol triggering) upon breaches.
     * Ensures protocols are triggered only once, even if multiple rules link to the same protocol.
     */
    private handleBreaches(breaches: FloorBreach[]): void {
        const triggeredProtocols = new Set<string>();

        breaches.forEach(breach => {
            const message = `RISK FLOOR BREACH DETECTED: Floor=${breach.floorName}, Metric=${String(breach.metricKey)}, Current=${breach.currentValue}, Threshold=${breach.threshold}. Triggering protocol: ${breach.protocolId}`;
            console.error(message); // Temporary logging; should route to ComplianceReportingService
            
            if (!triggeredProtocols.has(breach.protocolId)) {
                TriggerProtocol(breach.protocolId);
                triggeredProtocols.add(breach.protocolId);
            }
        });
    }
}