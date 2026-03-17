/**
 * SAG V94.2 - GAX Policy Remediation Proposer
 * Utilizes failure reports from the Formal Verification Unit to suggest minimal, consistent policy changes.
 * Focuses on robust failure categorization and intelligent delegation to the Policy Structure Model solver.
 */

const GAXTelemetry = require('../../core/Telemetry/GAXTelemetryService.js');
const PolicyStructureModel = require('../../core/Policy/PolicyStructureModel.js');

/**
 * Standardizes the failure result object for robust structural analysis.
 * @param {VerificationResult} verificationResult
 * @returns {{ violations: Array<Constraint>, resultCategory: string, isVerified: boolean }}
 */
function extractViolationContext(verificationResult) {
    // Ensure essential properties exist, even if null/empty arrays
    const violations = Array.isArray(verificationResult.failureConstraints) ? verificationResult.failureConstraints : [];
    const resultCategory = verificationResult.resultCategory || 'UNKNOWN_CATEGORY';
    const isVerified = verificationResult.isVerified === true;

    return { violations, resultCategory, isVerified };
}


/**
 * Analyzes verification failure constraints to propose a minimal policy delta that resolves the conflict.
 *
 * @param {VerificationResult} verificationResult - The full failure report from PolicyFormalVerificationUnit.
 * @param {PolicyDelta} originalProposedDelta - The delta that caused the failure.
 * @returns {Promise<{ success: boolean, delta: PolicyDelta|null, message: string, detail?: object }>}
 */
async function proposeRemediation(verificationResult, originalProposedDelta) {
    if (!verificationResult || !originalProposedDelta) {
        GAXTelemetry.error('PRP_INVALID_INPUT', { reason: 'Missing verification result or original delta.' });
        return { success: false, delta: null, message: 'Invalid input parameters provided.' };
    }

    const { violations, resultCategory, isVerified } = extractViolationContext(verificationResult);
    const proposalId = GAXTelemetry.generateRunId('PRP');

    if (isVerified || resultCategory !== 'AXIOMATIC_VIOLATION') {
        GAXTelemetry.publish('PRP_SKIP', { proposalId, category: resultCategory });
        return { 
            success: false, 
            delta: null, 
            message: `Verification was successful or failure type (${resultCategory}) is not actionable for automatic remediation.` 
        };s
    }

    if (violations.length === 0) {
        GAXTelemetry.warn('PRP_INCOMPLETE_REPORT', { proposalId, category: resultCategory });
        return { success: false, delta: null, message: 'Axiomatic failure detected but no specific constraints provided for analysis.' };
    }

    GAXTelemetry.publish('PRP_START', { proposalId, violationCount: violations.length, category: resultCategory });

    try {
        // High-Intelligence Delegation: Pass violations and context to the structural solver.
        // Providing context allows the model to select specialized solving algorithms.
        const repairSolution = await PolicyStructureModel.findMinimalConsistencyDelta(
            originalProposedDelta,
            violations,
            { context: resultCategory }
        );

        if (repairSolution && Object.keys(repairSolution).length > 0) {
            GAXTelemetry.success('PRP_COMMIT', {
                proposalId,
                deltaKeys: Object.keys(repairSolution).length
            });
            
            return {
                success: true,
                delta: repairSolution,
                message: `Remediation successful: Generated minimal delta resolving ${violations.length} conflicts.`
            };
        } else {
            GAXTelemetry.warn('PRP_SOLVER_FAILURE', { proposalId, detail: 'Solver reported an empty or null solution set.' });
            return { 
                success: false, 
                delta: null, 
                message: 'Remediation solver failed to find a valid non-contradictory repair delta.' 
            };
        }
    } catch (error) {
        // Catch exceptions from the PolicyStructureModel
        GAXTelemetry.error('PRP_SOLVER_EXCEPTION', { proposalId, message: error.message, stack: error.stack });
        return { 
            success: false, 
            delta: null, 
            message: `Critical error encountered during structural solving: ${error.message}` 
        };
    }
}

module.exports = { proposeRemediation };
