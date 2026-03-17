import json
import logging
from typing import Dict, Any

# Assuming system/governance is a package structure, use relative import
from .policy_constants import DEFAULT_ACVD_PATH, ACVDKeys 

# Configure a standardized logger for the Policy Constraint Server
logger = logging.getLogger('PCS_Server')

# --- Custom Exceptions for PCS ---
class PCSBaseError(Exception):
    """Base class for Policy Constraint Server exceptions.
    Encapsulates all errors originating from the policy loading/serving mechanism.
    """
    pass

class ConfigurationError(PCSBaseError):
    """Raised for structural integrity breaches (missing files, invalid JSON, structure)."""
    pass

class PolicyIntegrityError(PCSBaseError):
    """Raised when policy definitions violate contractual constraints (e.g., wrong type for threshold)."""
    pass
# ---------------------------------

class PolicyConstraintServer:
    """ 
    Policy and Constraint Server (PCS). 
    Responsible for reading, validating, and serving the definitive
    Axiomatic Constraint Vetting Document (ACVD) to governance agents.
    Acts as the Single Source of Policy Truth (SCoT), utilizing structured logging
    and robust custom exception handling.
    """

    def __init__(self, acvd_path: str = DEFAULT_ACVD_PATH):
        # Use ACVDKeys alias for explicit access, though static class method would also work.
        self.ACVD_KEYS = ACVDKeys
        self.acvd_path = acvd_path
        
        # Load constraints immediately and fail fast on configuration errors
        self.constraints: Dict[str, Any] = self._load_and_validate_acvd()
        
        version = self.constraints.get(self.ACVD_KEYS.VERSION, 'N/A')
        logger.info(f"ACVD v{version} successfully loaded and validated from {self.acvd_path}.")

    def _load_acvd_file(self) -> Dict[str, Any]:
        """ Handles file I/O and JSON parsing errors, ensuring immediate failure if core policy cannot be loaded."""
        try:
            with open(self.acvd_path, 'r') as f:
                data = json.load(f)
                if not isinstance(data, dict):
                    raise ValueError("ACVD root must be a JSON object.")
                return data
        except FileNotFoundError: 
            msg = f"Fatal Error: ACVD file not found at {self.acvd_path}. Cannot guarantee axiomatic compliance."
            logger.critical(msg)
            raise ConfigurationError(f"[PCS] {msg}")
        except json.JSONDecodeError as e:
            msg = f"ACVD structural JSON integrity breach near line {e.lineno}. Policy data corrupted."
            logger.critical(msg)
            raise ConfigurationError(f"[PCS] {msg}")
        except ValueError as e:
            # Catches the non-dict root type check
            msg = f"ACVD structural root failure: {str(e)}"
            logger.critical(msg)
            raise ConfigurationError(f"[PCS] {msg}")

    def _validate_structure(self, data: Dict[str, Any]):
        """ Ensures all critical ACVDKeys are present."""
        missing_keys = [key for key in self.ACVD_KEYS.REQUIRED_KEYS if key not in data]
        if missing_keys:
            msg = f"ACVD Structure Invalid: Missing essential governance keys: {', '.join(missing_keys)}. Halting."
            logger.critical(msg)
            raise ConfigurationError(f"[PCS] {msg}")

    def _load_and_validate_acvd(self) -> Dict[str, Any]:
        """ Orchestrates loading and validation steps. """
        data = self._load_acvd_file()
        self._validate_structure(data)
        return data

    def get_utility_threshold(self, metric_key: str) -> float:
        """ Retrieves a specific utility threshold for TEMM validation (Axiom I), performing type enforcement. """
        thresholds = self.constraints.get(self.ACVD_KEYS.UTILITY_THRESHOLDS, {}) 
        
        if metric_key not in thresholds:
             logger.warning(f"Policy Gap: Threshold for '{metric_key}' not explicitly defined in ACVD.")
             # Use standard KeyError for definition absence
             raise KeyError(f"[PCS Policy Definition Error] Threshold for {metric_key} not defined.")
        
        value = thresholds[metric_key]
        
        try:
            # Enforce policy requirement: All thresholds must be float castable
            return float(value)
        except (ValueError, TypeError):
            msg = f"Data Type Integrity Failure: Threshold '{metric_key}'='{value}' is non-numeric, violating policy contract."
            logger.error(msg)
            raise PolicyIntegrityError(f"[PCS] {msg}")

    def get_invariants(self) -> Dict[str, Any]:
        """ Returns all axiomatic invariants for GAX policy enforcement. """
        # Structure validation ensures this key exists
        return self.constraints[self.ACVD_KEYS.POLICY_INVARIANTS]