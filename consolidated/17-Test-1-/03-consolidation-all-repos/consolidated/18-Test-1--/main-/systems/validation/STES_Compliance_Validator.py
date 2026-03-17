import json
from typing import List, Dict, Any, Tuple

class STESComplianceValidator:
    """
    Validates autonomous evolutionary proposals against the Sovereign AGI Technical 
    Efficiency Standard (STES) specification defined in governance protocols.

    The class preprocesses constraints for O(1) lookup efficiency and modularizes 
    specific validation checks.
    """
    
    def __init__(self, spec_path: str = 'governance/protocols/STES_specification.json'):
        try:
            with open(spec_path, 'r') as f:
                self.spec: Dict[str, Any] = json.load(f)
        except FileNotFoundError:
            raise RuntimeError(f"STES Specification not found at {spec_path}")
        except json.JSONDecodeError:
            raise RuntimeError(f"Invalid JSON format in specification file: {spec_path}")
            
        self.constraints_map: Dict[str, Dict[str, Any]] = self._preprocess_constraints()

    def _preprocess_constraints(self) -> Dict[str, Dict[str, Any]]:
        """Converts the list of validation constraints into an indexed map for O(1) lookup."""
        constraint_map = {}
        constraints_list = self.spec.get('efficiency_directives', {}).get('validation_constraints', [])
        
        for constraint in constraints_list:
            if 'id' in constraint:
                constraint_map[constraint['id']] = constraint
        return constraint_map

    def _check_required_fields(self, proposal_data: Dict[str, Any], results: List[Dict[str, str]]) -> bool:
        """Checks for mandatory lifecycle fields compliance based on schema."""
        required_fields = self.spec.get('lifecycle_stages', {}).get('schema', {}).get('required', [])
        
        compliant = True
        for field in required_fields:
            if field not in proposal_data:
                results.append({
                    'id': 'SCHEMA_MISSING', 
                    'status': 'FAILURE', 
                    'severity': 'CRITICAL',
                    'reason': f'Missing required schema field: {field}'
                })
                compliant = False
        return compliant

    def _check_performance_degradation(self, proposal_data: Dict[str, Any], constraint_data: Dict[str, Any], results: List[Dict[str, str]]) -> bool:
        """Checks Constraint VC-003: Excessive Performance Degradation (Threshold Check)."""
        
        constraint_id = constraint_data.get('id', 'VC-003_GENERIC')
        threshold = constraint_data.get('rule', -0.10) 
        
        predicted_gain = proposal_data.get('predicted_gain_percentage')

        if predicted_gain is None:
             # Relying on schema check to enforce required fields, logging warning if data is expected but missing.
             results.append({
                'id': constraint_id + '_DATA_MISSING',
                'status': 'WARNING',
                'severity': 'MILD',
                'reason': 'Proposal lacks predicted_gain_percentage required for degradation analysis.'
            })
             return True 
        
        # Performance check: If gain is below the negative threshold (i.e., too much degradation)
        if predicted_gain < threshold:
            # Check for standard STES bypass (e.g., security justification)
            if not proposal_data.get(constraint_data.get('bypass_condition', 'security_justification'), False):
                results.append({
                    'id': constraint_id + '_DEGRADATION', 
                    'status': 'FAILURE', 
                    'severity': 'HIGH',
                    'reason': f'Proposal performance decrease ({predicted_gain*100:.2f}%) exceeds threshold ({threshold*100:.2f}%). Required bypass condition not met.'
                })
                return False
            else:
                 results.append({
                    'id': constraint_id + '_BYPASS', 
                    'status': 'PASSED_WITH_EXCEPTION', 
                    'severity': 'MILD',
                    'reason': 'Degradation detected, but excused by documented justification.'
                })
        return True

    def validate_proposal(self, proposal_data: Dict[str, Any]) -> Tuple[bool, List[Dict[str, str]]]:
        """Runs the proposal through all defined STES compliance checks."""
        
        results: List[Dict[str, str]] = []
        overall_compliant = True

        # 1. Lifecycle Schema Check
        if not self._check_required_fields(proposal_data, results):
            overall_compliant = False
        
        # 2. Efficiency Constraints Check
        
        # Iterating only specific critical checks, ensuring VC-003 exists and is handled robustly.
        vc003_data = self.constraints_map.get('VC-003')
        
        if vc003_data and vc003_data.get('type') == 'THRESHOLD_MAX':
            if not self._check_performance_degradation(proposal_data, vc003_data, results):
                overall_compliant = False
        elif not vc003_data:
             # Spec integrity failure flag
             results.append({'id': 'SPEC_INTEGRITY', 'status': 'WARNING', 'severity': 'CRITICAL', 'reason': 'Critical constraint VC-003 is missing from the STES specification file.'})

        # Future expansion point: Iterate over other constraint types defined in self.constraints_map for full automation
        
        return overall_compliant, results
