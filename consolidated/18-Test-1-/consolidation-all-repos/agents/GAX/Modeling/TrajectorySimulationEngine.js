/**
 * The Trajectory Simulation Engine (TSE) is responsible for running high-fidelity,
 * asynchronous simulations of P3/P4 execution outcomes based on the current
 * Contextual State Record (CSR) and Axiomatic Constraint Verification Data (ACVD).
 * 
 * It utilizes an injected Statistical Model Handler to predict TEMM and ECVM scores.
 * 
 * It relies on an injected SynergyRegistry to access the SchemaValidationService for 
 * comprehensive input/output schema enforcement.
 */
class TrajectorySimulationEngine {
    // Defining Schemas as static properties for modern class structure and clarity
    static MANIFEST_SCHEMA = {
        entityId: { type: 'string', required: true },
        transactionId: { type: 'string', required: false },
        complexity: { type: 'number', required: false }
    };

    static PREDICTION_RESULT_SCHEMA = {
        temm: { type: 'number', required: true }, // Trajectory Execution Mitigation Metric
        ecvm: { type: 'boolean', required: true }  // Execution Constraint Verification Metric
    };

    /**
     * Internal handler for executing schema validation via the injected service.
     * Encapsulated utility that replaces the previous global _validateUtility.
     * @param {Object} validator - SchemaValidationService instance.
     * @param {Object} data - Data to validate.
     * @param {Object} schema - Schema definition.
     * @param {string} context - Error context string.
     */
    static async #validate(validator, data, schema, context) {
        if (!validator) return; 
        
        const validationResult = await validator.execute('validate', data, schema);
        
        if (!validationResult || !validationResult.isValid) {
            // Use optional chaining and nullish coalescing for safety
            const errors = validationResult?.errors?.join('; ') ?? 'Unknown validation error.';
            // Standardized error prefix
            throw new Error(`TSE Validation Failed [${context}]: ${errors}`);
        }
    }

    /**
     * @param {Object} ACVD_Store - Data store containing historical execution metrics and constraints.
     * @param {Object} Configuration - System configuration and load factors.
     * @param {Object} ModelHandler - The initialized predictive model wrapper implementing the 'predict' interface.
     * @param {Object} [SynergyRegistry={}] - Central registry for accessing kernel capabilities (e.g., SchemaValidationService).
     */
    constructor(ACVD_Store, Configuration, ModelHandler, SynergyRegistry = {}) {
        if (!ModelHandler || typeof ModelHandler.predict !== 'function') {
            throw new Error("TSE Initialization Error: A valid ModelHandler implementing an asynchronous 'predict' method is required.");
        }

        this.ACVD = ACVD_Store;
        this.config = Configuration;
        this.model = ModelHandler;
        
        // Dependency Initialization: Resolve the SchemaValidationService once upon construction
        this.validator = (SynergyRegistry && typeof SynergyRegistry.getService === 'function')
            ? SynergyRegistry.getService('SchemaValidationService')
            : null;
        
        this.synergyRegistry = SynergyRegistry;
    }

    /**
     * Generates feature vectors from the input manifest for model consumption.
     * @param {Object} inputManifest
     * @returns {Promise<Object>} Feature vector
     */
    async #extractFeatures(inputManifest) {
        try {
            // Use destructuring with defaults for clean access and clarity
            const { entityId, transactionId = 'N/A', complexity = 5 } = inputManifest;
            
            // Robust ACVD interaction with guaranteed fallback (0 risk) on failure
            const historyRisk = await this.ACVD.getHistoricalRisk(entityId).catch(() => 0);

            return {
                transactionId,
                complexity_score: complexity, 
                history_risk: historyRisk, 
                current_load_factor: this.config.getCurrentLoadFactor() 
            };
        } catch (error) {
            console.error("TSE Feature Extraction Failed: Could not process ACVD data.", error);
            // Prefix error for standardized detection in runSimulation catch block
            throw new Error(`Feature extraction failed: ${error.message || String(error)}`); 
        }
    }

    /**
     * Executes input checks, comprehensive validation, and feature vector generation.
     * Consolidates all necessary steps to prepare data structures for model execution.
     * @param {Object} inputManifest
     * @returns {Promise<{features: Object, entityId: string}>}
     */
    async #prepareExecutionData(inputManifest) {
        // 1. Critical Minimal Input Check
        if (!inputManifest?.entityId) {
             throw new Error("Invalid Manifest: 'entityId' is required and must be a string for simulation.");
        }
        const entityId = inputManifest.entityId;

        // 2. Comprehensive Input Validation (using encapsulated utility)
        await TrajectorySimulationEngine.#validate(
            this.validator,
            inputManifest, 
            TrajectorySimulationEngine.MANIFEST_SCHEMA, 
            'Input Manifest'
        );

        // 3. Feature Vector Generation
        const features = await this.#extractFeatures(inputManifest);
        
        return { features, entityId };
    }

    /**
     * Runs the full trajectory simulation by extracting features and calling the model handler.
     * @param {Object} inputManifest
     * @returns {Promise<{predictedTEMM: number, predictedECVM: boolean}>}
     */
    async runSimulation(inputManifest) {
        let entityId = 'unknown';

        try {
            // 1. Prepare and Validate Input
            const { features, entityId: preparedEntityId } = await this.#prepareExecutionData(inputManifest);
            entityId = preparedEntityId; // Update for logging/context

            // 2. Execute asynchronous model inference
            const results = await this.model.predict(features);

            // 3. Comprehensive Output Validation (using encapsulated utility)
            await TrajectorySimulationEngine.#validate(
                this.validator,
                results, 
                TrajectorySimulationEngine.PREDICTION_RESULT_SCHEMA, 
                'Model Output'
            );

            // Fallback manual check only if the validation service is absent
            if (!this.validator && (typeof results.temm !== 'number' || typeof results.ecvm !== 'boolean')) {
                 throw new Error("Model output format invalid (No Validator): Expected {temm: number, ecvm: boolean}.");
            }

            return {
                predictedTEMM: results.temm,
                predictedECVM: results.ecvm
            };
        } catch (error) {
            console.error(`TSE Simulation Failed for Entity ${entityId}:`, error.message);
            
            const errorMessage = error.message || String(error);
            
            // Identify and re-throw errors generated intentionally by TSE's internal structure 
            // (validation checks, feature extraction failures, or manifest structure checks).
            if (errorMessage.startsWith('TSE Validation Failed') || 
                errorMessage.startsWith('Feature extraction failed') ||
                errorMessage.startsWith('Invalid Manifest')
            ) {
                throw error; 
            }

            // Otherwise, wrap the general prediction system error (e.g., model handler failure).
            throw new Error(`Trajectory simulation failed due to prediction system error. Details: ${errorMessage}`);
        }
    }
}

module.exports = TrajectorySimulationEngine;