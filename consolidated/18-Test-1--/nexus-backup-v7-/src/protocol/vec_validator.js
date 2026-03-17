// Requires 'ajv' package or similar JSON Schema validator
import Ajv from 'ajv';
import protocolSchema from './specification/P01_VEC_Protocol.json';

const ajv = new Ajv({ schemas: [protocolSchema] });

// Compile schemas from the definitions section for direct use
const validatePayload = ajv.compile(protocolSchema.definitions.VectorPayload);
const validateResponse = ajv.compile(protocolSchema.definitions.ResponseFrame);

export function isValidPayload(data) {
  const valid = validatePayload(data);
  if (!valid) {
    console.error('Vector Payload Validation Failed:', validatePayload.errors);
  }
  return valid;
}

export function isValidResponse(data) {
  const valid = validateResponse(data);
  if (!valid) {
    console.error('Response Frame Validation Failed:', validateResponse.errors);
  }
  return valid;
}

// Utility function for retrieving required protocol constants
export const VEC_PROTOCOL_ID = protocolSchema.protocol_id;