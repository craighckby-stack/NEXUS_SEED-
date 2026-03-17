// Utility to perform cross-reference checks not natively supported by JSON Schema Draft 7.

/**
 * validateKMSPolicyIntegrity
 * @param {object} policy The key management policy object.
 * @returns {Array<string>} List of errors.
 */
export function validateKMSPolicyIntegrity(policy) {
    const errors = [];
    const definedKeyTypes = new Set(Object.keys(policy.key_type_definitions || {}));

    if (policy.rotation_schedule) {
        for (const [scheduleName, rotationEntry] of Object.entries(policy.rotation_schedule)) {
            if (rotationEntry.key_type && !definedKeyTypes.has(rotationEntry.key_type)) {
                errors.push(`Rotation schedule '${scheduleName}' references undefined key type: ${rotationEntry.key_type}`);
            }
        }
    }

    return errors;
}
