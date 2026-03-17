/**
 * AxiomComplianceValidator v94.1: Optimized for maximum computational efficiency 
 * via rule indexing and recursive descent validation architecture.
 * Ensures adherence to immutable architectural Axioms.
 */
class AxiomComplianceValidator {
    // Use static private field for axioms for zero-cost initialization post-load
    static #AXIOM_MAP = null;

    constructor(config) {
        this.config = config;
        // Lazy initialization and structure locking for guaranteed integrity and speed
        if (!AxiomComplianceValidator.#AXIOM_MAP) {
            AxiomComplianceValidator.#AXIOM_MAP = this._initializeAxiomRegistry();
            // Enforce immutability for the rule set once loaded
            Object.freeze(AxiomComplianceValidator.#AXIOM_MAP);
        }
        this.mandatoryAxioms = AxiomComplianceValidator.#AXIOM_MAP;
    }

    /**
     * Pre-indexes axioms into a Map keyed by validation scope (e.g., 'IO', 'CODE')
     * for O(1) retrieval and rapid traversal, enhancing computational efficiency.
     * @returns {Map<string, Object>} Map structure: { Scope -> Array<Axiom> }
     */
    _initializeAxiomRegistry() {
        const axioms = [
            { id: "A94_001", severity: "CRITICAL", scope: "IO", rule: "External I/O must pass through SecureProxy.", checkFn: (code) => /fs\.|http\.|os\.open/.test(code) },
            { id: "A94_002", severity: "HIGH", scope: "SERVICE", rule: "Implement structured logging via TelemetryService.", checkFn: (manifest) => !manifest.telemetryEnabled },
            { id: "A94_003", severity: "MEDIUM", scope: "METRICS", rule: "Code complexity (Cyclomatic) must not exceed 20.", checkFn: (metrics) => metrics.complexity > 20 }
        ];

        const axiomMap = new Map();
        for (const axiom of axioms) {
            if (!axiomMap.has(axiom.scope)) {
                axiomMap.set(axiom.scope, []);
            }
            axiomMap.get(axiom.scope).push(axiom);
        }
        return axiomMap;
    }

    /**
     * Core Recursive Validation Engine: Embodies recursive abstraction by traversing 
     * artifact components and applying specialized, scoped rules (O(1) lookup).
     * Implements a Fail-Fast mechanism for CRITICAL breaches.
     * 
     * @param {string} scopeKey - Key defining the current structural component (e.g., 'SERVICE', 'IO').
     * @param {*} componentData - The data object corresponding to the scope.
     * @param {Array<Object>} issues - Accumulated list of compliance issues (mutated).
     * @returns {void} 
     */
    _recursiveValidatorEngine(scopeKey, componentData, issues) {
        // O(1) lookup of rules relevant to the current scope
        const scopedAxioms = this.mandatoryAxioms.get(scopeKey);

        if (!scopedAxioms || !componentData) {
            return;
        }

        for (const axiom of scopedAxioms) {
            // Execute the specialized check function pointer
            if (axiom.checkFn && axiom.checkFn(componentData)) {
                issues.push({ 
                    axiomId: axiom.id, 
                    severity: axiom.severity, 
                    message: axiom.rule 
                });
                
                // Fail-Fast Optimization
                if (axiom.severity === "CRITICAL") {
                    throw new Error("CRITICAL_AXIOM_BREACH");
                }
            }
        }
        
        // Recursive Abstraction Example: Traverse sub-structures if applicable
        if (scopeKey === 'SERVICE' && componentData.subComponents) {
            for (const sub of componentData.subComponents) {
                this._recursiveValidatorEngine(sub.type, sub.data, issues);
            }
        }
    }


    /**
     * Primary entry point for artifact validation.
     * Decomposes artifact and applies validation hierarchy.
     */
    validate(compilationArtifact) {
        const issues = [];
        
        if (!compilationArtifact || !compilationArtifact.sourceCode || !compilationArtifact.manifest) {
            issues.push({ axiomId: "SYS_001", severity: "CRITICAL", message: "Artifact payload is invalid or incomplete." });
            return issues;
        }

        const { sourceCode, manifest, metrics } = compilationArtifact;

        try {
            // Execute least expensive checks first (Manifest/Metrics) to enable fast failure.
            this._recursiveValidatorEngine("SERVICE", manifest, issues);
            this._recursiveValidatorEngine("METRICS", metrics || { complexity: 0 }, issues);

            // Execute most expensive check (Source Code/IO analysis) last.
            this._recursiveValidatorEngine("IO", sourceCode, issues);

        } catch (e) {
            if (e.message === "CRITICAL_AXIOM_BREACH") {
                // Return immediate issues if a Critical Axiom was breached (Fail-Fast)
                return issues;
            }
            throw e; 
        }

        return issues;
    }

    isCompliant(artifact) {
        try {
            return this.validate(artifact).length === 0;
        } catch (e) {
            // Catches internal critical breach exceptions triggered by Fail-Fast
            return false;
        }
    }
}

module.exports = AxiomComplianceValidator;