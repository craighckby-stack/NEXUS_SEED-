/**
 * TQM_EnforcementEngine.js
 * Purpose: Monitors real-time operational metrics against configured TQM Thresholds
 * and executes the specified mitigation hook when a breach is detected.
 * 
 * Sovereign AGI v94.1 Refactor: Introduced explicit operator definition for robust enforcement.
 */

const TQM_Thresholds = require('../../config/governance/TQM_Thresholds.json');
const ExecutionHarness = require('../governance/ExecutionHarness');
const Logger = require('../../utility/Logger');

// Standardized comparison operators for declarative enforcement
const Operators = Object.freeze({
    MAX: '>',
    MIN: '<',
    MAX_EQUAL: '>=',
    MIN_EQUAL: '<=',
    NOT_EQUAL: '!='
});

class TQMEnforcementEngine {
    constructor(thresholds = TQM_Thresholds) {
        // Note: The thresholds object should ideally be deep-frozen upon load to guarantee integrity.
        this.thresholds = thresholds.threshold_categories;
    }

    /**
     * Determines if the measured value breaches the specified level based on the configured operator.
     * Prioritizes explicit 'operator' from config; falls back to '_Min' heuristic if missing (architectural debt).
     *
     * @param {number} level - The configured threshold value.
     * @param {number} currentValue - The measured value.
     * @param {object} metricConfig - Configuration object for the metric.
     * @param {string} metricKey - The key (used for fallbacks).
     * @returns {boolean} True if a breach occurred.
     */
    evaluateBreach(level, currentValue, metricConfig, metricKey) {
        // Attempt to retrieve explicit operator (v94.1 best practice)
        let operator = metricConfig.operator;

        // V94.0 Compatibility Fallback (Flagging Architectural Debt)
        if (!operator) {
             operator = metricKey.endsWith('_Min') ? Operators.MIN : Operators.MAX;
             Logger.warn(`Operator missing for ${metricKey}. Using heuristic fallback: ${operator}. Requires governance/config update.`);
        }
        
        switch (operator) {
            case Operators.MAX: return currentValue > level;
            case Operators.MIN: return currentValue < level;
            case Operators.MAX_EQUAL: return currentValue >= level;
            case Operators.MIN_EQUAL: return currentValue <= level;
            case Operators.NOT_EQUAL: return currentValue != level;
            default:
                Logger.error(`Unrecognized operator '${operator}' defined for metric ${metricKey}. Defaulting to MAX (>).`);
                return currentValue > level; 
        }
    }

    /**
     * Checks a specific metric against its threshold and triggers the hook if breached.
     * @param {string} categoryName - e.g., 'Code_Evolution_Integrity'
     * @param {string} metricKey - e.g., 'Technical_Debt_Index_Max'
     * @param {number} currentValue - The current measured value
     */
    checkAndEnforce(categoryName, metricKey, currentValue) {
        const category = this.thresholds[categoryName];
        if (!category) return;
        
        const metricConfig = category.metrics[metricKey];
        if (!metricConfig) return;

        const { level, severity, on_breach_hook } = metricConfig;
        
        const breached = this.evaluateBreach(level, currentValue, metricConfig, metricKey);

        if (breached) {
            const context = { 
                categoryName,
                metricKey, 
                currentValue,
                thresholdLevel: level,
                operator: metricConfig.operator || 'INFERRED' 
            };

            Logger.error(`[TQM Breach | ${severity}] ${metricKey} (${currentValue}) breached level ${level}. Hooking: ${on_breach_hook}`);
            
            ExecutionHarness.executeHook({
                path: on_breach_hook,
                severity: severity,
                context: context
            }).catch(e => {
                 Logger.error(`Failed to execute TQM mitigation hook ${on_breach_hook} for ${metricKey}:`, e);
            });
        }
    }

    // ... Additional methods for periodic metric ingestion and bulk checking
}

module.exports = new TQMEnforcementEngine();
