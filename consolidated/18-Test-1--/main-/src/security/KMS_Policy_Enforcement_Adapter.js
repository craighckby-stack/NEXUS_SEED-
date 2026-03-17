// KMS_Policy_Enforcement_Adapter.js

const mappingConfig = require('../../config/KMS_Identity_Mapping.json');

/**
 * Runtime enforcement layer for KMS identity mappings.
 * Ensures that KMS operations (Encrypt/Decrypt) comply with required encryption context 
 * and allowed operations defined in config/KMS_Identity_Mapping.json.
 */
class KMSPolicyEnforcementAdapter {
    
    constructor(identityName) {
        if (!mappingConfig.identities[identityName]) {
            throw new Error(`Identity '${identityName}' not found in KMS mapping.`);
        }
        this.identity = mappingConfig.identities[identityName];
        this.identityName = identityName;
    }

    validateRequest(operationType, encryptionContext = {}) {
        // 1. Validate Operation Permissions
        if (!this.identity.allowed_operations.includes(operationType)) {
            throw new Error(`KMS operation '${operationType}' is denied for identity '${this.identityName}'.`);
        }

        // 2. Validate Required Encryption Context
        const requiredKeys = Object.keys(this.identity.required_encryption_context);
        for (const key of requiredKeys) {
            if (!encryptionContext.hasOwnProperty(key)) {
                throw new Error(`KMS operation missing required encryption context key: ${key}`);
            }
        }

        // Additional checks (e.g., verifying key expiry/rotation status)
        // ...

        return true;
    }

    getKeyAlias() {
        return this.identity.key_alias || this.identity.key_arn;
    }
}

module.exports = KMSPolicyEnforcementAdapter;