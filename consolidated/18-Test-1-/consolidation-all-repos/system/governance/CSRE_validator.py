import logging
from typing import Dict, Any, Protocol, Type, Final
from pydantic import BaseModel, ValidationError
import importlib

# --- Core Exceptions ---

class GovernanceHalt(Exception):
    """Base exception for reconciliation failures, preventing CRoT activation."""
    pass

class SchemaIntegrityBreach(GovernanceHalt):
    """Raised when ACVD structure fails Pydantic schema validation."""
    pass

class PolicyLogicError(GovernanceHalt):
    """Raised when validated data violates critical logical constraints (e.g., negative metrics)."""
    pass

class ConfigurationLoadError(GovernanceHalt):
    """Raised if necessary Pydantic models cannot be imported or are malformed."""
    pass

# --- Constants & Configuration Keys ---
# Standard snake_case attribute name assumption for Pydantic models
ACVD_THRESHOLD_KEY: Final[str] = "acvd_threshold"

# NOTE: These constants define the dynamic location used by _load_model
POLICY_MODEL_PATH: Final[str] = ".governance_models"
POLICY_MODEL_NAME: Final[str] = "PolicyConfigurationModel"

# --- Policy Server Definition ---
class AbstractPolicyServer(Protocol):
    """Protocol defining the interface for fetching raw configuration data."""
    def fetch_acvd(self) -> Dict[str, Any]:
        """Must return the raw configuration state dictionary (ACVD)."""
        ...

# --- Setup ---
logger = logging.getLogger('CSRE')
logger.setLevel(logging.INFO)

# Type alias for cleaner references to the Pydantic model class
PolicyModelType = Type[BaseModel]

class ConfigStateReconciliationEngine:
    """Validates and reconciles configuration state (e.g., ACVD files) before handing off to CRoT.
    Enforces mandatory structured validation (Pydantic), leveraging V2 features.
    """

    def __init__(self, policy_server: AbstractPolicyServer):
        self.pcs: AbstractPolicyServer = policy_server
        
        # Policy model must be loaded during initialization (fail-fast principle)
        # Note: If a GovernanceModelResolver were used, this method would be refactored.
        self._PolicyModel: PolicyModelType = self._load_model()
        
        logger.debug(f"CSRE initialized using model: {self._PolicyModel.__name__}")

    def _load_model(self) -> PolicyModelType:
        """Tries to dynamically import the necessary Pydantic configuration model."""
        try:
            # Resolving relative import based on expected package structure (system.governance)
            module = importlib.import_module(POLICY_MODEL_PATH, package="system.governance") 
            
            PolicyConfigurationModel = getattr(module, POLICY_MODEL_NAME)
            
            if not issubclass(PolicyConfigurationModel, BaseModel):
                 raise TypeError(f"Object {POLICY_MODEL_NAME} is not a Pydantic BaseModel.")

            return PolicyConfigurationModel
        
        except (ImportError, AttributeError, TypeError, ValueError) as e:
            logger.error(f"FATAL CONFIG: Cannot load policy model '{POLICY_MODEL_PATH}.{POLICY_MODEL_NAME}'. Error: {type(e).__name__}: {e}")
            raise ConfigurationLoadError(f"Dependency load failed for policy model: {e}")

    def pre_vet_policies(self) -> BaseModel:
        """Fetches critical configs, verifies schema integrity, and checks fundamental policy logic.
           Returns the validated Pydantic model on success."""
        
        try:
            raw_data = self.pcs.fetch_acvd()

            # 1. Schema Validation 
            validated_model = self._validate_schema(raw_data)
            
            # 2. Advanced Logic Check 
            self._check_threshold_logic(validated_model)

        except GovernanceHalt:
            # Catch known system-halting errors
            raise
        except Exception as e:
             # Catch unexpected exceptions (e.g., connection errors, severe runtime issues)
            logger.critical(f"UNEXPECTED HALT: Internal processing error during pre-vetting: {type(e).__name__}: {e}", exc_info=True)
            raise GovernanceHalt(f"Unexpected pre-vet failure: {type(e).__name__}")

        logger.info(f"ACVD policies successfully validated against {self._PolicyModel.__name__}. Ready for CRoT.")
        return validated_model

    def _validate_schema(self, raw_data: Dict[str, Any]) -> BaseModel:
        """Enforces Pydantic schema validation using the pre-loaded Policy Model (V2 method)."""
        
        try:
            validated_model = self._PolicyModel.model_validate(raw_data) 
            return validated_model
        except ValidationError as e:
            # Extract location and message for clear debugging
            detailed_errors = [f"loc={'/'.join(map(str, err['loc']))}, msg={err['msg']}" for err in e.errors()]
            error_message = f"Structured Validation Failed ({self._PolicyModel.__name__}). Errors:\n{'; '.join(detailed_errors)}"
            logger.warning(error_message)
            raise SchemaIntegrityBreach(error_message)

    def _check_threshold_logic(self, validated_data: BaseModel) -> bool:
        """Ensures that critical governance values meet logical constraints (e.g., non-negativity)."""
        
        try:
            threshold = getattr(validated_data, ACVD_THRESHOLD_KEY)
        except AttributeError:
             raise PolicyLogicError(f"Validation failure: Model {self._PolicyModel.__name__} passed schema check but is missing critical logic attribute: {ACVD_THRESHOLD_KEY}.")

        if not isinstance(threshold, (int, float)):
            # Secondary check for type integrity against the fetched value
            raise PolicyLogicError(f"ACVD Threshold value ({threshold}) failed mandatory numeric typing check (was {type(threshold).__name__}).")

        if threshold < 0:
             raise PolicyLogicError(f"ACVD Threshold detected as negative ({threshold}). TEMM constraint violation.")
        
        return True