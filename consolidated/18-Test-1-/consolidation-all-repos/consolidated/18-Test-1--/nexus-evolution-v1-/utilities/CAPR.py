import json
import os
import enum
from typing import Dict, Any, Tuple

# --- Custom Exceptions for Protocol Errors ---
class CAPRException(Exception):
    """Base exception for Cryptographic Attestation Policy Registrar errors.
    
    Used for critical loading, parsing, or persistence failures.
    """
    def __init__(self, error_code: str, message: str = "CAPR Protocol Error"):
        super().__init__(f"[{error_code}] {message}")
        self.error_code = error_code

# --- Protocol Constants (Using Enum for robust state management) ---
class CAPRStatus(enum.Enum):
    SEALED = "SEALED"
    UNREGISTERED = "UNREGISTERED"

class CAPRError(enum.Enum):
    MISSING_ANCHOR = "P-M02: MISSING_SEALED_ANCHOR"
    HASH_MISMATCH = "P-C04: BEHAVIORAL_HASH_MISMATCH"
    DOUBLE_SEAL = "P-G01: ERR_DOUBLE_SEAL_VIOLATION"
    POLICY_CORRUPTION = "P-M02: CAPR_POLICY_MAP_CORRUPTION"
    PERSISTENCE_FAIL = "P-E01: STATE_PERSISTENCE_FAILED"
    COMPLIANT = "POLICY_COMPLIANT"

# Type alias for clarity in return tuples (Result, Protocol Code)
VerificationResult = Tuple[bool, str]

class CryptographicAttestationPolicyRegistrar:
    """
    Manages the lifecycle and cryptographic verification of sealed behavioral models/code 
    (GAX I Compliant). Handles G0 registration and G2 verification checks.
    """
    
    def __init__(self, policy_map_path: str = "protocol/attestation_policy_map.json"):
        """Initialize and load the attestation policy map.
        
        policy_map_path: Path to the JSON file storing sealed policies.
        """
        self.policy_map_path = policy_map_path
        self.policy_map: Dict[str, Any] = self._load_policy_map()

    def _load_policy_map(self) -> Dict[str, Any]:
        """Loads the sealed attestation policy map (artifact of G0)."""
        if not os.path.exists(self.policy_map_path):
            return {}
            
        try:
            with open(self.policy_map_path, 'r') as f:
                return json.load(f)
        except json.JSONDecodeError:
            # High severity error requiring FSMU intervention (Protocol Corruption)
            raise CAPRException(
                error_code=CAPRError.POLICY_CORRUPTION.value,
                message=f"JSON parsing error at {self.policy_map_path}"
            )
        except IOError as e:
            # File system error (permissions, accessibility)
            raise CAPRException(
                error_code=CAPRError.POLICY_CORRUPTION.value,
                message=f"File system access error: {e}"
            )

    def _save_policy_map(self) -> None:
        """Persists the policy map to disk (Crucial for G0 state retention)."""
        try:
            os.makedirs(os.path.dirname(self.policy_map_path) or '.', exist_ok=True)
            with open(self.policy_map_path, 'w') as f:
                json.dump(self.policy_map, f, indent=4)
        except (IOError, OSError) as e:
            # Propagate Persistence Failure as a high severity CAPR Exception
            raise CAPRException(
                error_code=CAPRError.PERSISTENCE_FAIL.value,
                message=f"Failed to persist state to {self.policy_map_path}: {e}"
            )

    def verify_execution_hash(self, model_id: str, current_hash: str) -> VerificationResult:
        """Checks if the currently loaded hash matches the sealed GAX I hash.
        
        Returns (Success, Protocol Code).
        """
        
        policy_data = self.policy_map.get(model_id)
        
        if not policy_data or policy_data.get('status') != CAPRStatus.SEALED.value:
            # Missing required attestation anchor
            return False, CAPRError.MISSING_ANCHOR.value
        
        expected_hash = policy_data.get('hash')
        
        if expected_hash is None or expected_hash != current_hash:
            # Violation of GAX I (Determinism) 
            return False, CAPRError.HASH_MISMATCH.value
        
        return True, CAPRError.COMPLIANT.value

    def register_seal(self, model_id: str, hash_value: str) -> VerificationResult:
        """Registers a final, cryptographically verified hash during G0 phase.
        
        Prevents double registration of sealed IDs.
        """
        
        if model_id in self.policy_map and self.policy_map[model_id].get('status') == CAPRStatus.SEALED.value:
            # Log attempted double-seal violation
            return False, CAPRError.DOUBLE_SEAL.value

        self.policy_map[model_id] = {
            'hash': hash_value, 
            'status': CAPRStatus.SEALED.value,
            'registration_time_seconds': os.times().elapsed # High-efficiency registration marker
        }
        
        # Immediate persistence of critical G0 state
        try:
            self._save_policy_map()
        except CAPRException as e:
            # Return the failure message encapsulated in the exception
            return False, str(e)
            
        return True, "REGISTRATION_COMPLETE"