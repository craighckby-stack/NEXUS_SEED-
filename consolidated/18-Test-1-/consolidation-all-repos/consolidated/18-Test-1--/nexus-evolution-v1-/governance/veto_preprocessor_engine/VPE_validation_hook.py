// VPE_validation_hook.js
import { json } from 'json5';

class VetoProposalValidator {
  # vpcs_schema;
  # propose_schema_path;

  constructor(vpcs_schema_path, propose_schema_ref) {
    this.#vpcs_schema = json.readFileSync(vpcs_schema_path, 'utf8');
    this.#propose_schema_path = propose_schema_ref;
    if (this.#propose_schema_path) this.#validate_schema(this.#propose_schema_path);
  }

  async #validate_schema(schema_path) {
    const schema = json.readFileSync(schema_path, 'utf8');
    try {
      await new Promise((resolve, reject) => {
        jsonschema.validate(schema, this.#vpcs_schema, (err, result) => (err ? reject(err) : resolve(result)));
      });
    } catch (error) {
      if (error.code === 'R6022') throw new Error('Invalid proposal schema');
      throw error;
    }
  }

  validate_proposal(proposed_change_data) {
    const param_id = proposed_change_data.get('param_id');
    const new_value = proposed_change_data.get('new_value');
    const justification = proposed_change_data.get('justification', {});

    const param_config = this.#vpcs_schema.system_parameters.find((p) => p.param_id === param_id);

    if (!param_config) {
      throw new Error(`Parameter ${param_id} not found in VPCS.`);
    }

    const tech = param_config.technical_constraints;
    if (!(tech.hard_limit_min <= new_value && new_value <= tech.hard_limit_max)) {
      throw new PermissionError(`Violation: New value exceeds hard technical limits.`);
    }

    const gov = param_config.governance_constraints;
    if (!(gov.policy_limit_min <= new_value && new_value <= gov.policy_limit_max)) {
      console.warn(`Warning: New value exceeds standing policy limits for ${param_id}.`);
    }

    const just_req = param_config.justification_requirements;
    if (just_req) {
      for (const field of just_req.mandatory_fields || []) {
        if (!(field in justification && justification[field])) {
          throw new Error(`Violation: Missing mandatory justification field: ${field}.`);
        }
      }
    }

    if (just_req && just_req.min_description_length && !justification.description || justification.description.length < just_req.min_description_length) {
      throw new Error('Violation: Justification description is too short.');
    }

    return true;
  }
}

try {
  new VetoProposalValidator('VPCS_V2.0_schema.json', 'proposal_schema.json').validate_proposal({
    param_id: 'example_param',
    new_value: 1,
    justification: { description: 'Example justification' },
  });
} catch (error) {
  console.error('Validation failed:', error.message);
}

class PermissionError extends Error {}
class VetoProposalValidatorError extends Error {}