/**
 * RESOURCE ATTESTATION KERNEL (RAM Kernel)
 * ID: RAM-K01 (Strategic Orchestrator)
 * GSEP Role: Pre-execution resource integrity verification using A-07 (Autonomy Core telemetry).
 *
 * The RAM Kernel ensures the target environment meets minimum operational guarantees using
 * asynchronous, auditable Tool Kernels for all operations, adhering strictly to AIA mandates.
 */

class ResourceAttestationKernel {
    /**
     * @param {object} dependencies
     * @param {TelemetryAttestationConfigRegistryKernel} dependencies.telemetryAttestationConfigRegistry
     * @param {IAsyncCheckExecutionWrapperToolKernel} dependencies.asyncCheckExecutionWrapperTool
     * @param {MultiTargetAuditDisperserToolKernel} dependencies.multiTargetAuditDisperserTool
     * @param {IConsensusErrorCodesRegistryKernel} dependencies.consensusErrorCodesRegistry
     * @param {IExternalMetricExecutionToolKernel} dependencies.externalMetricExecutionTool
     * @param {CanonicalErrorFactory} dependencies.errorFactory
     */
    constructor({
        telemetryAttestationConfigRegistry,
        asyncCheckExecutionWrapperTool,
        multiTargetAuditDisperserTool,
        consensusErrorCodesRegistry,
        externalMetricExecutionTool,
        errorFactory
    }) {
        if (!telemetryAttestationConfigRegistry || !asyncCheckExecutionWrapperTool || !multiTargetAuditDisperserTool || !consensusErrorCodesRegistry || !externalMetricExecutionTool || !errorFactory) {
            throw new Error("KRNL_INIT_FAILURE: ResourceAttestationKernel missing required Tool Kernel dependencies.");
        }

        this._configRegistry = telemetryAttestationConfigRegistry;
        this._checkExecutor = asyncCheckExecutionWrapperTool;
        this._auditor = multiTargetAuditDisperserTool;
        this._errorCodes = consensusErrorCodesRegistry;
        this._metricSource = externalMetricExecutionTool; 
        this._errorFactory = errorFactory;
        
        this._attestationConfig = null;
    }

    /**
     * Asynchronously loads configuration and check definitions.
     */
    async initialize() {
        // Load configuration which includes baseline thresholds and check definitions
        this._attestationConfig = await this._configRegistry.loadConfiguration('attestation_checks');
        
        await this._auditor.recordAudit({
            level: 'INFO',
            message: 'RAM Kernel initialized and configuration loaded.',
            context: { configKeys: Object.keys(this._attestationConfig) }
        });
    }

    /**
     * Executes environmental checks necessary for stable mutation execution.
     *
     * @typedef {object} AttestationReport
     * @property {boolean} success - True if all checks passed.
     * @property {ReadonlyArray<{checkId: string, status: string, details: object, success: boolean}>} results - Detailed output.
     *
     * @param {object} payloadMetadata - Metadata detailing resources required by the mutation.
     * @returns {Promise<AttestationReport>} Structured report detailing check outcomes.
     */
    async executePreExecutionCheck(payloadMetadata) {
        if (!this._attestationConfig || !this._attestationConfig.checks) {
            throw this._errorFactory.create(
                this._errorCodes.getErrorCode('RAM_NOT_CONFIGURED'),
                'RAM configuration missing or invalid check definitions.'
            );
        }
        
        const checksToRun = this._attestationConfig.checks;
        const requiredResources = payloadMetadata.requiredResources || {};
        const payloadId = payloadMetadata.id || 'N/A';

        if (checksToRun.length === 0) {
            await this._auditor.recordAudit({
                level: 'WARN',
                message: 'RAM: Check Registry is empty. Bypassing attestation (Potential Security Risk).',
                context: { payloadId }
            });
            return { success: true, results: [] };
        }

        await this._auditor.recordAudit({
            level: 'INFO',
            message: `RAM: Initiating concurrent attestation of ${checksToRun.length} resources.`,
            context: { payloadId }
        });

        // 1. Map checks into executable promises using the IAsyncCheckExecutionWrapperToolKernel.
        const checkPromises = checksToRun.map(checkDef => {
            // Define the check execution function closure: fetches metrics and performs comparison.
            const checkFunction = async () => {
                // Delegate metric retrieval to the specialized tool kernel
                const currentMetric = await this._metricSource.executeMetricQuery(checkDef.metricId, requiredResources);

                // Perform local threshold check based on loaded configuration
                if (currentMetric >= checkDef.threshold) {
                    return { passed: true, metricValue: currentMetric, threshold: checkDef.threshold };
                } else {
                    // Failing the check function causes the wrapper to record a failure state
                    throw new Error(`Metric check failed: ${currentMetric} < ${checkDef.threshold}`);
                }
            };

            // Execute the check using the resilient wrapper, delegating all robust execution logic
            return this._checkExecutor.execute(
                checkDef.id, 
                checkFunction,
                { timeoutMs: checkDef.timeout || this._attestationConfig.defaultTimeout } 
            );
        });

        // 2. Execute all checks simultaneously.
        const checkResults = await Promise.all(checkPromises);

        // 3. Aggregate results and finalize report.
        const report = {
            success: true,
            results: checkResults.map(result => ({
                checkId: result.id,
                status: result.status,
                details: result.details,
                success: result: result.success
            }))
        };
        
        const failedChecks = report.results.filter(r => !r.success);

        if (failedChecks.length > 0) {
            report.success = false;
            
            await this._auditor.recordAudit({
                level: 'CRITICAL',
                message: 'RAM: Resource attestation failed one or more critical checks. Mutation execution halted.',
                context: { 
                    payloadId,
                    failedCheckCount: failedChecks.length,
                    failedChecksSummary: failedChecks.map(f => ({ id: f.checkId, status: f.status, error: f.details.error })) 
                }
            });
            
            // Throw standardized error referencing a registered code
            throw this._errorFactory.create(
                this._errorCodes.getErrorCode('RAM_ATTESTATION_FAILURE'),
                'Resource attestation failed due to critical resource checks failing.',
                { report, payloadId }
            );
        }

        await this._auditor.recordAudit({
            level: 'INFO',
            message: "RAM: Attestation passed successfully.",
            context: { payloadId }
        });
        
        return report;
    }
}

module.exports = ResourceAttestationKernel;