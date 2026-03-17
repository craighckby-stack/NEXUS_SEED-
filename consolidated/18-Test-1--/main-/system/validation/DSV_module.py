# system/validation/DSV_module.py: Differential State Validation Module
# Owner: SGS Agent (Collaboration with GAX constraints)

from typing import Dict, Any, Tuple, List
from system.utility.deep_diff_utility import calculate_strict_diff # Proposed utility import

# Type aliases for enhanced clarity and modularity
Differential = Dict[str, Any]
State = Dict[str, Any]
Constraints = Dict[str, Any]

class DSV_Module:
    """
    Manages Differential State Validation (DSV).
    Calculates the strict state differential (Delta Psi) and verifies it 
    against Autonomous Constraint Validation Document (ACVD) rules (P2 constraints).
    """
    def __init__(self, acvd_document: Constraints):
        # The ACVD dictates read/write/access limits (P2 constraints)
        self.acvd: Constraints = acvd_document

    def validate_state_change(self, current_state: State, proposed_state: State) -> Tuple[Differential, bool, List[str]]:
        """
        Generates the differential state (Delta Psi) and verifies adherence to ACVD constraints.
        
        Returns:
            Tuple[Differential, bool, List[str]]: 
            (delta_psi, integrity_status, validation_errors)
        """
        
        # 1. Calculate Delta Psi (State Differential Artifact)
        try:
            # Leverage the specialized utility for robustness
            delta_psi: Differential = calculate_strict_diff(current_state, proposed_state)
        except Exception as e:
            return {}, False, [f"Critical Error: Diff calculation failed: {e}"]
        
        if not delta_psi:
            # Trivial success case: No change detected, thus no constraints violated.
            return {}, True, ["State unchanged."]

        # 2. Vetting against ACVD P2 constraints
        validation_errors: List[str] = self._check_constraints(delta_psi)
        
        integrity_status = not bool(validation_errors)

        # Return validated diff, integrity status, and any specific errors
        return delta_psi, integrity_status, validation_errors

    # Removed _calculate_diff stub, replacing it with an import/call to external utility

    def _check_constraints(self, delta_psi: Differential) -> List[str]:
        """
        Ensures no prohibited keys or constrained values are modified according to ACVD.
        Violations prevent potential MPAM flag (P4: Modification Privilege Assessment).

        Returns: List of error strings if constraints are violated.
        """
        errors = []
        
        # ACVD structures for validation (e.g., restricted fields, immutables)
        protected_fields = self.acvd.get("protected_fields", [])
        
        for key, diff_data in delta_psi.items():
            if key in protected_fields:
                # This checks for modification attempt on a key that requires higher privilege
                errors.append(f"P2 Constraint Violation: Attempted modification of protected key '{key}'.")
                
        return errors
