import { XEL_Specification } from '../config/XEL_Specification.json';
import Ajv from 'ajv';
import { SchemaFailureAnalyzer } from '../emergent/meta_tools/SchemaFailureAnalyzer.js';
import { ErrorCapabilityMapper } from '../plugins/ErrorCapabilityMapper.js';

/**
 * Custom error class for structured, machine-readable validation failures.
 */
class SchemaValidationError extends Error {
    constructor(schemaName, errors) {
        const tempAjv = new Ajv();
        const errorText = errors && Array.isArray(errors)
            ? tempAjv.errorsText(errors, { separator: '; ', dataVar: schemaName })
            : 'Validation context missing or malformed.';

        const criticalKeyword = errors && errors.length > 0 ? `[${errors[0].keyword}]` : '';

        super(`XEL Validation Failed [${schemaName}] ${criticalKeyword}: ${errorText}`);
        this.name = 'SchemaValidationError';
        this.schemaName = schemaName;
        this.validationErrors = errors;
    }
}

/**
 * @typedef {Object} NavigatorSuggestion
 * @property {string} path - The relative file path to target (e.g., 'core/TaskScheduler.js').
 * @property {string} reason - Justification for the weight increase.
 * @property {number} increasedWeight - The weight factor to add (0.0 to 1.0).
 * @property {string} originatingCapability - The AGI Capability that suffered the failure (e.g., 'Logic', 'Memory', 'Navigation').
 */

/**
 * The Schema Validator enforces the structural integrity of data across the XEL environment.
 * It is designed for robustness (Error Handling) and dynamic updates (Autonomy).
 */
class SchemaValidatorEngine {
    static #MAX_HISTORY = 100;

    #validator = null;
    #kernelVersion;
    #schemaComponentMap;
    #onValidationFailure;
    #capabilityMapper;
    #runtimeMapper;
    #failureHistory = [];
    #analyzer;

    /**
     * @param {object} options - Configuration options.
     * @param {object} [options.componentSchemas] - Schema definitions to override defaults.
     * @param {function} [options.onValidationFailure] - Callback function for Nexus/MQM logging. (mqmPayload, failureEntry)
     * @param {string} [options.kernelVersion='N/A'] - The current kernel version for dynamic reporting (Meta-Reasoning).
     * @param {object} [options.schemaComponentMap] - Map of schemaName -> {componentPath: string, priority: number} for Navigation targeting.
     * @param {function} [options.runtimeMapper] - Injectable function for mapping keywords to capabilities (overrides fallback).
     */
    constructor(options = {}) {
        const {
            componentSchemas,
            onValidationFailure,
            kernelVersion = 'N/A',
            schemaComponentMap = {},
            runtimeMapper
        } = options;

        this.SchemaValidationError = SchemaValidationError;
        this.#kernelVersion = kernelVersion;
        this.#schemaComponentMap = schemaComponentMap;
        this.#onValidationFailure = onValidationFailure || (() => {});
        this.#failureHistory = [];

        this.#setupRuntimeMapper(runtimeMapper);
        this.#initializeValidator(componentSchemas || XEL_Specification.ComponentSchemas);
        this.#analyzer = new SchemaFailureAnalyzer({
            schemaComponentMap: this.#schemaComponentMap
        });
    }

    /**
     * Synchronously resolves and configures the runtime capability mapping dependency.
     * Handles conditional injection or instantiation/binding of the ErrorCapabilityMapper plugin.
     * @param {function | undefined} runtimeMapper - Optional injected mapper function.
     */
    #setupRuntimeMapper(runtimeMapper) {
        if (runtimeMapper) {
            this.#runtimeMapper = runtimeMapper;
            return;
        }

        this.#capabilityMapper = new ErrorCapabilityMapper();
        this.#runtimeMapper = this.#capabilityMapper.mapKeywordToCapability.bind(this.#capabilityMapper);
    }

    /**
     * Initializes or re-initializes the Ajv instance configuration.
     * @param {object} componentSchemas - Map of schema names to JSON Schema definitions.
     */
    #initializeValidator(componentSchemas) {
        this.#validator = new Ajv({
            allErrors: true,
            strict: true,
            removeAdditional: 'all'
        });

        this.#registerComponentSchemas(componentSchemas);
    }

    /**
     * Iterates through component schemas and registers them with the configured Ajv instance.
     * @param {object} componentSchemas - Map of schema names to JSON Schema definitions.
     */
    #registerComponentSchemas(componentSchemas) {
        if (!componentSchemas || typeof componentSchemas !== 'object' || Array.isArray(componentSchemas)) {
            return;
        }

        Object.entries(componentSchemas).forEach(([name, schema]) => {
            try {
                if (this.#validator.getSchema(name)) {
                    this.#validator.removeSchema(name);
                }
                this.#validator.addSchema(schema, name);
            } catch (e) {
                console.error(`[SCHEMA_ENGINE]: Failed to register schema ${name}:`, e.message);
            }
        });
    }

    /**
     * Public method to manually trigger a schema refresh, allowing the kernel
     * to update specifications without a full reboot (Autonomy).
     * @param {object} newSpecification - The new ComponentSchemas object.
     */
    refreshSchemas(newSpecification) {
        this.#initializeValidator(newSpecification);
    }

    /**
     * Internal method to log validation failures for Meta-Reasoning analysis and trigger MQM/Nexus logging.
     */
    #trackFailure(schemaName, errors, isCritical, dataSample) {
        const summary = errors?.map(e => ({
            path: e.instancePath || e.dataPath || 'N/A',
            keyword: e.keyword,
            message: e.message
        })) || [];

        const firstErrorKeyword = summary[0]?.keyword || 'unknown';
        const capability = this.#runtimeMapper(firstErrorKeyword) || 'General';

        const failureEntry = {
            timestamp: Date.now(),
            schemaName,
            isCritical,
            capability,
            summary,
            dataSample: dataSample ? JSON.stringify(dataSample).substring(0, 200) : null
        };

        this.#failureHistory.push(failureEntry);
        if (this.#failureHistory.length > SchemaValidatorEngine.#MAX_HISTORY) {
            this.#failureHistory.shift();
        }

        const mqmPayload = {
            schema: schemaName,
            severity: isCritical ? 'critical' : 'warning',
            capability,
            summary: summary.slice(0, 3).map(e => `${e.keyword} at ${e.path}`).join('; '),
            kernelVersion: this.#kernelVersion
        };

        this.#onValidationFailure(mqmPayload, failureEntry);
    }

    /**
     * Validates data against a named schema, throwing SchemaValidationError on failure.
     * @param {string} schemaName - The identifier of the schema to use.
     * @param {any} data - The data to validate.
     * @returns {boolean} True if validation passes.
     * @throws {SchemaValidationError} If validation fails.
     */
    validate(schemaName, data) {
        const validate = this.#validator.getSchema(schemaName);
        if (!validate) {
            throw new Error(`Schema [${schemaName}] not found in validator instance.`);
        }

        const isValid = validate(data);
        if (!isValid) {
            this.#trackFailure(schemaName, validate.errors, true, data);
            throw new SchemaValidationError(schemaName, validate.errors);
        }

        return true;
    }

    /**
     * Validates data without throwing an error. Returns validation status and errors.
     * @param {string} schemaName - The identifier of the schema to use.
     * @param {any} data - The data to validate.
     * @returns {{isValid: boolean, errors?: Ajv.ErrorObject[]}} Validation result.
     */
    validateAsync(schemaName, data) {
        const validate = this.#validator.getSchema(schemaName);
        if (!validate) {
            throw new Error(`Schema [${schemaName}] not found in validator instance.`);
        }

        const isValid = validate(data);
        if (!isValid) {
            this.#trackFailure(schemaName, validate.errors, false, data);
        }

        return {
            isValid,
            errors: isValid ? undefined : validate.errors
        };
    }

    /**
     * Analyzes validation failures to provide suggestions for improvement.
     * @param {string} schemaName - The identifier of the schema to use.
     * @returns {NavigatorSuggestion[]} Array of suggestions for schema improvement.
     */
    analyze(schemaName) {
        const relevantFailures = this.#failureHistory.filter(
            entry => entry.schemaName === schemaName && entry.isCritical
        );

        if (relevantFailures.length === 0) {
            return [];
        }

        return this.#analyzer.analyze(relevantFailures);
    }

    /**
     * Retrieves the validation history for a given schema.
     * @param {string} schemaName - The identifier of the schema to use.
     * @returns {Array<Object>} Array of validation failure entries.
     */
    getValidationHistory(schemaName) {
        return this.#failureHistory.filter(entry => entry.schemaName === schemaName);
    }

    /**
     * Clears the validation history.
     */
    clearHistory() {
        this.#failureHistory = [];
    }

    /**
     * Returns the current number of tracked failures.
     * @returns {number} Count of tracked failures.
     */
    getFailureCount() {
        return this.#failureHistory.length;
    }
}

export { SchemaValidatorEngine, SchemaValidationError };e = this.#validator.getSchema(schemaName);
        if (!validate) {
            return { isValid: false, errors: [{ keyword: 'missing_schema', message: `Schema [${schemaName}] not found.` }] };
        }

        const isValid = validate(data);
        if (!isValid) {
            this.#trackFailure(schemaName, validate.errors, false, data);
        }

        return { isValid, errors: isValid ? undefined : validate.errors };
    }

    /**
     * Generates Navigator suggestions based on failure history using emergent analysis.
     * @returns {NavigatorSuggestion[]} Array of suggestions for system improvement.
     */
    generateNavigatorSuggestions() {
        return this.#analyzer.analyzeFailures(this.#failureHistory);
    }

    /**
     * Retrieves the current failure history for external analysis or reporting.
     * @returns {Array<object>} Copy of the internal failure history.
     */
    getFailureHistory() {
        return [...this.#failureHistory];
    }

    /**
     * Clears the internal failure history, typically used after system recovery or maintenance.
     */
    clearFailureHistory() {
        this.#failureHistory = [];
    }
}

export { SchemaValidatorEngine, SchemaValidationError };|| 'N/A';

        // REFACTORED: Use the private runtime mapper
        const capabilityImpact = this.#runtimeMapper(firstErrorKeyword);

        const failureEntry = {
            timestamp: Date.
