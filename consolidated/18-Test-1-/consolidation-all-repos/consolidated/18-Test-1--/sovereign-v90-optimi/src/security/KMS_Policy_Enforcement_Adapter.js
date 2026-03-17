// KMS_Policy_Enforcement_Adapter.js

declare const PolicyRuleMatcherTool: {
    execute: (args: { rules: string[], target: string, matchType: 'inclusion' | 'equality' }) => boolean;
};
declare const ContextKeyExistenceValidator: {
    execute: (args: { requirements: Record<string, any>, context: Record<string, any> }) => { valid: boolean, missingKey?: string, error?: string };
};

const mappingConfig = require('../../config/KMS_Identity_Mapping.json');

interface IdentityPolicy {
    allowed_operations: string[];
    required_encryption_context: Record<string, any>;
    key_alias?: string;
    key_arn?: string;
}

/**
 * Runtime enforcement layer for KMS identity mappings.
 * Ensures that KMS operations (Encrypt/Decrypt) comply with required encryption context 
 * and allowed operations defined in config/KMS_Identity_Mapping.json.
 */
class KMSPolicyEnforcementAdapter {
    
    private identity: IdentityPolicy;
    private identityName: string;

    constructor(identityName: string) {
        const identityData: IdentityPolicy = mappingConfig.identities[identityName];

        if (!identityData) {
            throw new Error(`Identity '${identityName}' not found in KMS mapping.`);
        }
        this.identity = identityData;
        this.identityName = identityName;
    }

    validateRequest(operationType: string, encryptionContext: Record<string, any> = {}): boolean {
        // 1. Validate Operation Permissions using PolicyRuleMatcherTool
        const isOperationAllowed = PolicyRuleMatcherTool.execute({
            rules: this.identity.allowed_operations,
            target: operationType,
            matchType: 'inclusion'
        });

        if (!isOperationAllowed) {
            throw new Error(`KMS operation '${operationType}' is denied for identity '${this.identityName}'.`);
        }

        // 2. Validate Required Encryption Context using ContextKeyExistenceValidator
        const contextValidationResult = ContextKeyExistenceValidator.execute({
            requirements: this.identity.required_encryption_context,
            context: encryptionContext
        });
        
        if (!contextValidationResult.valid) {
            if (contextValidationResult.missingKey) {
                throw new Error(`KMS operation missing required encryption context key: ${contextValidationResult.missingKey}`);
            }
            throw new Error(`Context validation failed.`);
        }

        // Additional checks (e.g., verifying key expiry/rotation status)
        // ...

        return true;
    }

    getKeyAlias(): string | undefined {
        return this.identity.key_alias || this.identity.key_arn;
    }
}

module.exports = KMSPolicyEnforcementAdapter;