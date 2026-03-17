import { IKernel } from '@kernel/IKernel';

/**
 * @typedef {object} ValidationResult
 * @property {boolean} isValid
 * @property {string} [error]
 */

/**
 * Interface for a utility kernel that validates schemas based on weighted summation.
 * Replaces the synchronous import and usage of `WeightedSchemaValidator`.
 */
export class IWeightedSchemaValidatorToolKernel {
    /**
     * Executes weighted schema validation.
     * @param {object} params
     * @param {object} params.schema - The schema to validate.
     * @param {string} params.weightKey - The key holding the weight value.
     * @param {number} params.targetSum - The expected sum of weights (e.g., 1.0).
     * @param {number} [params.tolerance] - Floating point tolerance.
     * @returns {ValidationResult}
     */
    execute(params) {
        throw new Error("IWeightedSchemaValidatorToolKernel: Method 'execute' must be implemented.");
    }
}

/** @typedef {1 | -1} TrustPolarityValue */
/**
 * @typedef {Object} TrustMetricSchemaItem
 * @property {number} weight
 * @property {TrustPolarityValue} polarity
 * @property {string} description
 */

/**
 * ID: TC-SCHEMA-REGISTRY
 * Role: Stores and validates the immutable Trust Calculus (TC) schema definitions and constants.
 * Eliminates the static configuration file `src/config/trustCalculusSchema.js`.
 */
export class TrustCalculusSchemaRegistryKernel extends IKernel {
    /**
     * @param {object} dependencies
     * @param {IWeightedSchemaValidatorToolKernel} dependencies.weightedSchemaValidatorToolKernel
     */
    constructor(dependencies) {
        super();
        this.#weightedSchemaValidator = dependencies.weightedSchemaValidatorToolKernel;
        this.#polarity = {};
        this.#schemaDefinition = {};
        this.#metricNames = [];

        this.#setupDependencies();
    }

    #weightedSchemaValidator;
    #polarity;
    #schemaDefinition;
    #metricNames;

    /**
     * Defines, validates, and freezes the immutable configuration constants synchronously.
     * This isolates synchronous setup logic and enforces immutability.
     */
    #setupDependencies() {
        // --- 1. Constants Definition ---
        const TRUST_POLARITY = {
            POSITIVE: 1, 
            NEGATIVE: -1,
        };

        const { POSITIVE, NEGATIVE } = TRUST_POLARITY;

        /** @type {{[metricName: string]: TrustMetricSchemaItem}} */
        const SCHEMA_DEFINITION = {
            redundancyScore: {
                weight: 0.40,
                polarity: POSITIVE,
                description: "Reflects fallback safety net availability (resilience metric)."
            },
            criticalDependencyExposure: {
                weight: 0.35,
                polarity: NEGATIVE,
                description: "Reflects direct risk impact from potential failure cascade."
            },
            usageRate: {
                weight: 0.15,
                polarity: NEGATIVE,
                description: "Reflects current component necessity (Inverted: Lower usage increases retirement safety margin)."
            },
            complexityReductionEstimate: {
                weight: 0.10,
                polarity: POSITIVE,
                description: "Reflects technical debt reduction value upon retirement/removal."
            }
        };

        // --- 2. Validation using Dependency Injection ---
        this.#validateSchema(SCHEMA_DEFINITION, TRUST_POLARITY);
        
        // --- 3. Immutability Enforcement ---
        this.#polarity = Object.freeze(TRUST_POLARITY);
        this.#schemaDefinition = Object.freeze(SCHEMA_DEFINITION);
        this.#metricNames = Object.freeze(Object.keys(SCHEMA_DEFINITION));
    }

    /**
     * Executes validation logic using the injected tool.
     * @param {object} schema 
     * @param {object} polarities 
     */
    #validateSchema(schema, polarities) {
        const WEIGHT_TOLERANCE = 1e-9; 

        // 1. Validate Weight Summation
        const validationResult = this.#weightedSchemaValidator.execute({
            schema: schema,
            weightKey: 'weight',
            targetSum: 1.0,
            tolerance: WEIGHT_TOLERANCE,
        });

        if (!validationResult.isValid) {
            throw new Error(`[TC-SCHEMA ERROR] TrustCalculusSchemaRegistryKernel Initialization Failure (Weight Sum): ${validationResult.error}`);
        }
        
        // 2. Validate Polarity against defined constants
        const validPolarities = new Set(Object.values(polarities));
        for (const key in schema) {
            if (Object.prototype.hasOwnProperty.call(schema, key)) {
                const item = schema[key];
                if (!validPolarities.has(item.polarity)) {
                     throw new Error(`[TC-SCHEMA ERROR] Invalid polarity value for metric '${key}': ${item.polarity}`);
                }
            }
        }
    }

    /**
     * Retrieves the defined trust polarity constants.
     * @returns {Object}
     */
    getTrustPolarity() {
        return this.#polarity;
    }

    /**
     * Retrieves the validated and frozen metric schema definition.
     * @returns {{[metricName: string]: TrustMetricSchemaItem}}
     */
    getSchemaDefinition() {
        return this.#schemaDefinition;
    }

    /**
     * Retrieves the list of metric names defined in the schema.
     * @returns {string[]}
     */
    getMetricNames() {
        return this.#metricNames;
    }
}