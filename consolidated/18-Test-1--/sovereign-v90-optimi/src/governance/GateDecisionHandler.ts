import { GatingIntegrityAuditReport } from '../types/GatingIntegrityAuditReport';
import {
    AuditStatus,
    CheckSeverity,
    IAlertingServiceToolKernel,
    IPolicyEnforcementToolKernel,
    IRemediationServiceToolKernel,
    IAuditActionExtractorToolKernel
} from './governance.interfaces'; 
import { ILoggerToolKernel } from '@core/logging'; // Standard strategic logging interface

/**
 * GateDecisionHandlerKernel
 * Centralized component responsible for consuming the Gating Integrity Audit Report
 * and translating its PASS/FAIL/CONDITIONAL status into mandatory operational commands (e.g., halt CI/CD, trigger alerts, generate tickets).
 * Adheres to kernel naming convention, formalized dependency injection, and setup isolation.
 */
export class GateDecisionHandlerKernel {

    private policyEnforcementTool: IPolicyEnforcementToolKernel;
    private alertingServiceTool: IAlertingServiceToolKernel;
    private loggerTool: ILoggerToolKernel;
    private remediationServiceTool: IRemediationServiceToolKernel;
    private actionExtractorTool: IAuditActionExtractorToolKernel;

    constructor(
        policyEnforcementTool: IPolicyEnforcementToolKernel,
        alertingServiceTool: IAlertingServiceToolKernel,
        loggerTool: ILoggerToolKernel,
        remediationServiceTool: IRemediationServiceToolKernel,
        actionExtractorTool: IAuditActionExtractorToolKernel
    ) {
        this.#setupDependencies({
            policyEnforcementTool,
            alertingServiceTool,
            loggerTool,
            remediationServiceTool,
            actionExtractorTool
        });
    }

    /**
     * Isolates synchronous dependency assignment and validation.
     */
    private #setupDependencies(dependencies: {
        policyEnforcementTool: IPolicyEnforcementToolKernel,
        alertingServiceTool: IAlertingServiceToolKernel,
        loggerTool: ILoggerToolKernel,
        remediationServiceTool: IRemediationServiceToolKernel,
        actionExtractorTool: IAuditActionExtractorToolKernel
    }): void {
        if (!dependencies.policyEnforcementTool || !dependencies.loggerTool || !dependencies.actionExtractorTool) {
            throw new Error('GateDecisionHandlerKernel requires all formalized dependencies.');
        }

        this.policyEnforcementTool = dependencies.policyEnforcementTool;
        this.alertingServiceTool = dependencies.alertingServiceTool;
        this.loggerTool = dependencies.loggerTool;
        this.remediationServiceTool = dependencies.remediationServiceTool;
        this.actionExtractorTool = dependencies.actionExtractorTool;
    }

    /**
     * Placeholder for asynchronous initialization.
     */
    public async initialize(): Promise<void> {
        // No complex async setup required yet, but method is retained for architectural consistency.
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
                this.loggerTool.info(`Gate Decision: PASSED for entity ${entityId}. Status: ${overallStatus}`);
                return true; // Full clearance

            default:
                this.loggerTool.error(`Unknown audit status detected for ${entityId}: ${overallStatus}. Treating as failure.`);
                // Fallback action for undefined statuses should be blocking for security/integrity.
                await this.policyEnforcementTool.blockPipeline(entityId);
                await this.alertingServiceTool.sendAlert({
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
        await this.alertingServiceTool.sendAlert({
            severity: CheckSeverity.CRITICAL,
            message: `GATING BLOCK enforced: Entity ${entityId} failed audit. Violations: ${report.auditSummary.violationCount}.`,
            context: {
                criticalCount: criticalViolations.length,
            }
        });

        // 3. Enforce blockage
        await this.policyEnforcementTool.blockPipeline(entityId);

        this.loggerTool.error(
            `GATING BLOCK triggered for ${entityId}. Critical violations found: ${criticalViolations.length}.`,
            { entityId, violations: report.auditSummary.violationCount }
        );
    }

    private async handleConditionalPass(report: GatingIntegrityAuditReport): Promise<void> {
        const entityId = report.entity.identifier;
        
        // Use the injected action extractor plugin to gather required actions
        const requiredActions = this.actionExtractorTool.extractConditionalActions(
            report.gatingChecks,
            AuditStatus.FAIL,
            CheckSeverity.CRITICAL
        );

        if (requiredActions.length > 0) {
            
            // Initiate mandatory external mitigation tracking (e.g., creating a JIRA ticket)
            const trackingId = await this.remediationServiceTool.initiateMitigation(entityId, requiredActions);

            this.loggerTool.warn(
                `CONDITIONAL PASS granted for ${entityId}. ${requiredActions.length} mitigation actions required. Tracking ID: ${trackingId}`,
                { entityId, trackingId }
            );

            // Notify relevant teams that tracking is active
            await this.alertingServiceTool.sendAlert({ 
                severity: CheckSeverity.MEDIUM, 
                message: `Conditional passage granted. Mitigation tracking initiated (ID: ${trackingId}) for ${entityId}.` 
            });
        } else {
            // Should theoretically not happen if the status is CONDITIONAL, but guards against empty lists.
            this.loggerTool.info(`Conditional status reported, but no explicit actions found for ${entityId}. Allowing passage.`);
        }
    }
}