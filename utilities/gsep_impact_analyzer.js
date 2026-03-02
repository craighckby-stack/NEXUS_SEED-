import { readFile } from 'fs/promises';
import path from 'path';

// Define paths using path.resolve for robustness
const MATRIX_PATH = path.resolve('config/gsep_dependency_matrix.json');
const SCORE_PATH = path.resolve('config/gsep_module_scores.json'); // Requires proposed scaffold

/**
 * GSEPImpactAnalyzer
 * Handles asynchronous loading, structural transformation, and complex calculation
 * related to module blast radius and evolution prioritization.
 */
class GSEPImpactAnalyzer {
  constructor() {
    this._matrix = null;
    this._scores = null;
  }

  /**
   * Loads the dependency matrix and module scores asynchronously, transforming
   * the matrix into an efficient adjacency map for source-based lookups.
   * Implements memoization to prevent redundant disk I/O.
   * @private
   */
  async _loadData() {
    if (this._matrix && this._scores) {
      return; 
    }

    try {
      // Load Matrix and transform to adjacency map
      const matrixJson = await readFile(MATRIX_PATH, 'utf8');
      const matrixData = JSON.parse(matrixJson);
      
      this._matrix = new Map();
      for (const dep of matrixData.dependencies) {
        if (!this._matrix.has(dep.source)) {
          this._matrix.set(dep.source, []);
        }
        this._matrix.get(dep.source).push({
          target: dep.target,
          weight: dep.weight,
          impact_severity: dep.impact_severity,
        });
      }

      // Load Scores (Criticality, Stability)
      const scoresJson = await readFile(SCORE_PATH, 'utf8');
      this._scores = JSON.parse(scoresJson);

    } catch (error) {
      console.error(`GSEP Analyzer failed to load necessary data: ${error.message}`);
      throw new Error('Initialization failure: Matrix or score data unavailable.');
    }
  }

  /**
   * Calculates the weighted blast radius of a change to a source module.
   * The calculation incorporates the target module's criticality score.
   * @param {string} moduleId - The ID of the module being changed.
   * @returns {Promise<Array<object>>} List of affected modules with calculated impact scores.
   */
  async calculateBlastRadius(moduleId) {
    await this._loadData();
    const affectedModules = {};

    const directTargets = this._matrix.get(moduleId) || [];

    for (const dep of directTargets) {
      const baseImpact = dep.weight * (dep.impact_severity === 'Critical' ? 1.5 : 1.0);
      
      // Incorporate target module criticality into final impact score
      const targetCriticality = this._scores.criticality[dep.target] || 1.0; 
      const weightedImpact = baseImpact * targetCriticality;

      affectedModules[dep.target] = (affectedModules[dep.target] || 0) + weightedImpact;
    }

    // Normalize and return detailed results
    return Object.keys(affectedModules).map(targetId => ({
      target: targetId,
      impact_score: parseFloat(affectedModules[targetId].toFixed(4)),
      reason: `Affected by change in ${moduleId}.`,
      criticality_multiplier: targetId ? (this._scores.criticality[targetId] || 1.0) : 1.0
    }));
  }

  /**
   * Calculates the required evolution priority score for a module based on its 
   * intrinsic stability, criticality, and the external impact its changes impose.
   * Higher score means higher priority for immediate evolution/refactoring.
   * 
   * @param {string} moduleId - The ID of the module to prioritize.
   * @param {number} pendingChangeImpact - A measure of how major the planned changes are (0.0 to 1.0).
   * @returns {Promise<object>} Priority score and breakdown.
   */
  async calculateEvolutionPriority(moduleId, pendingChangeImpact = 0) {
    await this._loadData();

    const stability = this._scores.stability[moduleId] || 1.0;
    const criticality = this._scores.criticality[moduleId] || 1.0;

    // 1. Intrinsic Need: Higher Criticality & Lower Stability => Higher Need
    // (2 - stability) creates a higher multiplier for less stable modules.
    const intrinsicNeed = criticality * (2 - stability);

    // 2. External Demand Factor: How much impact its current structure is CAUSING
    const blastRadiusResults = await this.calculateBlastRadius(moduleId);
    const cumulativeBlastImpact = blastRadiusResults.reduce((sum, res) => sum + res.impact_score, 0);
    const externalDemand = cumulativeBlastImpact * 0.5; 

    // 3. Pending Refactor Pressure: Multiplies proposed changes by criticality.
    const refactorPressure = pendingChangeImpact * criticality * 2; 

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
