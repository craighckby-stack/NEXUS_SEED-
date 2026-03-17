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
            return 1.0; // If disabled, always sample everything.
        }

        const currentCpu = this.monitor.getCpuUtilization();
        const targetCpu = this.config.TargetCPUUtilization;
        
        let rate: number;

        // Determine the base sampling rate based on CPU utilization.
        // If current CPU exceeds target, proportionally reduce sampling.
        // Otherwise, aim for full sampling (1.0).
        if (currentCpu > targetCpu && targetCpu > 0) { // Avoid division by zero if targetCpu somehow becomes 0
            rate = targetCpu / currentCpu;
        } else {
            rate = 1.0;
        }

        // Ensure the calculated rate stays within the configured boundaries.
        // Apply max rate first, then min rate.
        rate = Math.min(rate, this.config.MaxSamplingRate);
        rate = Math.max(rate, this.config.MinSamplingRate);

        // Return the rate formatted to a fixed number of decimal places for consistency.
        return parseFloat(rate.toFixed(4));
    }
}