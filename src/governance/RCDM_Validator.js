import RCDMConfig from './RCDM.json';
import { SchemaValidator } from '../utility/SchemaValidator.js';

/**
 * Ensures the RCDM governance configuration adheres to the defined operational safety schema.
 * Failure to validate results in immediate system halt or reversion to failsafe.
 */
export function validateRCDM(config = RCDMConfig) {
  // NOTE: Assuming synchronous require() is acceptable for local JSON schema files in this environment.
  const governanceSchema = require('./schemas/rcdm-v94.1.json');
  const validator = SchemaValidator.getInstance();

  if (!validator.validate(governanceSchema, config)) {
    console.error("RCDM Configuration Validation Failed:", validator.errors);
    // CRITICAL: Cannot safely initialize governance system with faulty parameters.
    throw new Error("RCDM Integrity Check Failure");
  }

  console.log("RCDM Configuration Validated successfully. Governance systems initializing.");
  return true;
}