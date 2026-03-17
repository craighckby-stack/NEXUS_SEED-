/**
 * Constraint Analysis Broker (CAB)
 * Purpose: Intelligently determines and executes the minimum required static analysis
 * to satisfy the active set of governance constraints, centralizing context generation.
 */

import { SystemLogger } from '../system_core/system_logger'; 

export class ConstraintAnalysisBroker {
    
    /**
     * @param {Object} dependencies 
     * @param {Object} dependencies.syntaxAnalyzer
     * @param {Object} dependencies.entropyScorer
     */
    constructor(dependencies) {
        this.syntaxAnalyzer = dependencies.syntaxAnalyzer;
        this.entropyScorer = dependencies.entropyScorer;
        this.logger = new SystemLogger('CAB');
    }

    /**
     * Dynamically generates the required analysis context based on the rules provided.
     * @param {string} fileContent
     * @param {Array<Object>} activeRules - Rules applicable to the current file scope.
     * @returns {Promise<Object>} AnalysisContext
     */
    async getContext(fileContent, activeRules) {
        const requiredMetrics = this._determineRequiredMetrics(activeRules);
        const context = {};
        
        if (requiredMetrics.length === 0) {
            return context;
        }

        // Execute calculations for required components (can be optimized with Promises.all)
        const calculationPromises = [];

        if (requiredMetrics.includes('syntax_full')) {
            calculationPromises.push( 
                this.syntaxAnalyzer.analyze(fileContent)
                    .then(result => context.syntax = result)
                    .catch(err => { this.logger.error("Syntax analysis failed:", err); context.syntax = {}; })
            );
        }
        
        if (requiredMetrics.includes('entropy')) {
            calculationPromises.push(
                Promise.resolve(this.entropyScorer.calculateEntropy(fileContent))
                    .then(result => context.entropy = result)
            );
        }

        // Wait for all required, heavy analyses to complete
        await Promise.all(calculationPromises);
        
        this.logger.debug(`Context generated for ${requiredMetrics.length} unique metrics.`);
        return context;
    }

    /**
     * Parses rules to build a minimal required metric set.
     * @param {Array<Object>} activeRules
     * @returns {Array<string>} List of required metrics (e.g., ['syntax_full', 'entropy'])
     */
    _determineRequiredMetrics(activeRules) {
        const requirements = new Set();

        for (const rule of activeRules) {
            switch (rule.type) {
                case 'COMPLEXITY_THRESHOLD':
                case 'FORBIDDEN_PATTERNS': // Structural patterns require AST, thus full syntax
                    requirements.add('syntax_full');
                    break;
                case 'ENTROPY_DENSITY':
                    requirements.add('entropy');
                    break;
                // Add future analysis requirements here (e.g., control_flow, mutation_score)
            }
        }

        return Array.from(requirements);
    }
}