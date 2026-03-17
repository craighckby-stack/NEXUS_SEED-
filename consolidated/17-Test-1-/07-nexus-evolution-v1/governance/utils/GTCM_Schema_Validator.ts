import { validate } from 'ajv';
import GTCM_SCHEMA from '../GTCM_State_Schema.json';

/**
 * Ensures a proposed governance state adheres to the V3.0 schema and safety constraints.
 * Required before promoting a state change to L4 arbitration effectiveness.
 * @param proposedState The new GTCM state object to validate.
 * @returns Validation result object { isValid: boolean, errors: any[] }
 */
export function validateGTCMStateChange(proposedState: any) {
  const ajv = new Ajv({ coerceTypes: true });
  const validate = ajv.compile(GTCM_SCHEMA);
  
  const isValid = validate(proposedState);

  return {
    isValid,
    errors: validate.errors || []
  };
}