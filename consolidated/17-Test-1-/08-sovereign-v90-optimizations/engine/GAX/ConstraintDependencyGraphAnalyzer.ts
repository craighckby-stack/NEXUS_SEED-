import { ConstraintResolutionEngineDefinition } from "./types";
import {
  DependencyGraphAnalyzer,
  GraphDiagnostic,
  AnalysisNode
} from 'AGI_KERNEL/DependencyGraphAnalyzer';

/**
 * Analyzes constraint dependency graphs for structural issues.
 * Uses AGI_KERNEL:DependencyGraphAnalyzer for cycle, duplicate, and missing dependency detection.
 */
export class ConstraintDependencyGraphAnalyzer {
  #definition: ConstraintResolutionEngineDefinition;
  #graphAnalyzer: DependencyGraphAnalyzer;
  readonly #ID_KEY = 'phaseId';
  readonly #DEPS_KEY = 'dependencies';

  constructor(definition: ConstraintResolutionEngineDefinition) {
    this.#definition = definition;
    this.#graphAnalyzer = new DependencyGraphAnalyzer();
  }

  /**
   * Analyzes the dependency graph for cycles, duplicates, and missing references.
   * @returns An array of structured diagnostic messages.
   */
  public analyzeForCycles(): GraphDiagnostic[] {
    return this.#graphAnalyzer.analyze({
      nodes: this.#definition.resolutionPhases as AnalysisNode[],
      idKey: this.#ID_KEY,
      depsKey: this.#DEPS_KEY,
    });
  }

  /**
   * Validates the constraint definition structure.
   * @throws Error if structural issues are found in resolution phases.
   */
  public validateDefinition(): void {
    const diagnostics = this.analyzeForCycles();
    const errors = diagnostics.filter(d => d.severity === 'error');
    const warnings = diagnostics.filter(d => d.severity === 'warning');

    if (errors.length > 0) {
      throw new Error(`Configuration Error: Structural issues found in resolution phases: ${errors.map(e => e.message).join('; ')}`);
    }

    if (warnings.length > 0) {
      console.warn(`Configuration Warnings during validation: ${warnings.map(w => w.message).join('; ')}`);
    }
  }
}
