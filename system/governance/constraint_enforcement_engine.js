/**
 * Constraint Enforcement Engine (CEE)
 * Version 4.0 - Sovereign AGI v94.1 Refactor
 * Converts CEE to be asynchronous, uses explicit typed context (AnalysisContext),
 * and centralizes constraint definitions for dynamic runtime access.
 */

import { ConstraintsConfig } from './acvd_constraints.json'; 
import { SyntaxAnalyzer } from '../utilities/syntax_analyzer'; 
import { EntropyScorer } from '../utilities/entropy_scorer';
import { ScopeMatcher } from '../utilities/scope_matcher'; 
import { SystemLogger } from '../system_core/system_logger'; 

// IMPORTANT: Requires the creation of ConstraintAnalysisBroker (CAB) for efficient metric gathering.
import { ConstraintAnalysisBroker } from './constraint_analysis_broker'; 

// Define standardized violation types
const ViolationType = {
    COMPLEXITY: 'Complexity',
    SAFETY: 'Safety',
    QUALITY: 'Quality',
    ARCHITECTURE: 'Architecture',
    GOVERNANCE: 'Governance' // Added for internal CEE failures/missing components
};

/**
 * @typedef {Object} AnalysisContext
 * @property {Object} [syntax] - Output of SyntaxAnalyzer (e.g., ast, complexity). Only present if required.
 * @property {number} [entropy] - Output of EntropyScorer. Only present if required.
 */


export class ConstraintEnforcementEngine {
    
    /**
     * @param {Object} [dependencies] - Optional injected dependencies for testing/flexibility.
     */
    constructor(dependencies = {}) {
        // Decoupled Dependencies (Dependency Injection)
        this.constraints = dependencies.constraints || ConstraintsConfig;
        this.scopeMatcher = dependencies.scopeMatcher || new ScopeMatcher();
        
        // The analysis broker handles the intelligent pre-processing of code metrics
        this.analysisBroker = dependencies.analysisBroker || new ConstraintAnalysisBroker({
            syntaxAnalyzer: dependencies.syntaxAnalyzer || new SyntaxAnalyzer(),
            entropyScorer: dependencies.entropyScorer || new EntropyScorer()
        });

        this.logger = dependencies.logger || new SystemLogger('CEE');
        
        this.ruleHandlers = {
            COMPLEXITY_THRESHOLD: this._checkComplexityThreshold.bind(this),
            FORBIDDEN_PATTERNS: this._checkForbiddenPatterns.bind(this),
            ENTROPY_DENSITY: this._checkEntropyDensity.bind(this),
        };
        
        this.logger.info(`CEE initialized with ${this.constraints.constraint_sets.length} constraint sets.`);
        this._sortedConstraintSets = this._sortConstraints(this.constraints.constraint_sets);
    }

    _sortConstraints(sets) {
         const levelMap = { 'CRITICAL': 3, 'MAJOR': 2, 'MINOR': 1, 'INFO': 0 };
         return sets.sort((a, b) => (levelMap[b.enforcement_level] || 0) - (levelMap[a.enforcement_level] || 0));
    }

    /**
     * Executes a specific rule check asynchronously.
     * @param {string} filePath 
     * @param {string} fileContent 
     * @param {Object} rule 
     * @param {AnalysisContext} context - Pre-calculated metrics and required data.
     * @returns {Promise<Object|null>} Violation object or null.
     */
    async _executeCheck(filePath, fileContent, rule, context) {
        const handler = this.ruleHandlers[rule.type];
        if (!handler) {
            this.logger.warn(`No handler defined for rule type: ${rule.type}. Rule skipped.`);
            return null;
        }

        try {
            // Handlers are synchronous for performance but executed within an async wrapper
            return handler(filePath, fileContent, rule, context);
        } catch (error) {
            this.logger.error(`Rule execution failed for ${rule.type} on ${filePath}:`, error);
            return {
                rule: "SYSTEM_FAILURE_CEE",
                type: ViolationType.GOVERNANCE, 
                level: "CRITICAL",
                message: `Internal CEE failure during ${rule.type} check execution.`, 
                data: { ruleId: rule.name, error: error.message }
            };
        }
    }

    /**
     * Validates a target code file against all relevant governance rules.
     * Optimized by only generating the necessary analysis context.
     * @param {string} filePath - Path to the file being validated.
     * @param {string} fileContent - The content of the file.
     * @returns {Promise<Array<Object>>} List of violations found.
     */
    async validate(filePath, fileContent) {
        const violations = [];
        const activeRules = [];
        
        // 1. Determine which rules apply to this file scope
        for (const set of this._sortedConstraintSets) {
            for (const rule of set.rules) {
                if (this.scopeMatcher.isMatch(filePath, rule.scope)) {
                    rule.enforcement_level = rule.enforcement_level || set.enforcement_level;
                    activeRules.push(rule);
                }
            }
        }
        
        if (activeRules.length === 0) {
            return violations;
        }
        
        // 2. Intelligent Pre-analysis using the Broker
        /** @type {AnalysisContext} */
        const context = await this.analysisBroker.getContext(fileContent, activeRules);

        // 3. Iteration and Enforcement
        for (const rule of activeRules) {
            const violation = await this._executeCheck(filePath, fileContent, rule, context);
            
            if (violation) {
                violations.push(violation);
                // Intelligence: Stop immediately on CRITICAL violations
                if (violation.level === 'CRITICAL') {
                    this.logger.warn(`Critical violation detected in ${filePath}. Halting further rule checks for this file.`);
                    break;
                }
            }
        }

        return violations;
    }

    // --- Rule Handlers ---

    _checkComplexityThreshold(filePath, fileContent, rule, context) {
        const complexity = context.syntax?.cyclomaticComplexity; 

        if (complexity === undefined) {
             this.logger.error(`Context missing required 'syntax.cyclomaticComplexity' for rule ${rule.name}.`);
             return null; // Broker failed to provide required data
        }

        if (complexity > rule.details.limit) {
            return { 
                rule: rule.name, 
                type: ViolationType.COMPLEXITY, 
                level: rule.enforcement_level, 
                message: `Code complexity (${complexity}) exceeds threshold (${rule.details.limit}).`,
                data: { complexity, limit: rule.details.limit }
            };
        }
        return null;
    }

    _checkForbiddenPatterns(filePath, fileContent, rule, context) {
        const { structural_patterns, regex_patterns } = rule.details;
        const syntaxAnalyzer = this.analysisBroker.syntaxAnalyzer;

        // 1. Check structural/AST patterns 
        if (structural_patterns && context.syntax?.ast) {
            for (const structuralId of structural_patterns) {
                if (syntaxAnalyzer.matchStructuralPattern(context.syntax.ast, structuralId)) {
                     return { 
                        rule: rule.name, 
                        type: ViolationType.SAFETY, 
                        level: rule.enforcement_level, 
                        message: `Forbidden structural pattern detected: ${structuralId}`,
                        data: { type: 'structural', patternId: structuralId }
                    };
                }
            }
        }

        // 2. Check simple regex patterns 
        if (regex_patterns) {
             for (const pattern of regex_patterns) {
                if (new RegExp(pattern, 'g').test(fileContent)) { 
                    return { 
                        rule: rule.name, 
                        type: ViolationType.SAFETY, 
                        level: rule.enforcement_level, 
                        message: `Forbidden text pattern matched: '${pattern.substring(0, 40)}...'`,
                        data: { type: 'regex', pattern }
                    };
                }
            }
        }
        return null;
    }
    
    _checkEntropyDensity(filePath, fileContent, rule, context) {
        const entropyScore = context.entropy;
        const { min_limit, max_limit } = rule.details;

        if (entropyScore === undefined) {
             this.logger.error(`Context missing required 'entropy' for rule ${rule.name}.`);
             return null; 
        }
        
        if (entropyScore < min_limit || entropyScore > max_limit) {
            return { 
                rule: rule.name, 
                type: ViolationType.QUALITY, 
                level: rule.enforcement_level, 
                message: `Entropy density (${entropyScore.toFixed(3)}) is outside acceptable range [${min_limit}, ${max_limit}]. Suggests obfuscation or excessive triviality.`,
                data: { entropyScore, min: min_limit, max: max_limit }
            };
        }
        return null;
    }
}

export const CEE = new ConstraintEnforcementEngine();
