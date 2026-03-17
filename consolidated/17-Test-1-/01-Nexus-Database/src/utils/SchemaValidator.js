import Ajv from 'ajv';
import remediationPlanSchema from '../../spec/schemas/Remediation_Plan_Schema_v1.json'; // Note: Ensure this path correctly loads the v2 definition or register it manually.

const ajv = new Ajv({ allErrors: true, schemas: [remediationPlanSchema] });
const REMEDIATION_SCHEMA_ID = 'https://api.sovereign-agi.com/schemas/Remediation_Plan_Schema_v2.json';

export class SchemaValidator {
    /**
     * General purpose validation method.
     * @param {string} schemaId The $id of the schema to validate against.
     * @param {object} data The object to validate.
     * @returns {boolean} True if data is valid.
     * @throws {Error} If validation fails.
     */
    static validate(schemaId, data) {
        const validateFunction = ajv.getSchema(schemaId);
        
        if (!validateFunction) {
            // Fallback for dynamically loaded schemas
            // For production, all schemas should be pre-compiled/registered for speed.
            throw new Error(`Schema ID not registered: ${schemaId}`);
        }

        const isValid = validateFunction(data);

        if (!isValid) {
            const errors = validateFunction.errors.map(err => 
                `Path: ${err.instancePath || '/'} | Keyword: ${err.keyword} | Message: ${err.message}`
            );
            throw new Error(`Schema validation failed for ${schemaId}: \n${errors.join('\n')}`);
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