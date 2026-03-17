import { loadConfig } from '../core/ConfigLoader';

/**
 * MetricProfileSelector
 * Selects the appropriate Metric Weighting Profile based on the current Mandate's CSR assessment.
 * Leverages system/config/MetricWeights.json.
 *
 * NOTE: The threshold evaluation is delegated to the ThresholdBasedProfileSelectorTool.
 */

// NOTE: ThresholdBasedProfileSelectorTool is assumed to be available via injection or global scope.
declare const ThresholdBasedProfileSelectorTool: {
    select(csrAssessment: { risk: number, complexity: number, scope: number }): string;
};

/**
 * Selects the profile based on the CSR assessment.
 * @param {object} csrAssessment - Assessment containing risk, complexity, and scope scores.
 * @returns {Promise<string>} The selected profile name.
 */
export async function selectProfile(csrAssessment) {
    // Load configuration context, as mandated by the module description.
    await loadConfig('MetricWeights'); 
    
    // Delegate the complex threshold logic to the specialized plugin.
    if (typeof ThresholdBasedProfileSelectorTool !== 'undefined' && ThresholdBasedProfileSelectorTool.select) {
        return ThresholdBasedProfileSelectorTool.select(csrAssessment);
    }

    throw new Error("Threshold based profile selector tool is unavailable.");
}