/**
 * AdaptiveMitigationEngine
 * Subscribes to operational metrics and executes prescribed recovery protocols
 * defined in config/failure_modes.json when threshold triggers are met.
 */

import { systemMetrics } from '../monitoring/MetricsCollector.js';
import { failureModes } from '../../config/failure_modes.json';
import { recoveryProtocols } from './RecoveryProtocols.js';

export class AdaptiveMitigationEngine {
    constructor() {
        this.activeMonitors = {};
        this.initializeMonitors();
    }

    initializeMonitors() {
        Object.values(failureModes.modes_by_category).flat().forEach(mode => {
            const trigger = mode.threshold_triggers;
            if (trigger) {
                systemMetrics.subscribe(trigger.metric, (value) => {
                    this.checkTrigger(mode, value);
                });
                this.activeMonitors[mode.id] = true;
            }
        });
    }

    checkTrigger(mode, metricValue) {
        // Simplified logic: checks if condition is met based on priority score and metric value
        const conditionMet = this.evaluateCondition(metricValue, mode.threshold_triggers);

        if (conditionMet) {
            console.warn(`[MITIGATION] Detected failure mode: ${mode.id}. Priority: ${mode.priority_score}`);
            const protocol = recoveryProtocols[mode.recovery_protocol_id];
            if (protocol) {
                protocol.execute(mode);
            } else {
                console.error(`Missing recovery protocol for ID: ${mode.recovery_protocol_id}`);
            }
        }
    }
    
    evaluateCondition(value, trigger) {
        // Placeholder for complex expression parsing (e.g., '> 0.15')
        if (trigger.condition.startsWith('>')) {
            return value > parseFloat(trigger.condition.substring(1));
        }
        return false; 
    }
}
