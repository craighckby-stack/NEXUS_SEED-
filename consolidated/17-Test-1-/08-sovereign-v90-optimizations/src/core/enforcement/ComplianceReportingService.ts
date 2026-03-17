import { FloorBreach } from './RiskFloorComplianceUtility';
import { TelemetrySnapshot } from '../telemetry/TelemetryService';
import { IAuditPersistenceToolKernel } from '../../infrastructure/persistence/IAuditPersistenceToolKernel';
import { IComplianceRecordCanonicalizerToolKernel, CanonicalizationResult } from '../plugins/IComplianceRecordCanonicalizerToolKernel';
import { ILoggerToolKernel } from '@agnoc/core-interfaces'; // Assuming standard logger interface

/**
 * Defines the operational interface for the Compliance Reporting Kernel.
 */
export interface IComplianceReportingKernel {
    logBreach(breach: FloorBreach, snapshot: TelemetrySnapshot): Promise<void>;
}

/**
 * ComplianceReportingKernel
 * 
 * Handles persistent logging, auditing, and aggregation of all risk floor compliance events
 * and breaches. Decouples immediate enforcement actions from critical audit trail generation.
 */
export class ComplianceReportingKernel implements IComplianceReportingKernel {
    private persistence!: IAuditPersistenceToolKernel;
    private canonicalizer: IComplianceRecordCanonicalizerToolKernel | null = null;
    private logger!: ILoggerToolKernel;

    /**
     * @param dependencies.persistence Tool for persistent storage (replaces PersistenceService).
     * @param dependencies.logger Standard logging tool (replaces console usage).
     * @param dependencies.canonicalizer Optional tool to standardize breach records (replaces ComplianceRecordCanonicalizerPlugin).
     */
    constructor(dependencies: {
        persistence: IAuditPersistenceToolKernel,
        logger: ILoggerToolKernel,
        canonicalizer?: IComplianceRecordCanonicalizerToolKernel | null
    }) {
        this.#setupDependencies(dependencies);
    }

    /**
     * Internal method to set up dependencies synchronously, ensuring strict compliance 
     * with synchronous setup extraction and dependency validation.
     */
    #setupDependencies(dependencies: {
        persistence: IAuditPersistenceToolKernel,
        logger: ILoggerToolKernel,
        canonicalizer?: IComplianceRecordCanonicalizerToolKernel | null
    }): void {
        if (!dependencies.persistence) {
            throw new Error("ComplianceReportingKernel requires IAuditPersistenceToolKernel.");
        }
        if (!dependencies.logger) {
            throw new Error("ComplianceReportingKernel requires ILoggerToolKernel.");
        }
        
        this.persistence = dependencies.persistence;
        this.logger = dependencies.logger;
        this.canonicalizer = dependencies.canonicalizer ?? null; 
    }

    /**
     * Logs a detected risk floor breach to persistent storage for auditing and analysis.
     * @param breach The detailed breach event.
     * @param snapshot The telemetry context at the time of the breach.
     */
    public async logBreach(breach: FloorBreach, snapshot: TelemetrySnapshot): Promise<void> {
        const rawRecord = {
            breach: breach,
            snapshot: snapshot,
            timestamp: Date.now()
        };
        
        let recordToPersist: any = rawRecord;

        if (this.canonicalizer) {
            const canonicalizedResult = this.canonicalizer.execute(rawRecord);

            if (canonicalizedResult?.error) {
                // Canonicalization failed. Log error using injected logger.
                this.logger.error(`[ComplianceAudit]: Canonicalization failed: ${canonicalizedResult.error}. Logging raw record instead.`, { breachContext: breach });
            } else if (canonicalizedResult) {
                recordToPersist = canonicalizedResult;
            } else {
                 // Safety check if canonicalizer returns null/undefined. Log warning using injected logger.
                 this.logger.warn("[ComplianceAudit]: Canonicalizer returned empty result. Logging raw record.", { breachContext: breach });
            }
        } else {
            // Tool unavailable. Log warning using injected logger.
            this.logger.warn("[ComplianceAudit]: ComplianceRecordCanonicalizer tool unavailable. Logging raw breach data.", { breachContext: breach });
        }

        this.logger.info(`[ComplianceAudit]: Logging persistent breach record for ${breach.floorName}`);
        
        // Use injected persistence tool.
        await this.persistence.save('compliance_breach_log', recordToPersist);
    }
}