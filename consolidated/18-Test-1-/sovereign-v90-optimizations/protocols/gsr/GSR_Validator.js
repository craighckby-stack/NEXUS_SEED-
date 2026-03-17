import { TimeSeriesDeltaValidator } from '../../plugins/validation/TimeSeriesDeltaValidator.js';

/**
 * Configuration constants for physiological plausibility.
 */
const GSR_PARAMS = {
    MIN_CONDUCTANCE_uS: 0.05, // Lower physiological limit (microsiemens)
    MAX_CONDUCTANCE_uS: 50.0, // Upper physiological limit
    // Rate of change used by the TimeSeriesDeltaValidator plugin
    MAX_RATE_OF_CHANGE_uS_PER_MS: 0.1,
};

/**
 * @typedef {object} GSRReading
 * @property {number} timestamp - Time in milliseconds.
 * @property {number} conductance_uS - Galvanic Skin Response reading (microsiemens).
 */

/**
 * Validates GSR readings based on static ranges and dynamic rate-of-change limits.
 * Encapsulates configuration and delegates sequence consistency checks to the TimeSeriesDeltaValidator.
 */
class GSRValidatorKernel {
    /** @type {object} */
    #config;
    /** @type {TimeSeriesDeltaValidator} */
    #deltaValidator;

    /**
     * Initializes the validator kernel, setting up configuration and dependencies.
     * @param {object} [dependencies={}] - Optional dependencies for testing/injection.
     * @param {object} [dependencies.config=GSR_PARAMS] - Configuration overrides.
     * @param {function} [dependencies.TimeSeriesDeltaValidator=TimeSeriesDeltaValidator] - Delta Validator dependency.
     */
    constructor(dependencies = {}) {
        this.#setupDependencies(dependencies);
    }

    /**
     * Executes synchronous dependency validation and configuration loading.
     * Satisfies the synchronous setup extraction goal.
     * @private
     */
    #setupDependencies(dependencies) {
        const config = dependencies.config || GSR_PARAMS;
        const DeltaValidatorClass = dependencies.TimeSeriesDeltaValidator || TimeSeriesDeltaValidator;

        if (!config || typeof config.MAX_RATE_OF_CHANGE_uS_PER_MS !== 'number') {
            this.#throwSetupError("Invalid or missing GSR configuration constants.");
        }
        if (typeof DeltaValidatorClass !== 'function') {
            this.#throwSetupError("TimeSeriesDeltaValidator dependency is missing or invalid.");
        }

        this.#config = config;
        
        const maxRate = this.#delegateToConfigAccess('MAX_RATE_OF_CHANGE_uS_PER_MS');
        const valueKey = 'conductance_uS';

        // Instantiate the external dependency
        this.#deltaValidator = new DeltaValidatorClass(maxRate, valueKey);
    }

    /**
     * Proxy for synchronous configuration access.
     * @private
     */
    #delegateToConfigAccess(key) {
        return this.#config[key];
    }

    /**
     * Checks basic structural integrity of a single reading.
     * @private
     */
    #checkStructure(reading) {
        return typeof reading?.conductance_uS === 'number' && typeof reading.timestamp === 'number';
    }

    /**
     * Checks if the conductance value falls within physiological range.
     * @private
     */
    #checkRange(value) {
        const MIN = this.#delegateToConfigAccess('MIN_CONDUCTANCE_uS');
        const MAX = this.#delegateToConfigAccess('MAX_CONDUCTANCE_uS');
        return value >= MIN && value <= MAX;
    }

    /**
     * Checks for negative timestamps.
     * @private
     */
    #checkNegativeTimestamp(timestamp) {
        return timestamp < 0;
    }

    /**
     * Delegates dynamic rate-of-change and monotonicity validation to the external tool.
     * @private
     */
    #delegateToDeltaValidation(readings) {
        return this.#deltaValidator.validateSequence(readings);
    }

    /**
     * Throws a setup error, serving as an I/O proxy for critical failure.
     * @private
     */
    #throwSetupError(message) {
        throw new Error(`GSRValidatorKernel Setup Error: ${message}`);
    }

    /**
     * Checks basic structural integrity and static range bounds for a single reading.
     * @param {GSRReading} reading
     * @returns {boolean} True if the structure and value are valid.
     */
    validateReading(reading) {
        if (!this.#checkStructure(reading)) {
            return false;
        }

        const value = reading.conductance_uS;

        // Range check via proxy
        if (!this.#checkRange(value)) {
            return false;
        }

        // Time check via proxy
        if (this.#checkNegativeTimestamp(reading.timestamp)) {
            return false;
        }

        return true;
    }

    /**
     * Validates an entire time-ordered sequence of readings.
     * 1. Iterates rapidly to ensure all readings are individually valid (range check).
     * 2. Delegates rate-of-change and monotonicity checks to the abstracted validator.
     * @param {GSRReading[]} readings
     * @returns {boolean} True if the entire sequence is valid and consistent.
     */
    validateSequence(readings) {
        if (!Array.isArray(readings) || readings.length === 0) {
            return true; // Trivially valid sequence
        }

        // Phase 1: Range and Structure Check (Optimized for fail-fast)
        for (let i = 0; i < readings.length; i++) {
            if (!this.validateReading(readings[i])) {
                return false;
            }
        }

        // Phase 2: Dynamic Delta and Monotonicity Check (Delegated via I/O Proxy)
        return this.#delegateToDeltaValidation(readings);
    }
}

export default GSRValidatorKernel;