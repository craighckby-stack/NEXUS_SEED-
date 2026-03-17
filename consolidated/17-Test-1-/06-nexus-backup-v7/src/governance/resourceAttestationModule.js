/**
 * RESOURCE ATTESTATION MODULE (RAM)
 * ID: RAM-G01 (Orchestrator Role)
 * GSEP Role: Pre-execution resource integrity verification using A-07 (Autonomy Core telemetry).
 *
 * The RAM ensures that the target environment and the Autogeny Sandbox (C-04)
 * are provisioned correctly and meet minimum operational guarantees. This prevents
 * Mutation Failure Due to Environmental Drift (MFDED) and enhances rollback safety.
 */

const AttestationFailureRecord = require('./AttestationFailureRecord');

/**
 * Internal utility function to wrap and standardize asynchronous check execution.
 * Ensures consistent result formatting and handles internal check failures gracefully.
 * @param {string} name - The identifier for the check.
 * @param {function(): Promise<{success: boolean, details: object}>} promiseFn - The asynchronous function executing the check logic.
 * @returns {Promise<object>} Structured result object.
 */
const runCheck = async (name, promiseFn) => {
    try {
        // Execute the check provided by the registry
        const result = await promiseFn();
        
        // Ensure result adheres to expected structure { success: boolean, details: object }
        const success = typeof result.success === 'boolean' ? result.success : false; 
        
        return {
            check: name,
            status: success ? 'PASS' : 'FAIL',
            details: result.details || {},
            success: success
        };
    } catch (error) {
        // Catch errors originating from the check implementation or Monitor resolution
        return {
            check: name,
            status: 'ERROR',
            details: { message: `CRITICAL error during check execution: ${error.message}`, stack: error.stack },
            success: false
        };
    }
};

class ResourceAttestationModule {
    /**
     * @param {object} config - The baseline configuration and thresholds.
     * @param {object} environmentMonitor - The telemetry source for real-time resource data.
     * @param {object} checkRegistry - The centralized source of all defined resource checks.
     */
    constructor(config, environmentMonitor, checkRegistry) {
        if (!config || !environmentMonitor || !checkRegistry) {
            // Updated failure record to reflect new dependency requirement
            throw new AttestationFailureRecord('RAM_INIT_001', 'Initialization failed: Missing config, environment monitor, or CheckRegistry dependency.');
        }
        this.baselineConfig = config;
        this.environmentMonitor = environmentMonitor;
        this.checkRegistry = checkRegistry;
        
        console.log('RAM-G01 initialized. Using Check Registry for flexible attestations.');
    }

    /**
     * Executes environmental checks necessary for stable mutation execution.
     * Must pass prior to Architectural Staging Lock (EPDP D).
     *
     * @typedef {object} AttestationReport
     * @property {boolean} success - True if all checks passed.
     * @property {Array<{check: string, status: string, details: object}>} results - Detailed output of each check.
     *
     * @param {object} payloadMetadata - Metadata detailing resources required by the mutation (e.g., requiredResources).
     * @returns {Promise<AttestationReport>} Structured report detailing check outcomes.
     */
    async executePreExecutionCheck(payloadMetadata) {
        const requiredResources = payloadMetadata.requiredResources || {};
        const checksToRun = this.checkRegistry.getChecks(); 

        if (checksToRun.length === 0) {
            console.warn("RAM-G01: Check Registry is empty. Bypassing attestation (Potential Security Risk).");
            return { success: true, results: [] };
        }

        console.log(`RAM-G01: Initiating concurrent attestation of ${checksToRun.length} resources (Payload: ${payloadMetadata.id || 'N/A'}).`);

        // 1. Map checks from the registry into executable promises wrapped by runCheck
        const checkPromises = checksToRun.map(check => 
            runCheck(check.id, () => check.execute(requiredResources, this.environmentMonitor, this.baselineConfig))
        );

        // 2. Execute all checks simultaneously.
        const checkResults = await Promise.all(checkPromises);

        // 3. Aggregate results and finalize report.
        const report = {
            success: true,
            results: []
        };

        checkResults.forEach(result => {
            report.results.push({
                check: result.check,
                status: result.status,
                details: result.details
            });
            if (!result.success) {
                report.success = false;
            }
        });

        if (!report.success) {
             // Throw standardized record containing the full failure report
             throw new AttestationFailureRecord('RAM_CHECK_FAIL', 'Resource attestation failed one or more critical checks. Mutation execution halted.', { report });
        }

        console.log("RAM-G01: Attestation passed successfully.");
        return report;
    }
}

module.exports = ResourceAttestationModule;