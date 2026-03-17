const { InvalidArtifactError } = require('../errors/InvalidArtifactError');

/**
 * Ensures that a provided artifact object conforms to expected structural requirements.
 * Throws InvalidArtifactError if validation fails.
 * 
 * @param {object} artifact - The object representing the build or contract artifact.
 * @param {string[]} requiredFields - An array of essential fields that must exist (e.g., ['abi', 'bytecode', 'contractName']).
 * @param {string} artifactName - Identifier for the artifact being validated (for error logging).
 */
function assertArtifactStructure(artifact, requiredFields, artifactName = 'Unknown Artifact') {
    if (typeof artifact !== 'object' || artifact === null) {
        throw new InvalidArtifactError(
            `Artifact validation failed for ${artifactName}: artifact must be a non-null object.`, 
            { details: { receivedType: typeof artifact } }
        );
    }

    const missing = requiredFields.filter(field => !Object.prototype.hasOwnProperty.call(artifact, field));
    
    if (missing.length > 0) {
        throw new InvalidArtifactError(
            `Artifact definition is incomplete for ${artifactName}. Missing required fields: ${missing.join(', ')}.`, 
            { details: { missingFields: missing, artifactName } }
        );
    }
    
    // Hook for deep structural checks (e.g., validating ABI format, verifying checksums)
    
    return true; 
}

module.exports = {
    assertArtifactStructure,
};
