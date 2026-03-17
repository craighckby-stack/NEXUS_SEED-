/**
 * @fileoverview The Conceptual Integrity Kernel (CIK).
 * This service enforces consistency between codified AGI/ARCH concepts and code artifacts, 
 * system states, or proposed mutations by delegating policy enforcement.
 * 
 * It ensures 'concept drift' is prevented.
 */

// NOTE: Dependencies are injected via the constructor.

const CRITICAL_STATUSES = ['Critical Core', 'Critical Consensus'];
const SCOPE = {
    ARTIFACT: 'artifact',
    SYSTEMIC: 'systemic'
};

/**
 * The Conceptual Integrity Kernel (CIK).
 * Central service for enforcing core architectural and code concepts during mutations.
 */
class ConceptualIntegrityKernel {
    
    /** @type {IConceptIdRegistryKernel} */
    #conceptRegistry;
    /** @type {IConceptualPolicyEvaluatorKernel} */
    #policyEvaluator;

    static CRITICAL_STATUSES = CRITICAL_STATUSES;
    static SCOPE = SCOPE;

    /**
     * @param {{conceptRegistry: IConceptIdRegistryKernel, policyEvaluator: IConceptualPolicyEvaluatorKernel}} dependencies 
     */
    constructor(dependencies) {
        this.#setupDependencies(dependencies);
    }
    
    async initialize() {
        // Mandatory async initialization hook
    }

    #setupDependencies(dependencies) {
        if (!dependencies.conceptRegistry) {
            throw new Error("ConceptualIntegrityKernel: Missing IConceptIdRegistryKernel dependency ('conceptRegistry').");
        }
        if (!dependencies.policyEvaluator) {
            throw new Error("ConceptualIntegrityKernel: Missing IConceptualPolicyEvaluatorKernel dependency ('policyEvaluator').");
        }
        this.#conceptRegistry = dependencies.conceptRegistry;
        this.#policyEvaluator = dependencies.policyEvaluator;
    }

    /**
     * Executes fast-fail checks (critical path modification) and delegates policy execution.
     * @param {Object} concept
     * @param {Object} context The operational context, including file path if applicable.
     * @returns {{isValid: boolean, message: string, violations: Array<Object>}}
     */
    #executeValidation(concept, context) {
        const { scope, filePath, requiresCriticalReview } = context;

        // 1. Critical Implementation Path Check (Fast failure if unflagged review needed)
        if (scope === SCOPE.ARTIFACT && concept.implementationPath) {
            if (CRITICAL_STATUSES.includes(concept.status) && filePath === concept.implementationPath) {
                if (!requiresCriticalReview) {
                    return {
                        isValid: false,
                        message: `Critical path modification detected (${concept.name}). Requires explicit 'Critical Review' flag.`,
                        violations: [{ ruleId: 'CRIT_PATH_MOD', details: `Path: ${concept.implementationPath}` }]
                    };
                }
            }
        }

        // 2. Execution of Declarative Conceptual Policies
        const policyResult = this.#policyEvaluator.executePolicies(concept, context);

        if (!policyResult.isValid) {
            return {
                isValid: false,
                message: `[${concept.name}] Policy adherence failed: ${policyResult.violations.length} violation(s) found.`,
                violations: policyResult.violations
            };
        }

        return { isValid: true, message: 'Adherence validated.', violations: [] };
    }

    /**
     * Groups all relevant concepts into artifact-specific and systemic categories in one iteration.
     */
    #groupConcepts(allConcepts) {
        const relevantConcepts = allConcepts.filter(c => 
            c.implementationPath || c.constraints || c.scope
        );

        const artifactConcepts = relevantConcepts.filter(c => 
            c.implementationPath || c.scope === SCOPE.ARTIFACT
        );

        // Includes concepts that are explicitly systemic OR lack path definition (implying system check)
        const systemicConcepts = relevantConcepts.filter(c => 
            c.scope === SCOPE.SYSTEMIC || (!c.implementationPath && !c.scope)
        );
        
        return { artifactConcepts, systemicConcepts };
    }

    /**
     * Processes concepts tied to specific file artifacts against the proposal's changes.
     */
    #runArtifactChecks(proposal, artifactConcepts) {
        const driftReports = [];
        const affectedFiles = proposal.affectedFiles || [];
        
        const baseContext = {
            scope: SCOPE.ARTIFACT,
            requiresCriticalReview: proposal.requiresCriticalReview,
            proposalId: proposal.id,
            metadata: proposal.metadata || {}
        };

        for (const concept of artifactConcepts) {
            for (const fileChange of affectedFiles) {
                
                // Optimized Path Match Skip
                if (concept.implementationPath && concept.implementationPath !== fileChange.path) {
                    continue; 
                }

                const context = {
                    ...baseContext,
                    filePath: fileChange.path,
                    mutationType: fileChange.type, // ADD, MODIFY, DELETE
                    contentDiff: fileChange.diff,
                    contentBefore: fileChange.contentBefore, 
                    contentAfter: fileChange.contentAfter
                };

                const adherenceResult = this.#executeValidation(concept, context);

                if (!adherenceResult.isValid) {
                    driftReports.push({
                        conceptId: concept.id,
                        name: concept.name,
                        status: concept.status,
                        isValid: false,
                        violations: adherenceResult.violations,
                        triggeredByFile: fileChange.path
                    });
                    // Optimization: Fail fast for this specific concept.
                    break; 
                }
            }
        }

        return driftReports;
    }

    /**
     * Processes concepts that are systemic (architectural invariants, configuration changes).
     */
    #runSystemicChecks(proposal, systemicConcepts) {
        const driftReports = [];

        const context = {
            scope: SCOPE.SYSTEMIC,
            requiresCriticalReview: proposal.requiresCriticalReview,
            proposalId: proposal.id,
            affectedFilesSummary: proposal.affectedFiles ? proposal.affectedFiles.map(f => ({ path: f.path, type: f.type })) : [],
            proposalDetails: proposal 
        };

        for (const concept of systemicConcepts) {
            // Systemic checks use the general proposal context, no specific filePath trigger.
            const adherenceResult = this.#executeValidation(concept, context);

            if (!adherenceResult.isValid) {
                driftReports.push({
                    conceptId: concept.id,
                    name: concept.name,
                    status: concept.status,
                    isValid: false,
                    violations: adherenceResult.violations,
                    triggeredByFile: null 
                });
            }
        }

        return driftReports;
    }
    
    // --- Public Interface ---

    /**
     * Public interface for validating a single concept against a context.
     * @param {string} conceptId
     * @param {Object} context
     * @returns {Promise<Object>}
     */
    async validateConcept(conceptId, context) {
        const concept = this.#conceptRegistry.getConceptById(conceptId);
        if (!concept) {
            return { isValid: false, message: `Concept ID ${conceptId} is undefined.`, violations: [] };
        }
        // Policy execution remains synchronous unless delegated policy execution is async.
        return this.#executeValidation(concept, context);
    }

    /**
     * Scans a mutation proposal for concept drift.
     * @param {Object} proposal
     * @returns {Promise<Array<Object>>}
     */
    async scanProposalForConceptDrift(proposal) {
        if (!proposal || typeof proposal !== 'object') {
             return [{
                conceptId: 'CIE_INIT',
                name: 'Input Validation',
                status: 'Error',
                isValid: false,
                violations: [{ ruleId: 'PROPOSAL_INVALID', details: 'Proposal object is null or invalid.' }],
                triggeredByFile: null
            }];
        }
        
        const allConcepts = this.#conceptRegistry.getAllConcepts();
        
        // Group concepts once for optimized iteration
        const { artifactConcepts, systemicConcepts } = this.#groupConcepts(allConcepts);

        const artifactReports = this.#runArtifactChecks(proposal, artifactConcepts);
        const systemicReports = this.#runSystemicChecks(proposal, systemicConcepts);
        
        return [...artifactReports, ...systemicReports];
    }
}