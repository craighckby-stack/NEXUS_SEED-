'''
FDLS Protocol Validator (Core Component)

This module enforces the structural (Pydantic schema) and logical (Constraint Engine)
integrity of all Federated Data Layer Specification (FDLS) artifacts,
acting as the primary enforcement mechanism derived from the system's governance axioms.
'''
import json
from pydantic import BaseModel, Field, ValidationError
from typing import List, Literal, Optional, Dict, Any, Callable, Type


class ProtocolValidationError(Exception):
    """Custom exception raised for FDLS Specification validation failures."""
    pass


# --- Constraint Management Type ---
ConstraintFunction = Callable[['FDLSSpec'], None]

# --- Pydantic Sub-Schemas ---

class DifferentialPrivacyConfig(BaseModel):
    mechanism: str = Field(description="The core DP mechanism used (e.g., Laplace, Gaussian).")
    epsilon: float = Field(gt=0, description="Privacy budget epsilon.")
    delta: float = Field(ge=0, le=1, description="Failure probability delta.")
    scope: Literal['record', 'global']

class SecureAggregationConfig(BaseModel):
    algorithm: str = Field(description="The underlying SA scheme (e.g., LDP, specialized multi-party computation).")
    minimum_parties: int = Field(gt=1, description="Minimum number of participants required for aggregation.")
    encryption_standard: str

class SecurityConstraints(BaseModel):
    # Replaced generic Dict with specific schemas or None
    differential_privacy: Optional[DifferentialPrivacyConfig] = None
    secure_aggregation: Optional[SecureAggregationConfig] = None
    auth_mechanism: Literal['mTLS', 'OAuth2', 'None'] = Field(description="Defines the required network authentication scheme.")


class WorkflowStep(BaseModel):
    step_name: str = Field(description="Unique identifier for the workflow stage.")
    # Renamed for clarity, using alias for backward compatibility
    role_permissions: List[str] = Field(alias='roles', description="List of roles permitted to execute/initiate this step.")
    mandatory_fields: List[str] = Field(default_factory=list, description="Fields that must be present in messages for this step.")
    requires_security_transport: bool = Field(default=False, alias='requires_security', description="Does this step require a secure connection (e.g., TLS)?")
    requires_integrity_check: bool = False
    timeout_ms: int = Field(default=30000, gt=0, description="Maximum time allowed for this step, in milliseconds.")

    class Config:
        allow_population_by_field_name = True
        # Standard for V1 pydantic usage, though not strictly needed here.


class FDLSSpec(BaseModel):
    protocol_version: str = Field(pattern=r'^v\d+\.\d+(\.\d+)?$', description="The version of the FDLS standard implemented.")
    specification_id: str
    network_topology: Dict[str, Any] = Field(description="Defines structure, roles, and endpoints.")
    data_format_standard: Dict[str, Any] = Field(description="Schema definition or reference for exchanged data objects.")
    workflow: List[WorkflowStep]
    security_constraints: SecurityConstraints
    telemetry: Dict[str, Any]


class ProtocolConstraintEngine:
    """
    Mixin class to manage and execute logical constraints beyond basic schema validation.
    Uses a registry pattern for extensibility.
    """
    _CONSTRAINTS: List[ConstraintFunction] = []

    @classmethod
    def register_constraint(cls, constraint_func: ConstraintFunction):
        """Registers a new logical constraint function."""
        cls._CONSTRAINTS.append(constraint_func)
        return constraint_func

    def run_constraints(self, spec: FDLSSpec):
        """Executes all registered constraints against the FDLSSpec."""
        for constraint_func in self._CONSTRAINTS:
            constraint_func(spec) # Expects functions to raise ProtocolValidationError on failure
        return True


# --- Logical Constraint Definitions (Registered) ---

@ProtocolConstraintEngine.register_constraint
def constraint_workflow_must_not_be_empty(spec: FDLSSpec):
    """Ensure the workflow defines at least one step."""
    if not spec.workflow:
        raise ProtocolValidationError("Constraint Violated: Workflow must contain at least one step definition.")

@ProtocolConstraintEngine.register_constraint
def constraint_step_security_matches_global_auth(spec: FDLSSpec):
    """Ensure steps requiring security don't conflict with global 'None' auth."""
    auth = spec.security_constraints.auth_mechanism
    if auth == 'None':
        for step in spec.workflow:
            if step.requires_security_transport:
                raise ProtocolValidationError(
                    f"Constraint Violated: Workflow step '{step.step_name}' requires secure transport (requires_security_transport=True) "
                    f"but the global security constraints define 'auth_mechanism': 'None'."
                )

@ProtocolConstraintEngine.register_constraint
def constraint_role_cohesion(spec: FDLSSpec):
    """
    Ensure all roles used in workflow steps are potentially addressable/defined in network_topology.
    (Assumes network_topology keys define permissible roles).
    """
    defined_roles = set(spec.network_topology.keys())

    workflow_roles = set()
    for step in spec.workflow:
        workflow_roles.update(step.role_permissions)
    
    undefined_roles = workflow_roles - defined_roles
    if undefined_roles:
         raise ProtocolValidationError(
            f"Constraint Violated: Workflow steps use roles that are not defined in 'network_topology' keys: {list(undefined_roles)}"
        )


class ProtocolValidator(ProtocolConstraintEngine):
    """
    Validates an FDLS specification, enforcing both structural correctness (schema)
    and internal logical consistency (constraints), utilizing a constraint engine.
    This validator serves as a core enforcement mechanism for the system's governance rules.
    """

    def __init__(self, raw_data: Dict[str, Any]):
        """Initialize the validator directly with raw data."""
        self.raw_data = raw_data

    @classmethod
    def from_file(cls, spec_source: str) -> 'ProtocolValidator':
        """Factory method to load and initialize from a file path."""
        try:
            with open(spec_source, 'r') as f:
                data = json.load(f)
            return cls(raw_data=data)
        except FileNotFoundError:
            raise ProtocolValidationError(f"Specification file not found at {spec_source}")
        except json.JSONDecodeError as e:
            raise ProtocolValidationError(f"Invalid JSON structure in file {spec_source}: {e}")

    @classmethod
    def from_dict(cls, spec_data: Dict[str, Any]) -> 'ProtocolValidator':
        """Factory method to initialize from a dictionary."""
        return cls(raw_data=spec_data)

    def validate_spec(self) -> FDLSSpec:
        """
        Performs layered validation: Schema -> Logical Constraints.
        Raises ProtocolValidationError on failure.
        Returns the instantiated FDLSSpec model upon success.
        """
        # 1. Structural Validation (Pydantic Schema)
        try:
            spec_model = FDLSSpec.parse_obj(self.raw_data)
        except ValidationError as e:
            # Use JSON serialization for cleaner Pydantic error output
            error_details = json.loads(e.json())
            error_summary = "\n".join([f"  Field: {err['loc']} -> {err['msg']}" for err in error_details])
            raise ProtocolValidationError(f"Structural Schema Validation Error:\n{error_summary}") from e

        # 2. Logical Constraint Validation (Engine)
        self.run_constraints(spec_model)

        print(f'FDLS Specification {spec_model.specification_id} validated successfully (Version: {spec_model.protocol_version}).')
        return spec_model
