// Utility to perform cross-reference checks using a reusable tool.

/**
 * @typedef {object} KMSPolicy
 * @property {object} [key_type_definitions]
 * @property {object} [rotation_schedule]
 */

/**
 * validateKMSPolicyIntegrity
 * Checks if rotation schedules reference defined key types.
 * @param {KMSPolicy} policy The key management policy object.
 * @returns {Array<string>} List of errors.
 */
export function validateKMSPolicyIntegrity(policy) {
    // Assuming PolicyCrossReferenceValidator is available in the execution environment
    const PolicyValidator = PolicyCrossReferenceValidator;

    if (!PolicyValidator || typeof PolicyValidator.execute !== 'function') {
        throw new Error("PolicyCrossReferenceValidator tool is not available.");
    }

    const errors = PolicyValidator.execute({
        config: policy,
        definitionPath: 'key_type_definitions',
        referencePath: 'rotation_schedule',
        referenceField: 'key_type',
        errorMessageTemplate: "Rotation schedule '{scheduleName}' references undefined key type: {undefinedId}"
    });

    return errors;
}