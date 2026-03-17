/**
 * src/governance/TrustMatrixManager.js
 * Purpose: Manages the dynamic evolution of the RCDM weighting_matrix (trust matrix)
 * based on real-time performance, compliance history, and behavioral audits of actors.
 * This separation ensures the PolicyEngine remains a fast, read-only enforcer.
 *
 * Sovereign AGI Refactoring Rationale (v94.1):
 * 1. Encapsulation: Converted internal state properties and helper methods 
 *    (e.g., save flags, timers, loading function) to private class fields (`#...`)
 *    to strictly enforce separation between public API and internal control mechanisms.
 * 
 * 2. Robust Initialization: Standardized configuration handling in `#validateConfig` to ensure required numeric parameters (e.g., factors) are clamped and respected.
 * 
 * 3. Efficiency Maintenance: Retained the high-efficiency asynchronous debounced write mechanism, 
 *    ensuring minimal I/O impact during periods of heavy updates while maintaining eventual consistency.
 * 
 * 4. Audit Improvement: Added threshold checking in `recalculateWeight` to reduce logging spam for trivial updates.
 */
class TrustMatrixManager {

    static PERSISTENCE_KEY = 'weighting_matrix';

    static DEFAULT_CONFIG = {
        smoothingFactor: 0.15,   // Base EMA learning rate (alpha)
        penaltyBoost: 0.35,      // Higher alpha applied immediately on negative feedback for faster decay
        saveDebounceMs: 4000,    // Time (ms) to wait before writing to persistent storage
        initialTrustScore: 0.5   // Default trust for new actors
    };

    // Internal state for controlling asynchronous writes (Private Fields)
    #saveTimer = null;
    #isSaving = false;  // Flag indicating if an async write is currently happening
    #needsSave = false; // Flag indicating if an update occurred while '#isSaving' was true

    /**
     * @param {Object} persistenceLayer - Must implement load(key) and save(key, data)
     * @param {Object} auditLog - Must implement log() and error()
     * @param {Object} [config={}] - Optional configuration overrides.
     */
    constructor(persistenceLayer, auditLog, config = {}) {
        if (!persistenceLayer || !auditLog) {
            throw new Error("TrustMatrixManager requires a persistenceLayer and an auditLog instance.");
        }
        
        this.persistence = persistenceLayer;
        this.auditLog = auditLog;
        
        this.config = this.#validateConfig({ ...TrustMatrixManager.DEFAULT_CONFIG, ...config });

        // Synchronous Load: Required for immediate service startup.
        this.#loadMatrix();
    }
    
    /**
     * Internal configuration validation and normalization.
     */
    #validateConfig(config) {
        // Ensure critical factors are clamped between 0 and 1
        config.smoothingFactor = Math.max(0, Math.min(1, config.smoothingFactor || TrustMatrixManager.DEFAULT_CONFIG.smoothingFactor));
        config.penaltyBoost = Math.max(0, Math.min(1, config.penaltyBoost || TrustMatrixManager.DEFAULT_CONFIG.penaltyBoost));
        config.initialTrustScore = Math.max(0, Math.min(1, config.initialTrustScore || TrustMatrixManager.DEFAULT_CONFIG.initialTrustScore));

        if (typeof config.saveDebounceMs !== 'number' || config.saveDebounceMs < 500) {
            config.saveDebounceMs = TrustMatrixManager.DEFAULT_CONFIG.saveDebounceMs;
        }

        return config;
    }

    /**
     * Synchronous initialization method to load the matrix from persistent storage.
     */
    #loadMatrix() {
        try {
            this.currentMatrix = this.persistence.load(TrustMatrixManager.PERSISTENCE_KEY) || {};
            this.auditLog.log({ 
                component: 'TrustMatrix', 
                type: 'MATRIX_LOAD', 
                status: 'Success', 
                size: Object.keys(this.currentMatrix).length 
            });
        } catch (error) {
            // Fail safe: If load fails, start with an empty matrix to prevent blocking execution.
            this.currentMatrix = {};
            this.auditLog.error({ 
                component: 'TrustMatrix', 
                type: 'MATRIX_LOAD_ERROR', 
                message: `Failed to load initial matrix: ${error.message}` 
            });
        }
    }

    /**
     * Executes the actual persistence write operation.
     * Handles concurrent updates by checking the #needsSave flag upon completion.
     */
    async #performSave() {
        if (this.#isSaving) {
            // Safety measure: this scenario implies scheduleSave was called redundantly or during disk saturation.
            this.#needsSave = true;
            return;
        }

        this.#isSaving = true;
        this.#needsSave = false;

        try {
            await this.persistence.save(TrustMatrixManager.PERSISTENCE_KEY, this.currentMatrix);
            this.auditLog.log({ component: 'TrustMatrix', type: 'MATRIX_PERSIST', status: 'Complete', size: Object.keys(this.currentMatrix).length });
        } catch (error) {
            this.auditLog.error({ component: 'TrustMatrix', type: 'MATRIX_PERSIST_ERROR', error: error.message });
        } finally {
            this.#isSaving = false;
            
            // Critical check: If new updates occurred during the slow save process, reschedule immediately.
            if (this.#needsSave) {
                this.scheduleSave();
            }
        }
    }

    /**
     * Schedules persistence of the matrix using a debounce delay.
     * Public access to trigger manual save if needed, although usually handled internally.
     */
    scheduleSave() {
        if (this.#saveTimer) {
            // Reset the timer to extend the debounce period.
            clearTimeout(this.#saveTimer);
        }

        this.#saveTimer = setTimeout(() => {
            this.#saveTimer = null;
            this.#performSave();
        }, this.config.saveDebounceMs);

        // Optimization for Node.js event loop: allow the process to exit if only this timer is running.
        if (this.#saveTimer && typeof this.#saveTimer.unref === 'function') {
            this.#saveTimer.unref();
        }
    }

    /**
     * Updates the weight of a specific actor using Exponential Moving Average (EMA).
     * @param {string} actorId - The ID of the component or agent.
     * @param {number} performanceMetric - Calculated score (0.0 to 1.0).
     * @returns {number} The new calculated trust score/weight.
     */
    recalculateWeight(actorId, performanceMetric) {
        // Strict input validation
        if (typeof actorId !== 'string' || !actorId || typeof performanceMetric !== 'number' || isNaN(performanceMetric)) {
             this.auditLog.error({ 
                 component: 'TrustMatrix', 
                 type: 'MATRIX_INVALID_INPUT', 
                 message: 'Invalid actorId or performance metric type.',
                 input_metric: performanceMetric
             });
             return this.getWeight(actorId); // Return current weight, don't update
        }

        // Clamp incoming metric
        performanceMetric = Math.max(0.0, Math.min(1.0, performanceMetric));
        
        const currentWeight = this.currentMatrix[actorId] ?? this.config.initialTrustScore;
        
        // 1. Determine Alpha (Smoothing Factor)
        let alpha = this.config.smoothingFactor;
        
        // Adaptive Learning: Apply penalty boost if performance is worse than current trust.
        if (performanceMetric < currentWeight) {
            alpha = this.config.penaltyBoost; 
        }

        // 2. Calculate New Weight (EMA: W_new = alpha * Metric + (1 - alpha) * W_old)
        const finalWeight = (alpha * performanceMetric) + ((1 - alpha) * currentWeight);
        
        this.currentMatrix[actorId] = finalWeight;
        
        // 3. Schedule Persistence (Debounced)
        this.scheduleSave();
        
        // 4. Audit Log 
        // Only log updates that significantly change the score to prevent log bloat
        if (Math.abs(finalWeight - currentWeight) > 0.001) { 
            this.auditLog.log({
                component: 'TrustMatrix',
                type: 'MATRIX_UPDATE',
                actor: actorId,
                metric: performanceMetric.toFixed(4),
                alpha: alpha.toFixed(4),
                delta: (finalWeight - currentWeight).toFixed(4),
                new: finalWeight.toFixed(4)
            });
        }

        return finalWeight;
    }

    /**
     * Returns the current, dynamically updated weighting matrix.
     * Note: Returns a reference to the internal object for read efficiency. Callers should not modify it.
     * @returns {Object<string, number>}
     */
    getMatrix() {
        return this.currentMatrix;
    }

    /**
     * Synchronously retrieves the trust score for a specific actor.
     * @param {string} actorId 
     * @returns {number} The actor's current trust weight.
     */
    getWeight(actorId) {
        if (typeof actorId !== 'string') return this.config.initialTrustScore; // Defensive programming
        return this.currentMatrix[actorId] ?? this.config.initialTrustScore;
    }

    /**
     * Immediately triggers a save operation without waiting for the debounce delay.
     * Primarily used during graceful shutdown procedures.
     */
    async flush() {
        if (this.#saveTimer) {
            clearTimeout(this.#saveTimer);
            this.#saveTimer = null;
        }
        
        if (this.#isSaving) {
            // Signal the running save to re-run immediately after completion
            this.#needsSave = true; 
            // We return here, assuming the system caller will await system shutdown which ensures IO completes.
            return;
        }

        // Direct call to save, bypassing debounce checks.
        await this.#performSave();
    }
}

module.exports = TrustMatrixManager;