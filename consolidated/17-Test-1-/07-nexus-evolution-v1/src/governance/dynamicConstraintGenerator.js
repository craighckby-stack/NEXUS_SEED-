const { CONSTANTS, MUTATION_KEYS } = require('./governanceConstants'); 
// Assuming an integrated logging service, falling back to console if not globally defined.
const Logger = global.SovereignLogger || console;

/**
 * DCG: Dynamic Constraint Generator
 * V94.2 SOVEREIGN REFACTOR - Constraint Derivation and Policy Integrity.
 * Translates refined governance model insights (GMRE/SEA) into validated,
 * concrete M-01 executable constraint updates for the GRS (Governance Rule Source).
 * Enhanced reliability via integrated constant mapping and forced package integrity hashing.
 */
class DynamicConstraintGenerator {
    /**
     * @param {Object} governanceRuleSource - Interface to GRS for current rule context.
     * @param {Object} refinementEngine - Source of high-level proposals (GMRE).
     * @param {Object} validator - REQUIRED schema validator instance (e.g., Joi, AJV).
     * @param {Object} sovereignUtils - REQUIRED utility for hashing, UUID, etc. (Expected to be the unified /utility module)
     */
    constructor(governanceRuleSource, refinementEngine, validator, sovereignUtils) {
        if (!validator || !sovereignUtils) {
            Logger.error("DCG Initialization Error: Required dependencies (validator, sovereignUtils) are missing.");
            throw new Error("DCG Initialization Error: Required dependencies (validator, sovereignUtils) are missing.");
        }
        this.GRS = governanceRuleSource;
        this.GMRE = refinementEngine;
        this.validator = validator;
        this.utils = sovereignUtils; // Renamed for brevity
    }

    /**
     * Translates the refinement proposal into a formal, executable M-01 policy package.
     * Includes necessary input validation and contextual relevance checks against the current GRS state.
     * @param {Object} refinementProposal - Output from the Governance Model Refinement Engine.
     * @returns {Promise<Object|null>} M-01 Package containing required updates for GRS, or null if no actionable changes are derived.
     */
    async generatePolicyUpdate(refinementProposal) {
        if (!refinementProposal || typeof refinementProposal !== 'object' || Object.keys(refinementProposal).length === 0) {
            Logger.error(CONSTANTS.E101_EMPTY_PROPOSAL);
            throw new Error(CONSTANTS.E101_EMPTY_PROPOSAL);
        }

        // 1. Validation Trace (Mandatory for policy changes)
        await this._validateInputProposal(refinementProposal);

        // 2. Fetch current GRS context for contextual derivation
        const currentGRSContext = await this.GRS.fetchContextSnapshot();
        
        // 3. Derivation
        const newConstraints = this._mapProposalToConstraints(refinementProposal, currentGRSContext);
        
        if (Object.keys(newConstraints).length === 0) {
            Logger.info(`${CONSTANTS.W203_ZERO_ACTIONS} against context ${currentGRSContext.timestamp}.`);
            return null;
        }
        
        // 4. M-01 Package Creation
        const m01Package = {
            intentId: this.utils.generateUUID('DCG-M01'), 
            timestamp: new Date().toISOString(),
            sourceEngine: CONSTANTS.VERSION,
            targetComponent: 'GRS',
            mutationType: MUTATION_KEYS.POLICY_UPDATE,
            metadata: {
                gmreProposalId: refinementProposal.proposalId || 'N/A',
                contextSnapshotTime: currentGRSContext.timestamp,
                derivedConstraintCount: Object.keys(newConstraints).length,
            },
            payload: newConstraints
        };

        // 5. Finalization (Hashing and Integrity Check)
        return this._finalizeM01Package(m01Package);
    }

    /**
     * Deterministically maps GMRE metrics to structured GRS constraints, leveraging current context.
     * @private
     */
    _mapProposalToConstraints(proposal, context) {
        const updates = {};
        
        // S-02 Adjustment Derivation (Risk Floors)
        if (proposal.optimalS02Adjustment !== undefined && Math.abs(proposal.optimalS02Adjustment) > CONSTANTS.MIN_ACTIONABLE_DELTA) {
            updates[MUTATION_KEYS.S02_RISK_FLOOR_DELTA] = proposal.optimalS02Adjustment;
        }

        // S-03 Hard Policy Derivation (Veto Rules)
        if (Array.isArray(proposal.recommendedVetoRules) && proposal.recommendedVetoRules.length > 0) {
             // Filter out any rules already present (ensuring idempotence)
            const rulesToAdd = proposal.recommendedVetoRules.filter(
                rule => !context.activeVetoRules.some(existing => existing.ruleId === rule.ruleId)
            );
            
            if (rulesToAdd.length > 0) {
                updates[MUTATION_KEYS.S03_VETO_RULES_ADD] = rulesToAdd;
            }
        }

        return updates;
    }
    
    /** 
     * @private Ensures input conformity against a known governance schema. 
     */
    async _validateInputProposal(proposal) {
        // NOTE: Assume M01PolicySchema is accessible. Replaced synchronous require with clearer context call.
        const { RefinementProposalSchema } = require('./schemas/M01PolicySchema'); 
        
        const validationResult = await this.validator.validate(proposal, RefinementProposalSchema);
        
        if (validationResult.error) {
            const errorDetails = validationResult.error.details.map(d => d.message).join('; ');
            Logger.error(`DCG (E302) Input Validation Failure: ${errorDetails}`);
            // Throw structured error for programmatic handling
            throw Object.assign(new Error("Policy proposal failed input schema validation."), { 
                code: 'DCG_E302_VALIDATION', 
                details: errorDetails 
            });
        }
    }
    
    /** @private Applies final auditing steps, such as integrity hashing. */
    _finalizeM01Package(m01Package) {
        // V94.2: Inject cryptographic hash for M-01 package integrity.
        m01Package.integrityHash = this.utils.generateSha256(JSON.stringify(m01Package.payload));
        return m01Package;
    }
}

module.exports = DynamicConstraintGenerator;