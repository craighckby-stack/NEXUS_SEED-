import { readFile } from 'fs/promises';
import path from 'path';

const MATRIX_PATH = path.resolve('config/gsep_dependency_matrix.json');
const SCORE_PATH = path.resolve('config/gsep_module_scores.json'); 

/**
 * GSEPImpactAnalyzer
 * Handles asynchronous loading, structural transformation, and complex calculation
 * related to module blast radius and evolution prioritization.
 */
class GSEPImpactAnalyzer {
    // --- Configuration Constants (Tuning Parameters) ---
    /** @private */
    static IMPACT_MULTIPLIERS = {
        CRITICAL_SEVERITY: 1.5,
        DEFAULT_SEVERITY: 1.0,
        EXTERNAL_DEMAND_FACTOR: 0.5,
        REFACTOR_PRESSURE_BOOST: 2.0,
    };
    
    constructor() {
        this._isLoaded = false;
        this._dependencyMap = new Map(); // Source -> [Targets]
        this._scores = { criticality: {}, stability: {} };
    }

    /**
     * Loads dependency matrix and module scores concurrently, transforming 
     * the matrix into an efficient adjacency map. Implements efficient memoization.
     * @private
     */
    async _loadData() {
        if (this._isLoaded) {
            return;
        }

        try {
            // Use Promise.all for concurrent file loading
            const [matrixJson, scoresJson] = await Promise.all([
                readFile(MATRIX_PATH, 'utf8'),
                readFile(SCORE_PATH, 'utf8'),
            ]);

            // 1. Load Scores
            const scoresData = JSON.parse(scoresJson);
            this._scores.criticality = scoresData.criticality || {};
            this._scores.stability = scoresData.stability || {};

            // 2. Transform Matrix
            const matrixData = JSON.parse(matrixJson);
            
            for (const dep of matrixData.dependencies) {
                if (!this._dependencyMap.has(dep.source)) {
                    this._dependencyMap.set(dep.source, []);
                }
                this._dependencyMap.get(dep.source).push({
                    target: dep.target,
                    weight: dep.weight,
                    impact_severity: dep.impact_severity,
                });
            }
            
            this._isLoaded = true;

        } catch (error) {
            // Provide better context regarding which file failed
            const file = error.path === MATRIX_PATH ? 'Dependency Matrix' : 
                         error.path === SCORE_PATH ? 'Module Scores' : 'Data file';
            console.error(`GSEP Analyzer failed to load necessary data (${file}): ${error.message}`);
            throw new Error('Initialization failure: Matrix or score data unavailable.');
        }
    }

    /**
     * Calculates the weighted blast radius of a change to a source module.
     * The calculation incorporates the target module's criticality score.
     * @param {string} moduleId - The ID of the module being changed.
     * @returns {Promise<Array<{ target: string, impact_score: number, criticality_multiplier: number }>>} 
     *          List of affected modules with calculated impact scores.
     */
    async calculateBlastRadius(moduleId) {
        await this._loadData();
        // Using Map for cleaner aggregation
        const affectedModules = new Map(); 
        const { criticality } = this._scores;
        const C = GSEPImpactAnalyzer.IMPACT_MULTIPLIERS;

        const directTargets = this._dependencyMap.get(moduleId) || [];

        for (const dep of directTargets) {
            // Apply severity multiplier based on constants
            const severityMultiplier = dep.impact_severity === 'Critical' ? C.CRITICAL_SEVERITY : C.DEFAULT_SEVERITY;
            const baseImpact = dep.weight * severityMultiplier;
            
            // Incorporate target module criticality 
            const targetCriticality = criticality[dep.target] || 1.0; 
            const weightedImpact = baseImpact * targetCriticality;

            const currentImpact = affectedModules.get(dep.target) || 0;
            affectedModules.set(dep.target, currentImpact + weightedImpact);
        }

        // Format and return detailed results
        return Array.from(affectedModules.entries()).map(([targetId, rawImpactScore]) => {
            const targetCriticality = criticality[targetId] || 1.0;
            return {
                target: targetId,
                impact_score: parseFloat(rawImpactScore.toFixed(4)),
                reason: `Affected by change in ${moduleId}.`,
                criticality_multiplier: parseFloat(targetCriticality.toFixed(2)) 
            };
        });
    }

    /**
     * Calculates the required evolution priority score for a module based on its 
     * intrinsic stability, criticality, and the external impact its changes impose.
     * Higher score means higher priority for immediate evolution/refactoring.
     * 
     * @param {string} moduleId - The ID of the module to prioritize.
     * @param {number} [pendingChangeImpact=0] - A measure of how major the planned changes are (0.0 to 1.0).
     * @returns {Promise<object>} Priority score and breakdown.
     */
    async calculateEvolutionPriority(moduleId, pendingChangeImpact = 0) {
        await this._loadData();
        const { stability, criticality } = this._scores;
        const C = GSEPImpactAnalyzer.IMPACT_MULTIPLIERS;

        const stabilityScore = stability[moduleId] || 1.0;
        const criticalityScore = criticality[moduleId] || 1.0;

        // 1. Intrinsic Need: Higher Criticality & Lower Stability => Higher Need
        const intrinsicNeed = criticalityScore * (2 - stabilityScore);

        // 2. External Demand Factor: How much cumulative impact its current structure imposes on dependents.
        const blastRadiusResults = await this.calculateBlastRadius(moduleId);
        const cumulativeBlastImpact = blastRadiusResults.reduce((sum, res) => sum + res.impact_score, 0);
        const externalDemand = cumulativeBlastImpact * C.EXTERNAL_DEMAND_FACTOR; 

        // 3. Pending Refactor Pressure: Multiplies proposed changes severity by module criticality.
        const refactorPressure = pendingChangeImpact * criticalityScore * C.REFACTOR_PRESSURE_BOOST; 

        const totalPriorityScore = intrinsicNeed + externalDemand + refactorPressure;

        return {
            module: moduleId,
            priority_score: parseFloat(totalPriorityScore.toFixed(4)),
            breakdown: {
                intrinsic_need: parseFloat(intrinsicNeed.toFixed(4)),
                external_demand: parseFloat(externalDemand.toFixed(4)),
                refactor_pressure: parseFloat(refactorPressure.toFixed(4))
            }
        };
    }
}

// Export a singleton instance for system-wide use
export const gsepAnalyzer = new GSEPImpactAnalyzer();
