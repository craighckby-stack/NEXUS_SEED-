// utilities/policy/ACVDSchema.js

/**
 * Defines the static schema and validation routines for the 
 * Axiomatic Constraint Vector Definition (ACVD).
 * Ensures structural integrity of policy configurations across versions.
 */
class ACVDSchema {

    /**
     * Defines the mandatory structural skeleton for any ACVD object.
     */
    static #MANDATORY_FIELDS = {
        metadata: ['version', 'creationDate', 'source', 'signature'],
        parameters: ['UFRM', 'CFTM']
    };
    
    /**
     * Strict structural validation for a given ACVD candidate object.
     * @param {Object} candidateACVD - The policy object to validate.
     * @param {boolean} [isDefault=false] - If true, signature check is lenient (for system defaults).
     * @throws {Error} if validation fails.
     */
    static validateStructure(candidateACVD, isDefault = false) {
        if (typeof candidateACVD !== 'object' || candidateACVD === null) {
            throw new Error("Schema Validation Failed: ACVD must be a non-null object.");
        }

        // 1. Validate required sections and fields
        for (const section of Object.keys(ACVDSchema.#MANDATORY_FIELDS)) {
            if (!candidateACVD[section] || typeof candidateACVD[section] !== 'object') {
                throw new Error(`Schema Validation Failed: Missing or invalid required section: ${section}.`);
            }

            for (const field of ACVDSchema.#MANDATORY_FIELDS[section]) {
                if (!(field in candidateACVD[section])) {
                    throw new Error(`Schema Validation Failed: Missing mandatory field in ${section}: ${field}.`);
                }
            }
        }

        // 2. Type Validation (Essential Checks)
        if (typeof candidateACVD.metadata.version !== 'number' || candidateACVD.metadata.version < 0) {
            throw new Error("Schema Validation Failed: metadata.version must be a non-negative number.");
        }
        if (typeof candidateACVD.parameters.UFRM !== 'number' || typeof candidateACVD.parameters.CFTM !== 'number') {
            throw new Error("Schema Validation Failed: UFRM and CFTM must be numeric parameters.");
        }

        // 3. Integrity Check (Mandatory Governance Signature Check)
        const signature = candidateACVD.metadata.signature;
        if (!isDefault && (!signature || signature === 'NONE_GOVERNANCE_BYPASS')) {
             throw new Error("Schema Validation Failed: Policy must contain a verifiable governance signature.");
        }
        
        return true;
    }
}

module.exports = ACVDSchema;