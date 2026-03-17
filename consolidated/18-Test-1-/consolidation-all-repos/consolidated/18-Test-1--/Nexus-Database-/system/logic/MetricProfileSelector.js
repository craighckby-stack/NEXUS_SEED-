/**
 * MetricProfileSelector
 * Selects the appropriate Metric Weighting Profile based on the current Mandate's CSR assessment.
 * Leverages system/config/MetricWeights.json.
 */

import { loadConfig } from '../core/ConfigLoader';

const CSR_THRESHOLDS = {
    RISK: 0.6,
    COMPLEXITY: 0.7,
    SCOPE: 0.5
};

export async function selectProfile(csrAssessment) {
    const metricWeights = await loadConfig('MetricWeights');
    const { risk, complexity, scope } = csrAssessment;

    if (risk >= CSR_THRESHOLDS.RISK) {
        return 'High_Risk_Control';
    }
    if (complexity >= CSR_THRESHOLDS.COMPLEXITY || scope >= CSR_THRESHOLDS.SCOPE) {
        return 'High_Complexity_Focus';
    }

    // Fallback to default profile
    return 'Default_Standard';
}