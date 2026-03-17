import { SimulationReport, SimulationParameters } from "../types/simulationTypes";

/**
 * Interpretation result detailing if the simulation outcome meets acceptance criteria.
 */
export interface SimulationInterpretationResult {
    isAcceptable: boolean;
    reasons: string[]; // List of failures or warnings
    scoreClass: 'CRITICAL' | 'WARNING' | 'PASS';
}

// Assumes AGI_PLUGINS is available in the runtime environment.
declare const AGI_PLUGINS: {
    SimulationResultInterpreterTool: {
        execute(args: { report: SimulationReport, params: SimulationParameters }): SimulationInterpretationResult;
    }
};

/**
 * Analyzes a SimulationReport against the defined SimulationParameters to determine
 * if the proposed change is safe for merging.
 * 
 * This function delegates the core interpretation, threshold checking, and scoring 
 * logic to the SimulationResultInterpreterTool plugin.
 *
 * @param report The final outcome of the simulation run.
 * @param params The configuration parameters used for the acceptance threshold.
 * @returns InterpretationResult indicating safety and failure vectors.
 */
export function interpretSimulationResults(report: SimulationReport, params: SimulationParameters): SimulationInterpretationResult {
    return AGI_PLUGINS.SimulationResultInterpreterTool.execute({ report, params });
}