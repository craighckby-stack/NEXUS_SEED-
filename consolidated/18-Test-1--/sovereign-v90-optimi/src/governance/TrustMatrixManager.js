/**
 * src/governance/TrustMatrixManagerKernel.js
 * Purpose: Manages the dynamic evolution of the RCDM weighting_matrix (trust matrix)
 * based on real-time performance, compliance history, and behavioral audits of actors.
 * This component handles asynchronous persistence and state updates.
 *
 * Refactoring Rationale:
 * 1. Kernel Compliance: Renamed and enforced asynchronous initialization (initialize()).
 * 2. Dependency Injection: Replaced raw objects (persistenceLayer, auditLog) with
 *    high-integrity interfaces: CachePersistenceInterfaceKernel, ILoggerToolKernel, 
 *    and ISpecValidatorKernel.
 * 3. Configuration Management: Abstracted configuration loading and validation to 
 *    a conceptual registry (ITrustMatrixConfigRegistryKernel) and ISpecValidatorKernel.
 * 4. Asynchronous I/O: Eliminated synchronous matrix loading and ensured persistence
 *    is handled asynchronously via CachePersistenceInterfaceKernel and the injected
 *    IAsyncDebouncerToolKernel.
 */

class TrustMatrixManagerKernel {

    private config: any;
    private currentMatrix: Record<string, number> = {};
    private persistenceKey: string;

    // Injected Dependencies
    private logger: ILoggerToolKernel;
    private persistence: CachePersistenceInterfaceKernel;
    private configRegistry: any; // ITrustMatrixConfigRegistryKernel (conceptual)
    private debouncer: IAsyncDebouncerToolKernel;
    private validator: ISpecValidatorKernel;

    /**
     * Standard Kernel Constructor: Only performs dependency injection and setup validation.
     * Configuration and I/O are deferred to initialize().
     */
    constructor(dependencies: {
        logger: ILoggerToolKernel,
        persistence: CachePersistenceInterfaceKernel,
        configRegistry: any, // ITrustMatrixConfigRegistryKernel
        debouncer: IAsyncDebouncerToolKernel,
        validator: ISpecValidatorKernel
    }) {
        this.logger = dependencies.logger;
        this.persistence = dependencies.persistence;
        this.configRegistry = dependencies.configRegistry;
        this.debouncer = dependencies.debouncer;
        this.validator = dependencies.validator;

        this.#setupDependencies();
    }

    #setupDependencies(): void {
        if (!this.logger || !this.persistence || !this.configRegistry || !this.debouncer || !this.validator) {
            throw new Error("TrustMatrixManagerKernel: All required dependencies must be injected.");
        }
    }

    /**
     * Asynchronous Kernel Initialization. Loads configuration, validates it, and loads state.
     */
    async initialize(): Promise<void> {
        this.logger.debug('TrustMatrixManagerKernel: Starting initialization.');

        // 1. Load Configuration asynchronously (assuming registry provides defaults and schema)
        const defaults = await this.configRegistry.getDefaultConfig();
        const schema = await this.configRegistry.getConfigSchema();
        
        const validationResult = await this.validator.validate(schema, defaults);
        if (!validationResult.isValid) {
            await this.logger.fatal('TrustMatrixManagerKernel: Configuration failed schema validation.', { errors: validationResult.errors });
            throw new Error('Kernel configuration error: Trust Matrix settings invalid.');
        }
        
        this.config = defaults; 
        this.persistenceKey = this.config.persistenceKey || 'trust_matrix_state'; 

        // 2. Initialize the I/O Debounce Scheduler
        this.debouncer.setup({
            asyncTask: () => this.#performSaveInternal(),
            delayMs: this.config.saveDebounceMs,
            // Delegate error reporting to the injected logger
            logFunction: (details: any) => this.logger.error({
                component: 'TrustMatrix',
                type: 'DEBOUNCE_ERROR',
                details: details
            })
        });

        // 3. Asynchronously Load Matrix
        await this.#loadMatrix();
        
        this.logger.info('TrustMatrixManagerKernel initialized successfully.', { key: this.persistenceKey });
    }

    /**
     * Asynchronous initialization method to load the matrix from persistent storage.
     */
    async #loadMatrix(): Promise<void> {
        try {
            const loadedData = await this.persistence.load(this.persistenceKey);
            
            this.currentMatrix = (loadedData && typeof loadedData === 'object') ? loadedData : {};

            await this.logger.log({
                component: 'TrustMatrix',
                type: 'MATRIX_LOAD',
                status: 'Success',
                size: Object.keys(this.currentMatrix).length
            });
        } catch (error: any) {
            this.currentMatrix = {};
            await this.logger.error({
                component: 'TrustMatrix',
                type: 'MATRIX_LOAD_ERROR',
                message: `Failed to load initial matrix: ${error.message}`
            });
        }
    }

    /**
     * Executes the actual persistence write operation.
     */
    async #performSaveInternal(): Promise<void> {
        try {
            await this.persistence.save(this.persistenceKey, this.currentMatrix);
            await this.logger.log({ component: 'TrustMatrix', type: 'MATRIX_PERSIST', status: 'Complete', size: Object.keys(this.currentMatrix).length });
        } catch (error: any) {
            await this.logger.error({ component: 'TrustMatrix', type: 'MATRIX_PERSIST_ERROR', error: error.message });
        }
    }

    /**
     * Schedules persistence of the matrix using a debounce delay.
     */
    scheduleSave(): void {
        this.debouncer.schedule();
    }

    /**
     * Updates the weight of a specific actor using Exponential Moving Average (EMA).
     * @param {string} actorId - The ID of the component or agent.
     * @param {number} performanceMetric - Calculated score (0.0 to 1.0).
     * @returns {Promise<number>} The new calculated trust score/weight.
     */
    async recalculateWeight(actorId: string, performanceMetric: number): Promise<number> {
        // Strict input validation
        if (typeof actorId !== 'string' || !actorId || typeof performanceMetric !== 'number' || isNaN(performanceMetric)) {
             await this.logger.error({ 
                 component: 'TrustMatrix', 
                 type: 'MATRIX_INVALID_INPUT', 
                 message: 'Invalid actorId or performance metric type.',
                 input_metric: performanceMetric
             });
             return this.getWeight(actorId);
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
        if (Math.abs(finalWeight - currentWeight) > 0.001) { 
            await this.logger.log({
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
     * Returns a copy of the current, dynamically updated weighting matrix.
     * @returns {Object<string, number>} A shallow copy to prevent mutation.
     */
    getMatrix(): Record<string, number> {
        return { ...this.currentMatrix };
    }

    /**
     * Synchronously retrieves the trust score for a specific actor.
     * @param {string} actorId 
     * @returns {number} The trust score, or the initial default score if not found.
     */
    getWeight(actorId: string): number {
        return this.currentMatrix[actorId] ?? this.config.initialTrustScore;
    }
}