/**
 * Manages dynamic velocity throttling and validates data against GVDM constraints.
 * Implements load-aware adaptive throttling based on real-time system metrics.
 */
import GVDM_CONFIG from '../config/GVDM.json';

// CRITICAL: We rely on AdaptiveThrottlePlugin being globally accessible if used.

class VelocityManagerKernel {
    #config: any;
    #vectorConfig: any;
    #monitor: any; // System load monitor
    #adaptiveThrottleTool: any | null = null;

    constructor(system_monitor: any) {
        this.#setupDependencies(system_monitor);
    }

    /**
     * Executes synchronous setup: loads config, assigns dependencies, and initializes external tools.
     */
    #setupDependencies(systemMonitor: any): void {
        this.#loadConfiguration();
        this.#monitor = systemMonitor; 
        this.#initializeAdaptiveThrottleTool();
    }

    #logWarning(message: string): void {
        console.warn(message);
    }

    #loadConfiguration(): void {
        this.#config = GVDM_CONFIG.velocity_control;
        this.#vectorConfig = GVDM_CONFIG.vector_space;
    }

    #initializeAdaptiveThrottleTool(): void {
        // Check for the global dependency
        if (typeof (globalThis as any).AdaptiveThrottlePlugin !== 'undefined') {
            try {
                // @ts-ignore: Assume AdaptiveThrottlePlugin is accessible globally and callable
                this.#adaptiveThrottleTool = new (globalThis as any).AdaptiveThrottlePlugin();
                this.#adaptiveThrottleTool.initialize(this.#config);
            } catch (e) {
                this.#logWarning(`Error initializing AdaptiveThrottlePlugin: ${e.message}`);
                this.#adaptiveThrottleTool = null;
            }
        } else {
             this.#logWarning("AdaptiveThrottlePlugin not loaded. Velocity management may be degraded.");
        }
    }

    // Static Proxy for configuration access
    static getDimension(): number {
        return VelocityManagerKernel.#getEmbeddingDimension();
    }

    static #getEmbeddingDimension(): number {
        return GVDM_CONFIG.vector_space.embedding_dimension;
    }

    isHighVelocityEvent(data_change_percentage: number): boolean {
        return this.#checkThreshold(data_change_percentage);
    }

    #checkThreshold(change: number): boolean {
        return change >= this.#config.change_threshold_percent;
    }

    /**
     * Delegates the dynamic calculation of throttle delay to the AdaptiveThrottlePlugin or uses fallback.
     */
    getAdaptiveThrottleDelay(): number {
        if (this.#adaptiveThrottleTool) {
            const load = this.#getMonitorLoadRatio();
            return this.#delegateToThrottleCalculation(load);
        }
        
        return this.#calculateFallbackDelay();
    }

    #getMonitorLoadRatio(): number {
        return this.#monitor.getSystemLoadRatio();
    }

    #delegateToThrottleCalculation(load: number): number {
        // Tool existence checked in public method
        return this.#adaptiveThrottleTool.calculateDelay(load);
    }

    #calculateFallbackDelay(): number {
        if (this.#config.dynamic_throttle_enabled) {
            // Fixed rate calculation
            const maxEvents = this.#config.max_velocity_events_per_s || 10;
            return 1000 / maxEvents;
        }
        return 0;
    }
}

export default VelocityManagerKernel;
