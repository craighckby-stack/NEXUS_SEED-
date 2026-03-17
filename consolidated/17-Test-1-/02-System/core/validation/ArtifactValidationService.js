const ContentValidatorRegistry = require('./ContentValidatorRegistry');

/**
 * ArtifactValidationService.js
 * Coordinates the execution of registered content validators against defined code artifacts or files.
 * This service decouples validation execution from validator registration.
 */
class ArtifactValidationService {
    constructor() {
        // Uses the globally managed singleton registry instance
        this.registry = ContentValidatorRegistry;
    }

    /**
     * Executes defined validation profiles against provided content/artifacts.
     * Artifacts should specify the required validator name.
     * 
     * @param {Array<Object>} artifacts - List of artifact descriptors.
     *   Example: [{ content: '...', validatorName: 'jsLinter', config: {} }]
     * @returns {Promise<Array<Object>>} Validation results.
     */
    async validateArtifacts(artifacts) {
        if (!Array.isArray(artifacts)) {
            throw new Error('Artifacts must be provided as an array.');
        }

        const validationPromises = artifacts.map(async (artifact) => {
            const { content, validatorName, config = {} } = artifact;
            const validator = this.registry.getValidator(validatorName);

            if (!validator) {
                return {
                    validatorName,
                    success: false,
                    message: `Validation skipped: Validator '${validatorName}' not registered.`
                };
            }

            try {
                // The validator must return an object: { success: boolean, details: Array<Object> }
                const validationResult = await validator.validate(content, config);
                
                return {
                    validatorName,
                    success: validationResult.success,
                    details: validationResult.details || [],
                    error: validationResult.error || null // Propagate internal validator errors if defined
                };
            } catch (error) {
                // Handle execution exceptions (e.g., unexpected code crash in validator)
                return {
                    validatorName,
                    success: false,
                    message: `Validation failed due to internal error in '${validatorName}': ${error.message}`
                };
            }
        });

        return Promise.all(validationPromises);
    }
}

module.exports = ArtifactValidationService;
