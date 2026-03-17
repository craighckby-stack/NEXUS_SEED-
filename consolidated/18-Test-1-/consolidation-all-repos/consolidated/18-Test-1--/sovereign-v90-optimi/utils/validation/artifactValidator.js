const { InvalidArtifactError } = require('../errors/InvalidArtifactError');

// AGI-KERNEL: Use the extracted tool for key presence validation
const KeyPresenceValidator = require('ObjectKeyPresenceValidatorTool'); 

/**
 * Ensures that a provided artifact object conforms to expected structural requirements.
 * Throws InvalidArtifactError if validation fails.
 * 
 * @param {object} artifact - The object representing the build or contract artifact.
 * @param {string[]} requiredFields - An array of essential fields that must exist (e.g., ['abi', 'bytecode', 'contractName']).
 * @param {string} artifactName - Identifier for the artifact being validated (for error logging).
 */
function assertArtifactStructure(artifact, requiredFields, artifactName = 'Unknown Artifact') {
    
    const validationResult = KeyPresenceValidator.checkPresence(artifact, requiredFields);

    if (validationResult.isValid) {
        // Hook for deep structural checks (e.g., validating ABI format, verifying checksums)
        return true;
    }

    const details = validationResult.details;
    
    if (details.reason === 'TypeCheckFailed') {
        throw new InvalidArtifactError(
            `Artifact validation failed for ${artifactName}: artifact must be a non-null object.`,
            { details: { receivedType: details.receivedType } }
        );
    }

    if (details.reason === 'MissingFields') {
        throw new InvalidArtifactError(
            `Artifact definition is incomplete for ${artifactName}. Missing required fields: ${details.missingFields.join(', ')}.`, 
            { details: { missingFields: details.missingFields, artifactName } }
        );
    }

    // Generic structural validation failure fallback
    throw new InvalidArtifactError(
        `Artifact validation failed for ${artifactName}: Structural integrity check failed.`,
        { details: { validationDetails: details, artifactName } }
    );
}

module.exports = {
    assertArtifactStructure,
};
