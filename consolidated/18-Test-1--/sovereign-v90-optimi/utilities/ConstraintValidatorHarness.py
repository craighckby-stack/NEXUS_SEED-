import json
from typing import Dict, Any, Optional, Union, List
from enum import Enum

# Assuming standardized constants for triggers and severities improve intelligence
class TriggerCode(str, Enum):
    TEMPORAL_VIOLATION = "P-M01"
    INTEGRITY_HALT = "P-M02"

class Severity(str, Enum):
    HARD_HALT = "Hard"
    SOFT_WARNING = "Soft"
    COMPLIANT = "None"
    UNCONSTRAINED = "Unconstrained"

# --- System Mock Logger (Awaiting integration with core.Logger) ---
class SystemLogger:
    def info(self, msg: str): print(f"[INFO][ConstraintHarness] {msg}")
    def error(self, msg: str): print(f"[ERROR][ConstraintHarness] {msg}")
    def warn(self, msg: str): print(f"[WARNING][ConstraintHarness] {msg}")

LOG = SystemLogger()

TemporalLimits = Dict[str, int]
GAXSpec = Dict[str, str]

def load_constraints(path: str = 'config/pim_constraints.json') -> Dict[str, Any]:
    """Loads PIM constraint specifications using proper error handling and logging."""
    try:
        with open(path, 'r') as f:
            data = json.load(f)
            LOG.info(f"Successfully loaded constraints from {path}.")
            return data
    except FileNotFoundError:
        LOG.error(f"FATAL: Constraint file not found at {path}. Harness operating in passive mode.")
        return {}
    except json.JSONDecodeError:
        LOG.error(f"FATAL: Invalid JSON structure in {path}. Check file integrity.")
        return {}

class ConstraintValidatorHarness:
    """
    Sovereign AGI Constraint Validator Harness (v94.1)
    Provides pre-flight data-driven validation for temporal and integrity constraints.
    Initializes constraints or defaults to a safe, passive (unconstrained) mode upon failure.
    """
    def __init__(self, constraint_path: str = 'config/pim_constraints.json', initial_constraints: Optional[Dict[str, Any]] = None):
        
        if initial_constraints:
            self.constraints = initial_constraints
        else:
            self.constraints = load_constraints(constraint_path)

        # Structure decomposition for faster lookup
        self.p_set_rules: List[Any] = self.constraints.get('P_SET_Rules', [])
        self.gax_limits: Dict[str, GAXSpec] = self.constraints.get('GAX_Limits', {})
        self.temporal_limits: Dict[str, TemporalLimits] = self.constraints.get('Temporal_Limits', {})
        
        if not self.constraints:
            LOG.warn("Harness initialized in passive (unconstrained) mode. All validation checks will default to success/no-violation.")
        else:
            LOG.info(f"Harness Active. Loaded {len(self.p_set_rules)} P-Set rules and {len(self.temporal_limits)} temporal definitions.")

    def _get_temporal_limits(self, stage_name: str) -> Optional[TemporalLimits]:
        """Retrieves soft and hard limits for a specific stage from constraints, enforcing structural integrity."""
        limits = self.temporal_limits.get(stage_name)
        
        required_keys = ['soft_limit_ms', 'hard_limit_ms']
        
        if limits and all(k in limits for k in required_keys):
            # Ensure they are integers, failing noisily if not (high intelligence requirement)
            if not all(isinstance(limits[k], int) for k in required_keys):
                LOG.error(f"Malformed temporal data: Limits for {stage_name} must be integers.")
                return None
            return limits
            
        LOG.warn(f"Temporal constraints missing or malformed for stage: {stage_name}. Skipping validation.")
        return None
    
    def run_gax_check(self, axiom_id: str, verifiable_artifact_hash: str) -> Dict[str, Union[str, bool, None]]:
        """
        P-M02 / GAX Check: Validates the integrity hash of a verifiable artifact 
        against the expected hash defined in the constraint structure.
        """
        check_spec = self.gax_limits.get(axiom_id)
        
        if not check_spec:
            return {"success": True, "trigger": None, "message": f"GAX check '{axiom_id}' is unconstrained. Proceeding."}
        
        expected_hash = check_spec.get('expected_hash')
        trigger_code = check_spec.get('trigger', TriggerCode.INTEGRITY_HALT.value)

        if verifiable_artifact_hash != expected_hash:
            LOG.error(f"INTEGRITY VIOLATION [{trigger_code}]: Artifact '{axiom_id}' hash mismatch detected.")
            return {
                "success": False, 
                "trigger": trigger_code, 
                "message": f"Integrity Halt requested. Expected hash: '{expected_hash}'."
            }
        
        return {"success": True, "trigger": None, "message": f"Artifact '{axiom_id}' integrity validation successful."}

    def evaluate_temporal_violation(self, stage_name: str, duration_ms: int) -> Dict[str, Union[str, None]]:
        """Evaluates P-M01 linearity violation based on dynamic limits retrieved by stage_name."""
        limits = self._get_temporal_limits(stage_name)

        if not limits:
            return {"stage": stage_name, "trigger": None, "severity": Severity.UNCONSTRAINED.value, "action": "Compliant by Default"}

        soft_limit_ms = limits['soft_limit_ms']
        hard_limit_ms = limits['hard_limit_ms']

        if duration_ms > hard_limit_ms:
            LOG.warn(f"[{TriggerCode.TEMPORAL_VIOLATION.value}][{Severity.HARD_HALT.value}] {stage_name} exceeded hard limit ({hard_limit_ms}ms).")
            return {
                "stage": stage_name, 
                "trigger": TriggerCode.TEMPORAL_VIOLATION.value, 
                "severity": Severity.HARD_HALT.value, 
                "action": "Integrity Halt (IH)"
            }
        elif duration_ms > soft_limit_ms:
            LOG.info(f"[{TriggerCode.TEMPORAL_VIOLATION.value}][{Severity.SOFT_WARNING.value}] {stage_name} exceeded soft limit ({soft_limit_ms}ms).")
            return {
                "stage": stage_name, 
                "trigger": TriggerCode.TEMPORAL_VIOLATION.value, 
                "severity": Severity.SOFT_WARNING.value, 
                "action": "Log & Proceed"
            }
        
        return {
            "stage": stage_name, 
            "trigger": None, 
            "severity": Severity.COMPLIANT.value, 
            "action": "Compliant"
        }

if __name__ == "__main__":
    
    # NOTE: This test requires config/pim_constraints.json to be present with the required keys.
    try:
        harness = ConstraintValidatorHarness()
        
        # 1. Test Temporal Constraint (P-M01) - Hard Violation Scenario (Limit is 1000ms hard)
        temporal_result = harness.evaluate_temporal_violation("S05/DHC Block", 1500)
        print(f"\n[1] Temporal Hard Violation (1500ms): {temporal_result}")
        
        # 2. Test Temporal Constraint (P-M01) - Soft Violation Scenario (Limit is 500ms soft)
        temporal_result_soft = harness.evaluate_temporal_violation("S05/DHC Block", 750)
        print(f"[2] Temporal Soft Violation (750ms): {temporal_result_soft}")

        # 3. Test Critical Fault (P-M02 / GAX I) - Mismatch
        critical_result = harness.run_gax_check("GAX I", "FEE9988D44E_INCORRECT")
        print(f"[3] GAX I Critical Mismatch Test: {critical_result}")
        
        # 4. Test Critical Fault (GAX I) - Match (Expected: 1a2b3c4d5e)
        match_result = harness.run_gax_check("GAX I", "1a2b3c4d5e")
        print(f"[4] GAX I Critical Match Test: {match_result}")
        
    except Exception as e:
        # Catches file not found if the scaffolded file hasn't been created yet
        print(f"\nFATAL HARNESS TEST ERROR: Ensure 'config/pim_constraints.json' is correctly configured. Error: {e}")