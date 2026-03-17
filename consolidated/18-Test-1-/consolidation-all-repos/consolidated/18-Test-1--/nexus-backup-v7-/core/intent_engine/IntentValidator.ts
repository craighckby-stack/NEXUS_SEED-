import Ajv from 'ajv';
import intentSchema from '../../governance/m01_intent_schema_v1.json'; // Note: Must update path if file name changes

const ajv = new Ajv({
  schemas: [intentSchema]
});

interface IntentPayload {
  intent_id: string;
  version: '2.0.0';
  type: string;
  goal: string;
  priority: string;
  status: string;
  timestamp_created: string;
  // ... other properties ...
}

/**
 * Validates an incoming Intent object against the V2 governance schema.
 * @param intent The raw intent object.
 * @returns True if valid, throws an error with details if invalid.
 */
export function validateIntent(intent: any): intent is IntentPayload {
  const validate = ajv.getSchema('https://agi.sovereign/schemas/intent/v2');
  if (!validate) {
    throw new Error("Intent schema V2 not loaded into Ajv.");
  }
  const valid = validate(intent);
  if (!valid) {
    console.error("Intent Validation Errors:", validate.errors);
    throw new Error(`Intent validation failed: ${JSON.stringify(validate.errors)}`);
  }
  return true;
}