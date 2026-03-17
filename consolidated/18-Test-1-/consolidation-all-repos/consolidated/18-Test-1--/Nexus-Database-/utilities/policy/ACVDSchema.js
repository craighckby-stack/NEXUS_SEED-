// utilities/policy/ACVDSchema.js

/**
 * Defines the static schema and validation routines for the 
 * Axiomatic Constraint Vector Definition (ACVD).
 * Ensures structural and type integrity of policy configurations across versions.
 */
class ACVDSchema {

    /**
     * Defines the strict, declarative schema for the ACVD structure,
     * including mandatory fields, their expected types, and basic constraints.
     */
    static #SCHEMA_DEFINITION = {
        metadata: {
            type: 'object',
            fields: {
                version: { type: 'number', constraints: (v) => v >= 0 },
                creationDate: { type: 'string' }, 
                source: { type: 'string' },
                signature: { type: 'string' }
            }
        },
        parameters: {
            type: 'object',
            fields: {
                UFRM: { type: 'number', constraints: (v) => v > 0 }, // Unitary Functional Risk Metric
                CFTM: { type: 'number', constraints: (v) => v > 0 }  // Core Functional Trust Metric
            }
        }
    };

    /**
     * Helper to validate a specific field against its type and constraints.
     * @param {string} path - The dotted path of the field (e.g., 'metadata.version').
     * @param {*} value - The value to check.
     * @param {Object} definition - The field definition from the schema.
     */
    static #validateField(path, value, definition) {
        if (typeof value !== definition.type) {
            throw new Error(`ACVD Validation Failed [Type]: Field '${path}' must be type '${definition.type}', received '${typeof value}'.`);
        }
        
        if (definition.constraints && !definition.constraints(value)) {
             throw new Error(`ACVD Validation Failed [Constraint]: Field '${path}' value violates defined constraints.`);
        }
    }


    /**
     * Strict structural and type validation for a given ACVD candidate object.
     * @param {Object} candidateACVD - The policy object to validate.
     * @param {boolean} [isDefault=false] - If true, signature check is lenient (for system defaults).
     * @throws {Error} if validation fails.
     */
    static validateStructure(candidateACVD, isDefault = false) {
        if (typeof candidateACVD !== 'object' || candidateACVD === null || Array.isArray(candidateACVD)) {
            throw new Error("ACVD Schema Validation Failed: ACVD must be a non-null object.");
        }

        const schema = ACVDSchema.#SCHEMA_DEFINITION;

        // 1. Traverse and Validate Sections/Fields based on Schema Definition
        for (const [sectionName, sectionDef] of Object.entries(schema)) {
            const section = candidateACVD[sectionName];

            if (!section || typeof section !== sectionDef.type) {
                throw new Error(`ACVD Validation Failed: Missing or invalid required section: ${sectionName}. Expected type '${sectionDef.type}'.`);
            }
            
            // Validate fields within the section
            for (const [fieldName, fieldDef] of Object.entries(sectionDef.fields)) {
                const fullPath = `${sectionName}.${fieldName}`;
                
                if (!(fieldName in section)) {
                    throw new Error(`ACVD Validation Failed: Missing mandatory field: ${fullPath}.`);
                }
                
                ACVDSchema.#validateField(fullPath, section[fieldName], fieldDef);
            }
        }

        // 2. Policy/Integrity Check (Mandatory Governance Signature Check)
        const signature = candidateACVD.metadata.signature;
        if (!isDefault && (!signature || signature === '' || signature === 'NONE_GOVERNANCE_BYPASS')) {
             // Added check for empty string signature and explicit bypass value
             throw new Error("ACVD Validation Failed [Policy Integrity]: Policy must contain a verifiable governance signature.");
        }
        
        return true;
    }
}

module.exports = ACVDSchema;
