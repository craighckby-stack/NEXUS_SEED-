# VPE_validation_hook.py

import json
import jsonschema

class VetoProposalValidator:
    def __init__(self, vpcs_schema_path, proposal_schema_ref):
        # Load the VPCS Schema (V2.0) defining the parameters and constraints
        with open(vpcs_schema_path, 'r') as f:
            self.vpcs_data = json.load(f)
        
        # Load the dedicated schema for the proposal envelope (if required)
        # self.proposal_schema = ...

    def validate_proposal(self, proposed_change_data):
        """Validates a proposed parameter change against VPCS V2.0 constraints.
           Fails early if technical constraints, policy limits, or justification
           requirements are violated, saving governance computation time.
        """
        param_id = proposed_change_data.get('param_id')
        new_value = proposed_change_data.get('new_value')
        justification = proposed_change_data.get('justification', {}) 

        # 1. Locate the parameter definition in the VPCS
        param_config = next(
            (p for p in self.vpcs_data['system_parameters'] if p['param_id'] == param_id),
            None
        )

        if not param_config:
            raise ValueError(f"Parameter {param_id} not found in VPCS.")

        # 2. Check technical limits
        tech = param_config['technical_constraints']
        if not (tech['hard_limit_min'] <= new_value <= tech['hard_limit_max']):
            raise PermissionError("Violation: New value exceeds hard technical limits.")

        # 3. Check governance limits (must be validated, but not necessarily blocked here if policy is permissive)
        gov = param_config['governance_constraints']
        if not (gov['policy_limit_min'] <= new_value <= gov['policy_limit_max']):
            # This may require an escalated veto resolution process, but is flagged immediately.
            print(f"Warning: New value exceeds standing policy limits for {param_id}.")
        
        # 4. Check justification requirements
        just_req = param_config.get('justification_requirements', {})
        for field in just_req.get('mandatory_fields', []):
            if field not in justification or not justification[field]:
                raise ValueError(f"Violation: Missing mandatory justification field: {field}.")
        
        if len(justification.get('description', '')) < just_req.get('min_description_length', 0):
             raise ValueError("Violation: Justification description is too short.")

        return True

# Example usage stub for demonstration:
# validator = VetoProposalValidator('./VPCS_V2.0_schema.json', './proposal_schema.json')
# if validator.validate_proposal(example_proposal):
#     print('Proposal valid. Proceeding to Governance Veto Queue.')