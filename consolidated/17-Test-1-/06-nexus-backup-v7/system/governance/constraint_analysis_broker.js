/**
 * Constraint Analysis Broker (CAB)
 * Purpose: Intelligently determines and executes the minimum required static analysis
 * to satisfy the active set of governance constraints, centralizing context generation.
 */

import { SystemLogger } from '../system_core/system_logger'; 

// Interface definition for the injected tool
interface AnalysisRequirementResolverTool {
    execute(args: { activeRules: Array<Object> }): Array<string>;
}

export class ConstraintAnalysisBroker {
    
    private syntaxAnalyzer: any;
    private entropyScorer: any;
    private logger: SystemLogger;
    private analysisRequirementResolver: AnalysisRequirementResolverTool;

    /**
     * @param {Object} dependencies 
     * @param {Object} dependencies.syntaxAnalyzer
     * @param {Object} dependencies.entropyScorer
     * @param {AnalysisRequirementResolverTool} dependencies.analysisRequirementResolver
     */
    constructor(dependencies: { 
        syntaxAnalyzer: any, 
        entropyScorer: any,
        analysisRequirementResolver: AnalysisRequirementResolverTool 
    }) {
        this.syntaxAnalyzer = dependencies.syntaxAnalyzer;
        this.entropyScorer = dependencies.entropyScorer;
        this.analysisRequirementResolver = dependencies.analysisRequirementResolver; // New dependency
        this.logger = new SystemLogger('CAB');
    }

    /**
     * Dynamically generates the required analysis context based on the rules provided.
     * @param {string} fileContent
     * @param {Array<Object>} activeRules - Rules applicable to the current file scope.
     * @returns {Promise<Object>} AnalysisContext
     */
    async getContext(fileContent: string, activeRules: Array<Object>): Promise<Object> {
        
        // Use the extracted plugin logic to determine required metrics
        const requiredMetrics = this.analysisRequirementResolver.execute({ activeRules });
        const context: { [key: string]: any } = {};
        
        if (requiredMetrics.length === 0) {
            return context;
        }

        // Execute calculations for required components (can be optimized with Promises.all)
        const calculationPromises: Promise<void>[] = [];

        if (requiredMetrics.includes('syntax_full')) {
            calculationPromises.push( 
                this.syntaxAnalyzer.analyze(fileContent)
                    .then((result: any) => { context.syntax = result; })
                    .catch((err: any) => { this.logger.error("Syntax analysis failed:", err); context.syntax = {}; })
            );
        }
        
        if (requiredMetrics.includes('entropy')) {
            calculationPromises.push(
                Promise.resolve(this.entropyScorer.calculateEntropy(fileContent))
                    .then((result: any) => { context.entropy = result; })
            );
        }

        // Wait for all required, heavy analyses to complete
        await Promise.all(calculationPromises);
        
        this.logger.debug(`Context generated for ${requiredMetrics.length} unique metrics.`);
        return context;
    }

    // _determineRequiredMetrics method removed.
}