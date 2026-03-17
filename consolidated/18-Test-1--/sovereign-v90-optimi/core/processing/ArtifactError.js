const { CanonicalBaseError } = require('CanonicalBaseError');

/**
 * ArtifactError.js
 * Custom error hierarchy for Artifact Processing pipeline failures, enabling 
 * programmatic error identification by the orchestrating layer.
 */

class ArtifactBaseError extends CanonicalBaseError {
    /** @type {string} Canonical prefix for all Artifact Processing errors. */
    static ERROR_PREFIX = 'AGI_ARTIFACT_PROCESS';
    /** @type {number} Default HTTP status code for general processing failures. */
    static HTTP_STATUS_CODE = 500;
}

class ResolutionError extends ArtifactBaseError {
    static ERROR_NAME = 'ResolutionError';

    /**
     * @param {any} dependencies
     * @returns {{dependencies: any}}
     */
    #initializeDetails(dependencies) {
        return { dependencies };
    }

    constructor(message, dependencies) {
        super(message, this.#initializeDetails(dependencies));
    }
}

class GenerationError extends ArtifactBaseError {
    static ERROR_NAME = 'GenerationError';

    /**
     * @param {string} generatorRef
     * @returns {{generatorRef: string}}
     */
    #initializeDetails(generatorRef) {
        return { generatorRef };
    }

    constructor(message, generatorRef) {
        super(message, this.#initializeDetails(generatorRef));
    }
}

class ValidationError extends ArtifactBaseError {
    static ERROR_NAME = 'ValidationError';
    // 400 is used here as validation typically implies the input artifact/data was malformed or non-compliant.
    static HTTP_STATUS_CODE = 400;

    /**
     * @param {Array<Object>} errors
     * @returns {{validationErrors: Array<Object>}}
     */
    #initializeDetails(errors) {
        return { validationErrors: errors };
    }

    constructor(message, errors) {
        super(message, this.#initializeDetails(errors));
    }
}

class HookExecutionError extends ArtifactBaseError {
    static ERROR_NAME = 'HookExecutionError';

    /**
     * @param {string} hookName
     * @returns {{hookName: string}}
     */
    #initializeDetails(hookName) {
        return { hookName };
    }

    constructor(message, hookName) {
        super(message, this.#initializeDetails(hookName));
    }
}

module.exports = {
    ArtifactBaseError,
    ResolutionError,
    GenerationError,
    ValidationError,
    HookExecutionError
};