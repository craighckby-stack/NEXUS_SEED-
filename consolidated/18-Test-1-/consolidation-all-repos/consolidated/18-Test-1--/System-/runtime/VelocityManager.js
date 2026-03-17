/**
 * Manages dynamic velocity throttling and validates data against GVDM constraints.
 * Implements load-aware adaptive throttling based on real-time system metrics.
 */
import GVDM_CONFIG from '../config/GVDM.json';

class VelocityManager {
    constructor(system_monitor) {
        this.config = GVDM_CONFIG.velocity_control;
        this.vector_config = GVDM_CONFIG.vector_space;
        this.monitor = system_monitor; // Assumes injection of a system load monitor
        this.current_throttle_ms = 0;
    }

    static getDimension() {
        return GVDM_CONFIG.vector_space.embedding_dimension;
    }

    isHighVelocityEvent(data_change_percentage) {
        if (data_change_percentage >= this.config.change_threshold_percent) {
            return true;
        }
        return false;
    }

    getAdaptiveThrottleDelay() {
        if (!this.config.dynamic_throttle_enabled) {
            return this.current_throttle_ms;
        }

        const load = this.monitor.getSystemLoadRatio(); // 0.0 to 1.0

        // Increase throttling aggressively if load exceeds 80%
        if (load > 0.80) {
            this.current_throttle_ms = Math.min(2000, this.current_throttle_ms + 100);
        } else if (load < 0.50) {
            // Decrease throttle slowly if load is low
            this.current_throttle_ms = Math.max(0, this.current_throttle_ms - 50);
        }

        // Ensure throttle doesn't exceed maximum defined inverse velocity
        const min_delay_based_on_max_events = 1000 / this.config.max_velocity_events_per_s;
        this.current_throttle_ms = Math.max(this.current_throttle_ms, min_delay_based_on_max_events);
        
        return this.current_throttle_ms;
    }
}

export default VelocityManager;