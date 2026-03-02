import { GatingIntegrityAuditReport } from '../types/GatingIntegrityAuditReport';
import {
    PolicyEngine,
    AlertingService,
    Logger,
    RemediationService,
    AuditStatus,
    CheckSeverity,
} from './governance.interfaces'; // Import scaffolded types

/**
 * GateDecisionHandler
 * Centralized component responsible for consuming the Gating Integrity Audit Report
 * and translating its PASS/FAIL/CONDITIONAL status into mandatory operational commands (e.g., halt CI/CD, trigger alerts, generate tickets).
 */
export class GateDecisionHandler {

    private policyEngine: PolicyEngine;
    private alertingService: AlertingService;
    private logger: Logger;
    private remediationService: RemediationService;

    constructor(
        policyEngine: PolicyEngine,
        alertingService: AlertingService,
        logger: Logger,
        remediationService: RemediationService
    ) {
        this.policyEngine = policyEngine;
        this.alertingService = alertingService;
        this.logger = logger;
        this.remediationService = remediationService;
    }

    /**
     * Processes the report and determines the necessary system action.
     * @param report The validated GatingIntegrityAuditReport object.
     * @returns boolean indicating if the entity's progression (e.g., deployment) should be permitted.
     */
    public async enforceDecision(report: GatingIntegrityAuditReport): Promise<boolean> {
        const { overallStatus } = report.auditSummary;
        const entityId = report.entity.identifier;

        switch (overallStatus) {
            case AuditStatus.FAIL:
                await this.handleFailure(report);
                return false; // Block execution

            case AuditStatus.CONDITIONAL:
                // Conditional allows execution, but mandatory mitigation must be initiated first.
                await this.handleConditionalPass(report);
                return true; 

            case AuditStatus.PASS:
                this.logger.info(`Gate Decision: PASSED for entity ${entityId}. Status: ${overallStatus}`);
                return true; // Full clearance

            default:
                this.logger.error(`Unknown audit status detected for ${entityId}: ${overallStatus}. Treating as failure.`);
                // Fallback action for undefined statuses should be blocking for security/integrity.
                await this.policyEngine.blockPipeline(entityId);
                await this.alertingService.sendAlert({
                    severity: CheckSeverity.CRITICAL,
                    message: `GATING INTEGRITY FAILURE: Undefined audit status (${overallStatus}) detected for ${entityId}. Block enforced.`,
                });
                return false;
        }
    }

    private async handleFailure(report: GatingIntegrityAuditReport): Promise<void> {
        const entityId = report.entity.identifier;

        // 1. Identify critical context
        const criticalViolations = report.gatingChecks.filter(
            c => c.severity === CheckSeverity.CRITICAL && c.status === AuditStatus.FAIL
        );

        // 2. Alert
        await this.alertingService.sendAlert({
            severity: CheckSeverity.CRITICAL,
            message: `GATING BLOCK enforced: Entity ${entityId} failed audit. Violations: ${report.auditSummary.violationCount}.`,
            context: {
                criticalCount: criticalViolations.length,
            }
        });

        // 3. Enforce blockage
        await this.policyEngine.blockPipeline(entityId);

        this.logger.error(
            `GATING BLOCK triggered for ${entityId}. Critical violations found: ${criticalViolations.length}.`,
            { entityId, violations: report.auditSummary.violationCount }
        );
    }

    private async handleConditionalPass(report: GatingIntegrityAuditReport): Promise<void> {
        const entityId = report.entity.identifier;
        
        const requiredActions = report.gatingChecks
            .filter(c => 
                c.status === AuditStatus.FAIL && 
                c.severity !== CheckSeverity.CRITICAL && // Must not be critical, otherwise it would be a FAIL
                c.actionRequired && 
                c.actionRequired.length > 0
            )
            .flatMap(c => c.actionRequired!);

        if (requiredActions.length > 0) {
            
            // Initiate mandatory external mitigation tracking (e.g., creating a JIRA ticket)
            const trackingId = await this.remediationService.initiateMitigation(entityId, requiredActions);

            this.logger.warn(
                `CONDITIONAL PASS granted for ${entityId}. ${requiredActions.length} mitigation actions required. Tracking ID: ${trackingId}`,
                { entityId, trackingId }
            );

            // Notify relevant teams that tracking is active
            await this.alertingService.sendAlert({ 
                severity: CheckSeverity.MEDIUM, 
                message: `Conditional passage granted. Mitigation tracking initiated (ID: ${trackingId}) for ${entityId}.` 
            });
        } else {
            // Should theoretically not happen if the status is CONDITIONAL, but guards against empty lists.
            this.logger.info(`Conditional status reported, but no explicit actions found for ${entityId}. Allowing passage.`);
        }
    }
}