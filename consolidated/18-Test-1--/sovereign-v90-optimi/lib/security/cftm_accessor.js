/**
 * CFTMAccessor (Core Failure Thresholds Manifest Accessor)
 * Implements strict, read-only access to immutable governance constants.
 * Pre-processes the config to ensure type-safe, optimized constant access.
 */

/**
 * Custom error type for configuration issues related to the CFTM.
 */
class CFTMConfigurationError extends Error {
    constructor(message, key) {
        super(`CFTM Error: ${message}${key ? ` (Key: ${key})` : ''}`);
        this.name = 'CFTMConfigurationError';
        this.key = key;
    }
}

/**
 * Abstracted processor for numerical constant maps.
 * Handles validation, flattening, and freezing, using CFTMConfigurationError for specialized context.
 */
class ImmutableNumericalConstantProcessor {
    #map;
    #ErrorType;

    /**
     * @param {object} rawConfig - The root configuration object.
     * @param {string} rootKey - The property name within rawConfig to process.
     * @param {Error} ErrorType - The specialized error class to throw.
     */
    constructor(rawConfig, rootKey, ErrorType) {
        this.#ErrorType = ErrorType;
        this.#setupProcessor(rawConfig, rootKey); // Synchronous setup extraction
    }

    // === Setup and Initialization (Synchronous Setup Extraction Goal) ===

    #setupProcessor(rawConfig, rootKey) {
        // 1. Validate root config existence
        if (!this.#checkRootConfigExistence(rawConfig, rootKey)) {
            this.#throwSetupError(`Missing or invalid '${rootKey}' configuration object.`);
        }

        const processedMap = {};
        const constants = rawConfig[rootKey];

        // 2. Process and validate individual constants
        for (const key in constants) {
            if (Object.prototype.hasOwnProperty.call(constants, key)) {
                const constant = constants[key];

                if (!this.#validateConstantStructure(constant)) {
                    this.#throwProcessingError(
                        `Malformed constant entry. Expected { value: number, ... }, received invalid structure or non-finite number.`,
                        key
                    );
                }

                // Flatten the structure for direct numerical access efficiency
                processedMap[key] = constant.value;
            }
        }

        // 3. Freeze and store the map
        this.#map = this.#delegateToFreeze(processedMap);
    }

    // === I/O Proxies and Control Flow Proxies (I/O Proxy Creation Goal) ===

    #checkRootConfigExistence(rawConfig, rootKey) {
        // Encapsulates configuration structure check
        return rawConfig && rawConfig[rootKey];
    }

    #validateConstantStructure(constant) {
        // Encapsulates validation logic (object, number value, finiteness)
        return !(constant === null || typeof constant !== 'object' || typeof constant.value !== 'number' || !isFinite(constant.value));
    }

    #delegateToFreeze(map) {
        // Encapsulates Object.freeze operation
        return Object.freeze(map);
    }

    #throwSetupError(message) {
        // Encapsulates control flow (error throwing during setup)
        throw new this.#ErrorType(message);
    }

    #throwProcessingError(message, key) {
        // Encapsulates control flow (error throwing during constant iteration)
        throw new this.#ErrorType(message, key);
    }

    #throwAccessError(key) {
        // Encapsulates control flow (error throwing during access)
        throw new this.#ErrorType(`Constant key not found.`, key);
    }

    // === Public Interface ===

    /**
     * @param {string} key - The constant identifier.
     * @returns {number} The immutable numerical value.
     * @throws {Error} If the constant is not defined.
     */
    get(key) {
        const value = this.#map[key];

        if (value === undefined) {
            this.#throwAccessError(key);
        }

        return value;
    }
}

class CFTMAccessor {
    #processor;

    /**
     * @param {object} cftmConfig - The configuration object, expected to contain cftmConfig.thresholds.
     */
    constructor(cftmConfig) {
        this.#setupDependencies(cftmConfig); // Synchronous setup extraction
    }

    // === Setup and Initialization (Synchronous Setup Extraction Goal) ===

    #setupDependencies(cftmConfig) {
        // Delegate configuration processing, validation, and freezing to the specialized processor.
        this.#processor = this.#delegateToProcessorCreation(
            cftmConfig,
            'thresholds',
            CFTMConfigurationError
        );
    }

    // === I/O Proxies (I/O Proxy Creation Goal) ===

    #delegateToProcessorCreation(config, rootKey, ErrorType) {
        // Encapsulates dependency instantiation
        return new ImmutableNumericalConstantProcessor(config, rootKey, ErrorType);
    }

    #delegateToProcessorGet(key) {
        // Encapsulates dependency method delegation
        return this.#processor.get(key);
    }

    // === Public Interface ===

    /**
     * @param {string} key - The constant identifier.
     * @returns {number} The immutable numerical value.
     * @throws {CFTMConfigurationError} If the constant is not defined.
     */
    getThreshold(key) {
        return this.#delegateToProcessorGet(key);
    }

    /**
     * Specialized accessor for Stability Tau (for GAX-S-02.1).
     * @returns {number}
     */
    getStabilityTau() {
        return this.getThreshold('DENOMINATOR_STABILITY_TAU');
    }

    /**
     * Specialized accessor for Efficacy Safety Margin (for GAX-P-01.2).
     * @returns {number}
     */
    getEfficacySafetyMargin() {
        return this.getThreshold('MINIMUM_EFFICACY_SAFETY_MARGIN_EPSILON');
    }
}

module.exports = { CFTMAccessor, CFTMConfigurationError };
