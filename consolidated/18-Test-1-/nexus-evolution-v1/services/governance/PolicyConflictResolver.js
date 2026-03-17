const PolicyPrecedenceEngine = require('./plugins/PolicyPrecedenceEngine');

/**
 * PolicyConflictResolverKernel
 * Manages the resolution process by filtering applicable policies
 * and using a dedicated Precedence Engine for conflict resolution logic.
 */
class PolicyConflictResolverKernel {
    #comparator;
    #precedenceRules;

    /**
     * @param {Array<string>} [precedenceRules] - Ordered list of rules (e.g., 'explicitDeny', 'specificity').
     */
    constructor(precedenceRules) {
        this.#precedenceRules = precedenceRules;
        this.#setupDependencies();
    }

    // --- SETUP & VALIDATION ---

    /**
     * Extracts synchronous dependency validation and assignment.
     * Ensures the Precedence Engine is correctly instantiated with rules.
     */
    #setupDependencies() {
        const defaultRules = ['explicitDeny', 'specificity', 'latest'];
        
        let effectiveRules = this.#precedenceRules;
        
        if (!Array.isArray(effectiveRules) || effectiveRules.length === 0) {
            // Use defaults if rules were not explicitly provided or invalid
            effectiveRules = defaultRules;
        }

        this.#precedenceRules = effectiveRules; 
        
        // Instantiate the required internal dependency
        this.#comparator = new PolicyPrecedenceEngine(this.#precedenceRules);
    }
    
    // --- INTERNAL CRITICAL LOGIC HELPERS ---

    /**
     * Determines if a policy's conditions are met by the current context.
     * @private
     */
    #checkIfPolicyApplies(policy, context) {
        // Placeholder logic: requires actual condition evaluation against context
        return policy.active !== false && policy.target.match(context);
    }
    
    /**
     * Filters the raw list of policies to only include those relevant to the context.
     */
    #filterApplicablePolicies(policies, context) {
        if (!policies || policies.length === 0) {
            return [];
        }
        return policies.filter(p => this.#checkIfPolicyApplies(p, context));
    }

    // --- I/O PROXIES (DELEGATION) ---

    /**
     * Delegates the policy comparison logic to the internal Precedence Engine.
     * @returns {number} 1 if candidate wins, -1 if winner retains, 0 if tie.
     */
    #delegateToComparatorCompare(candidate, winner) {
        // PolicyPrecedenceEngine is treated as a critical external utility for calculation.
        return this.#comparator.compare(candidate, winner);
    }

    // --- EXECUTION CORE ---
    
    /**
     * Executes the iterative tournament approach for resolution among applicable policies.
     */
    #executeResolutionTournament(applicablePolicies) {
        if (applicablePolicies.length < 2) {
            return applicablePolicies[0] || null;
        }
        
        let winningPolicy = applicablePolicies[0];

        for (let i = 1; i < applicablePolicies.length; i++) {
            const candidate = applicablePolicies[i];
            
            // Use I/O Proxy for comparison
            const comparisonResult = this.#delegateToComparatorCompare(candidate, winningPolicy);

            if (comparisonResult === 1) {
                // Candidate wins
                winningPolicy = candidate;
            } 
            // If -1 or 0, winningPolicy retains its status.
        }
        return winningPolicy;
    }


    /**
     * Resolves conflicts among a list of policies.
     * This uses an iterative tournament approach, relying on the external comparator.
     * @param {Array<Object>} policies - List of policy objects.
     * @param {Object} context - The operational context.
     * @returns {Object|null} The single winning policy, or null.
     */
    resolve(policies, context) {
        // 1. Filter policies applicable to the context
        const applicablePolicies = this.#filterApplicablePolicies(policies, context);

        if (applicablePolicies.length === 0) {
            return null;
        }

        // 2. Iteratively compare candidates against the running winner
        return this.#executeResolutionTournament(applicablePolicies);
    }
}

module.exports = PolicyConflictResolverKernel;