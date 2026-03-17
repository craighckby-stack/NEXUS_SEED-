# utilities/RuntimeIntegrityChecker.py

import json
import sys

def load_governance_params(path='config/GOVERNANCE_PARAMS.json'):
    """Loads and validates the governance configuration."""
    try:
        with open(path, 'r') as f:
            params = json.load(f)
    except FileNotFoundError:
        print("ERROR: Governance parameters file not found.", file=sys.stderr)
        sys.exit(1)
    return params

def check_system_compliance(params):
    """
    Verifies if the current environment adheres to safety guardrails
    and initialized control state.
    """
    safety = params.get("SAFETY_GUARDRAILS", {})
    mode = params.get("CORE_CONTROL", {}).get("MODE")

    # Check critical safety context compliance
    if safety.get("EXECUTION_CONTEXT") != "SANDBOXED_COMPUTE_GRID":
        raise EnvironmentError("Governance violation: Execution context is not sufficiently isolated.")

    # Check for valid operational modes
    valid_modes = ["EVOLUTIONARY_AUTONOMY", "MAINTENANCE", "LOCKED_DOWN"]
    if mode not in valid_modes:
        print(f"WARNING: Invalid operational mode detected: {mode}. Forcing system lockdown.", file=sys.stderr)
        params["CORE_CONTROL"]["MODE"] = "LOCKED_DOWN"
        return False

    print(f"Integrity Check Success: Running in {mode} mode (V{params.get('VERSION')}).")
    return True

if __name__ == "__main__":
    params = load_governance_params()
    try:
        check_system_compliance(params)
    except Exception as e:
        print(f"CRITICAL FAILURE during integrity check: {e}", file=sys.stderr)
        sys.exit(2)