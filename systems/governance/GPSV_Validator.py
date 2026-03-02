# systems/governance/GPSV_Validator.py

import json
import os
from typing import Dict, Any, List
from systems.core.RACM import RiskAssessmentComponentManager


class GovernanceParameterSecurityValidator:
    """
    GPSV (Governance Parameter Security Validator):
    Acts as an intermediary integrity gate for updates proposed to the 
    Schema and Configuration Registry (SCR) constraints. Ensures that 
    proposed dynamic thresholds (e.g., S-01 Trust Minimum, S-02 Risk Ceiling) 
    do not compromise the integrity rules mandated by the AOC.

    Refactoring Note: Configuration is now cached on initialization for efficiency.
    Validation output is structured (Dict) rather than a simple boolean.
    """

    def __init__(self, racm: RiskAssessmentComponentManager, system_boundary_contract, 
                 failure_model_path: str = "config/governance/failure_modes.json"):
        self.racm = racm
        self.sbc = system_boundary_contract
        self.FAILURE_MODEL_PATH = failure_model_path
        
        # Load failure modes once at initialization (increased efficiency)
        self._failure_modes_cache = self._load_failure_modes()

    def _load_failure_modes(self) -> Dict[str, Any]:
        """Loads critical security metrics and governance parameter ranges from disk."""
        if not os.path.exists(self.FAILURE_MODEL_PATH):
             raise RuntimeError(
                f"CRITICAL: Governance failure modes configuration missing at {self.FAILURE_MODEL_PATH}. "
                "(See proposed scaffolding for config structure.)"
            )
        try:
            with open(self.FAILURE_MODEL_PATH, 'r') as f:
                return json.load(f)
        except json.JSONDecodeError:
            raise RuntimeError("CRITICAL: Governance failure modes configuration file is malformed JSON.")

    def _check_boundary_compliance(self, proposed_scr_updates: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Checks if updates violate defined mandatory limits (Floor/Ceiling)."""
        failures = []
        mandatory_limits = self._failure_modes_cache.get('mandatory_limits', {})
        
        for param, proposed_value in proposed_scr_updates.items():
            if param in mandatory_limits:
                limits = mandatory_limits[param]
                
                # Check minimum bound (Trust floors)
                if 'min' in limits and proposed_value < limits['min']:
                    failures.append({
                        "param": param,
                        "type": "HARD_BOUND_VIOLATION",
                        "reason": f"Value {proposed_value} is below AOC hard minimum {limits['min']}.",
                        "veto_status": True
                    })

                # Check maximum bound (Risk/Expense ceilings)
                elif 'max' in limits and proposed_value > limits['max']:
                    failures.append({
                        "param": param,
                        "type": "HARD_BOUND_VIOLATION",
                        "reason": f"Value {proposed_value} exceeds AOC hard maximum {limits['max']}.",
                        "veto_status": True
                    })
        return failures

    def validate_proposed_parameters(self, proposed_scr_updates: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validates proposed SCR updates against governance mandates.
        Returns a structured validation report detailing status and reasons.
        """
        validation_report = {"status": "SUCCESS", "veto": False, "details": []}
        
        # 1. Mandatory Threshold Compliance (Hard Veto Checks)
        boundary_failures = self._check_boundary_compliance(proposed_scr_updates)
        if boundary_failures:
            validation_report['status'] = "VETOED_BOUNDARY_VIOLATION"
            validation_report['veto'] = True
            validation_report['details'].extend(boundary_failures)
            # Immediate return on hard veto
            return validation_report 

        # 2. Differential Risk Simulation
        sim_result = self.racm.simulate_risk_impact(proposed_scr_updates)
        max_tolerable = self._failure_modes_cache.get('max_tolerable_risk_increase', 0.0)
        
        if sim_result['risk_delta'] > max_tolerable:
            validation_report['status'] = "VETOED_RISK_INCREASE"
            validation_report['veto'] = True
            validation_report['details'].append({
                "param": "SYSTEM_RISK_DELTA",
                "type": "SIMULATION_FAILURE",
                "reason": f"Simulated risk increase ({sim_result['risk_delta']:.4f}) exceeds tolerable limit ({max_tolerable:.4f}).",
                "sim_details": sim_result
            })
        
        if validation_report['veto']:
            print(f"GPSV Veto Issued: {validation_report['status']}")
        
        return validation_report
