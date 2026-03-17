/**
 * AdaptiveSamplingEngine.ts
 * 
 * Utility component required to implement the 'ResourceUtilization' AdaptiveSampling Policy
 * defined in TelemetryAggregatorConfig. It dynamically calculates the necessary 
 * sampling rate based on monitored resource constraints (CPU/Memory/Queue Depth).
 */

import { ResourceMonitor } from './ResourceMonitor';
import { AggregatorConfig } from '../GACR/TelemetryAggregatorConfig';

export class AdaptiveSamplingEngine {
    private config: AggregatorConfig['Processing']['AdaptiveSampling'];
    private monitor: ResourceMonitor;

    constructor(config: AggregatorConfig['Processing']['AdaptiveSampling']) {
        this.config = config;
        this.monitor = new ResourceMonitor();
    }

    /**
     * Calculates the current required sampling rate (0.0 to 1.0).
     */
    public getSamplingRate(): number {
        if (!this.config.Enabled) {
            return 1.0;
        }

        const currentCpu = this.monitor.getCpuUtilization(); // e.g., 0.95
        const targetCpu = this.config.TargetCPUUtilization;
        
        let rate = 1.0;

        // If utilization exceeds target, aggressively drop samples.
        if (currentCpu > targetCpu) {
            // Calculate necessary drop factor. Use a proportional mechanism.
            // Example: If target is 0.75 and current is 1.00, we must drop 25% of the remaining load.
            rate = targetCpu / currentCpu;
        }

        // Ensure the rate stays within defined boundaries
        rate = Math.min(rate, this.config.MaxSamplingRate);
        rate = Math.max(rate, this.config.MinSamplingRate);

        return parseFloat(rate.toFixed(4));
    }
}