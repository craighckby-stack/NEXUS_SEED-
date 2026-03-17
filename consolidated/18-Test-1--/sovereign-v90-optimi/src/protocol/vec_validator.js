// Requires 'ajv' package or similar JSON Schema validator
import Ajv from 'ajv';
import protocolSchema from './specification/P01_VEC_Protocol.json';

// Initialize AJV instance, configured to understand the primary schema.
const ajv = new Ajv({ schemas: [protocolSchema] });

// --- ProtocolDefinitionValidator Tool Initialization ---
// This section initializes the logic defined in the extracted plugin.

const ProtocolDefinitionValidatorTool = (function() {
    const schema = protocolSchema;
    const compiledValidators = {};

    // Compile validators for all top-level definitions in the schema
    if (schema.definitions) {
        for (const defName in schema.definitions) {
            if (Object.prototype.hasOwnProperty.call(schema.definitions, defName)) {
                const definition = schema.definitions[defName];
                try {
                    // Use the external Ajv import for compilation
                    compiledValidators[defName] = ajv.compile(definition);
                } catch (e) {
                    console.error(`[PDV] Error compiling schema definition ${defName}:`, e);
                    compiledValidators[defName] = function(data) { 
                        compiledValidators[defName].errors = [{ keyword: 'compilation', message: `Failed to compile definition: ${defName}` }];
                        return false; 
                    }; 
                }
            }
        }
    }

    const validateDefinition = function(data, definitionName) {
        const validator = compiledValidators[definitionName];

        if (!validator) {
            return { 
                valid: false, 
                errors: [{ keyword: 'missing', message: `Validator for definition '${definitionName}' not found.` }] 
            };
        }

        const valid = validator(data);
        
        return { 
            valid: valid, 
            errors: validator.errors || null 
        };
    };

    return {
        validateDefinition: validateDefinition,
        getProtocolId: function() {
            return schema.protocol_id;
        }
    };
})();
// --- End Tool Initialization ---

/**
 * Validates if the data conforms to the VectorPayload definition.
 * @param {any} data 
 * @returns {boolean}
 */
export function isValidPayload(data) {
  const result = ProtocolDefinitionValidatorTool.validateDefinition(data, 'VectorPayload');
  if (!result.valid) {
    console.error('Vector Payload Validation Failed:', result.errors);
  }
  return result.valid;
}

/**
 * Validates if the data conforms to the ResponseFrame definition.
 * @param {any} data 
 * @returns {boolean}
 */
export function isValidResponse(data) {
  const result = ProtocolDefinitionValidatorTool.validateDefinition(data, 'ResponseFrame');
  if (!result.valid) {
    console.error('Response Frame Validation Failed:', result.errors);
  }
  return result.valid;
}

// Utility function for retrieving required protocol constants
export const VEC_PROTOCOL_ID = ProtocolDefinitionValidatorTool.getProtocolId();