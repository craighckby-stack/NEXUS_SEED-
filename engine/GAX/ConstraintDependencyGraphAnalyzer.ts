/**
 * ConstraintDependencyGraphAnalyzer.ts
 * Pre-validates the dependency graph defined in the ConstraintResolutionEngineDefinition.
 */

import { ConstraintResolutionEngineDefinition } from "./types";

export class ConstraintDependencyGraphAnalyzer {
  private definition: ConstraintResolutionEngineDefinition;

  constructor(definition: ConstraintResolutionEngineDefinition) {
    this.definition = definition;
  }

  public analyzeForCycles(): string[] {
    const phases = this.definition.resolutionPhases;
    const adj: Map<string, string[]> = new Map();
    const visited: Set<string> = new Set();
    const recursionStack: Set<string> = new Set();
    const cycles: string[] = [];

    for (const phase of phases) {
      adj.set(phase.phaseId, phase.dependencies);
    }

    const dfs = (phaseId: string) => {
      visited.add(phaseId);
      recursionStack.add(phaseId);

      for (const dependentId of adj.get(phaseId) || []) {
        if (!visited.has(dependentId)) {
          dfs(dependentId);
        } else if (recursionStack.has(dependentId)) {
          cycles.push(`Cycle detected: ${phaseId} -> ${dependentId}`);
        }
      }
      recursionStack.delete(phaseId);
    };

    for (const phase of phases) {
      if (!visited.has(phase.phaseId)) {
        dfs(phase.phaseId);
      }
    }

    return cycles;
  }

  public validateDefinition(): void {
    const detectedCycles = this.analyzeForCycles();
    if (detectedCycles.length > 0) {
      throw new Error(`Configuration Error: Circular dependencies found in resolution phases: ${detectedCycles.join(', ')}`);
    }
    console.log("Constraint definition graph validated successfully.");
  }
}