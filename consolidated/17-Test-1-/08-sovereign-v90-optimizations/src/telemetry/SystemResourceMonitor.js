// src/telemetry/SystemResourceMonitor.js
// Utility for high-speed local environment resource tracking.
// Dependencies: 'os' module (Node.js built-in)
// Tool Dependency: MetricProcessingUtility (MPU)

const os = require('os');

// Assuming MetricProcessingUtility is available globally or injected via context
const MPU = global.MetricProcessingUtility; 

class SystemResourceMonitor {
    constructor(config = {}) {
        this.config = {
            cpuLoadAlpha: 0.3, // Smoothing for raw CPU load data
            maxMemoryUtilization: 0.9, // Ratio at which memory pressure hits 1.0
            ...config
        };
        
        this.currentCpuLoad = 0;
        this.memoryPressureIndex = 0; // Normalized 0.0 to 1.0
    }

    /**
     * Samples current system resources and updates internal state.
     * Must be called frequently (e.g., every 100ms) by a central tick system.
     */
    sampleResources() {
        // 1. CPU Load Calculation
        const cpus = os.cpus();
        let totalIdle = 0;
        let totalTick = 0;

        for (const cpu of cpus) {
            for (const type in cpu.times) {
                totalTick += cpu.times[type];
            }
            totalIdle += cpu.times.idle;
        }

        const idleRatio = totalIdle / totalTick;
        const instantaneousLoad = 1.0 - idleRatio;

        // Use extracted MetricProcessingUtility for Exponential Moving Average smoothing
        const alpha = this.config.cpuLoadAlpha;
        if (MPU) {
            this.currentCpuLoad = MPU.smoothEMA(
                this.currentCpuLoad, 
                instantaneousLoad, 
                alpha
            );
        } else {
            // Fallback if MPU is unavailable
            this.currentCpuLoad = this.currentCpuLoad * (1 - alpha) + instantaneousLoad * alpha;
        }

        // 2. Memory Pressure Calculation
        const freeMemory = os.freemem();
        const totalMemory = os.totalmem();
        const usedMemoryRatio = (totalMemory - freeMemory) / totalMemory;

        // Use extracted MetricProcessingUtility for normalization/scaling
        if (MPU) {
            this.memoryPressureIndex = MPU.normalizeRatio(
                usedMemoryRatio,
                this.config.maxMemoryUtilization
            );
        } else {
            // Fallback if MPU is unavailable
            this.memoryPressureIndex = Math.min(1.0,
                usedMemoryRatio / this.config.maxMemoryUtilization
            );
        }
    }

    /**
     * Generates a single index representing overall system stress (0.0=Idle, 1.0=Critical).
     * @returns {number} Normalized stress index.
     */
    getNormalizedStressIndex() {
        // Combine CPU and Memory stress factors (weights are tunable, 0.5 currently)
        const combinedStress = (this.currentCpuLoad * 0.5) + (this.memoryPressureIndex * 0.5);
        return parseFloat(Math.min(1.0, combinedStress).toFixed(4));
    }

    /**
     * Returns current raw data.
     */
    getStatus() {
        return {
            cpuLoad: this.currentCpuLoad,
            memoryPressure: this.memoryPressureIndex,
            normalizedStress: this.getNormalizedStressIndex()
        };
    }
}

module.exports = SystemResourceMonitor;