const RcvConstraintVerifier = class {
    /**
     * @param {object} resourceInvariants - System resource limits (e.g., { PVLM_MAX: 100 }).
     * @param {object} failureHistoryDB - Service providing history lookup (e.g., isDependencyVerified).
     */
    constructor(resourceInvariants, failureHistoryDB) {
        this.invariants = resourceInvariants;
        this.history = failureHistoryDB;
    }

    /**
     * Executes rapid invariant check against proposed recovery state (Psi).
     * @param {object} rscmManifest - Resource Capture Manifest (must expose calculateIntegrityScore, captureTime).
     * @param {object} proposedTargetPsi - Proposed State Index (must expose pvlmLoadProjection, requiredDependencies, tier).
     * @returns {[boolean, string]} [success, message]
     */
    validateTransitionPath(rscmManifest, proposedTargetPsi) {
        // 1. PVLM Resource Allocation Check
        if (proposedTargetPsi.pvlmLoadProjection() > this.invariants.PVLM_MAX) {
            return [false, "PVLM Constraint Violation"];
        }
            
        // 2. Dependency Graph Check
        if (proposedTargetPsi.requiredDependencies) {
            for (const dep of proposedTargetPsi.requiredDependencies) {
                if (!this.history.isDependencyVerified(dep, rscmManifest.captureTime)) {
                    return [false, `Unverifiable Dependency: ${dep}`];
                }
            }
        }
        
        // 3. State Integrity Score Threshold (Only critical for RT-2)
        if (proposedTargetPsi.tier === 'RT-2') {
            const integrityScore = rscmManifest.calculateIntegrityScore();
            if (integrityScore < 0.995) {
                return [false, "RSCM Integrity Score below Critical Threshold"];
            }
        }

        return [true, "Constraints Met"];
    }
};

module.exports = RcvConstraintVerifier;