import Ajv from 'ajv';
// IMPORTANT AGI-KERNEL OPTIMIZATION: Ensure the imported schema path matches the target version (v2).
import remediationPlanSchema from '../../spec/schemas/Remediation_Plan_Schema_v2.json'; 

// Initialize AJV once upon module load. Using strict mode is recommended for future compatibility.
const ajv = new Ajv({ allErrors: true, schemas: [remediationPlanSchema] });

// Use the $id defined within the schema file for maximum reliability.
const REMEDIATION_SCHEMA_ID = remediationPlanSchema.$id || 'https://api.sovereign-agi.com/schemas/Remediation_Plan_Schema_v2.json';

export class SchemaValidator {
    /**
     * General purpose validation method.
     * @param {string} schemaId The $id of the schema to validate against.
     * @param {object} data The object to validate.
     * @returns {boolean} True if data is valid.
     * @throws {Error} If validation fails.
     */
    static validate(schemaId, data) {
        // Retrieve the pre-compiled validation function
        const validateFunction = ajv.getSchema(schemaId);
        
        if (!validateFunction) {
            throw new Error(`Schema ID not registered: ${schemaId}. Ensure the schema is loaded and its $id matches the requested ID.`);
        }

        const isValid = validateFunction(data);

        if (!isValid) {
            const errors = validateFunction.errors.map(err => {
                const path = err.instancePath || '/';
                return `[${path}] ${err.message} (Keyword: ${err.keyword})`;
            });
            
            throw new Error(`Schema validation failed for ${schemaId} (${validateFunction.errors.length} errors):\n${errors.join('\n')}`);
        }

        return true;
    }

    /**
     * Utility to validate remediation plans, ensuring adherence to standard AGI data structures.
     * @param {object} planData The Remediation Plan object.
     */
    static validateRemediationPlan(planData) {
        return SchemaValidator.validate(REMEDIATION_SCHEMA_ID, planData);
    }
}