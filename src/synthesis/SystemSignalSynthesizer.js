/**
 * Sovereign AGI v94.4 - System Signal Synthesizer (SSS)
 * Role: Converts raw aggregated data reports (FBA, SEA, EDP) into a highly prioritized, 
 * canonical Mutation Requirement object based on predefined evolutionary heuristics.
 */

class SystemSignalSynthesizer {
    
    constructor() {
        // Heuristic weighting configuration (tuneable constants for prioritization)
        this.WEIGHTS = {
            EDP_DEBT_FACTOR: 0.6,    // Importance of accumulated technical debt (0-1)
            SEA_ENTROPY_RISK: 20,    // Points added per unit of entropy (0-1 score, max 20)
            FBA_CRITICAL_BUG_BOOST: 50, // Static boost for each confirmed critical bug
            MIN_INTENT_THRESHOLD: 10 // Minimum priority score required to generate M01
        };

        this.INTENT_MAP = {
            HIGH_DEBT: 'Optimization',
            HIGH_ENTROPY: 'Refactor',
            CRITICAL_FAILURE: 'Bugfix',
            DEFAULT: 'Evolution'
        };
    }

    /**
     * Synthesizes inputs into a single mutation intent requirement.
     * @param {Object} signals - { fbaData, seaReport, edpSchedule }
     * @returns {Object | null} Canonical requirement object or null if threshold not met.
     */
    synthesize(signals) {
        // Default empty objects for safe destructuring
        const { edpSchedule = [], seaReport = {}, fbaData = {} } = signals;
        let priority = 0;
        let component = null;
        let intentType = this.INTENT_MAP.DEFAULT;
        const sources = [];

        // --- 1. Assess EDP (Efficiency Debt Prioritizer) ---
        if (edpSchedule.length > 0) {
            const topDebt = edpSchedule[0]; // Assuming schedule is sorted by debt priority
            priority += topDebt.score * this.WEIGHTS.EDP_DEBT_FACTOR;
            component = component || topDebt.component;
            intentType = this.INTENT_MAP.HIGH_DEBT;
            sources.push('EDP');
        }

        // --- 2. Assess SEA (Systemic Entropy Auditor) ---
        if (seaReport.entropyLevel && seaReport.entropyLevel > 0.6) {
            priority += seaReport.entropyLevel * this.WEIGHTS.SEA_ENTROPY_RISK;
            component = component || seaReport.mostEntropicComponent || 'SystemCore';
            
            // Entropy usually mandates refactoring unless a higher priority bugfix exists
            if (intentType !== this.INTENT_MAP.CRITICAL_FAILURE) {
                intentType = this.INTENT_MAP.HIGH_ENTROPY;
            }
            sources.push('SEA');
        }

        // --- 3. Assess FBA (Feedback Loop Aggregator) ---
        if (fbaData.criticalBugs && fbaData.criticalBugs > 0) {
            priority += fbaData.criticalBugs * this.WEIGHTS.FBA_CRITICAL_BUG_BOOST;
            // Critical bugs overwrite all other intent types
            intentType = this.INTENT_MAP.CRITICAL_FAILURE;
            component = component || fbaData.targetComponent || 'Unknown/Patch'; 
            sources.push('FBA');
        }
        
        // Final normalization (cap score at 100)
        priority = Math.min(100, Math.round(priority));

        if (priority < this.WEIGHTS.MIN_INTENT_THRESHOLD) {
             return null; // System not under enough pressure for mutation
        }

        const justification = `P:${priority}. Derived from (${sources.join(', ')}).`;

        return {
            priorityScore: priority,
            type: intentType,
            component: component,
            justification: justification,
            sources: sources,
            // Keep a snapshot for Synthesis Core debugging/context
            rawSignalSnapshot: { edpSchedule, seaReport, fbaData }
        };
    }
}

module.exports = SystemSignalSynthesizer;