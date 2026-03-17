from typing import TypedDict, Literal, Dict, Union, Any

# --- System Schemas for Constraint Definition --- 

ScalingType = Literal["ADAPTIVE_INVERSE_MAPPING", "EXPONENTIAL_DECAY_0_TO_1"]

class DynamicScalingParameters(TypedDict, total=False):
    """Parameters specific to the scaling function chosen."""
    # Common attributes required by various strategies:
    decay_rate: float 
    factor_coefficient: float
    offset: float
    max_reduction_limit: float
    
class StructuredConstraintDefinition(TypedDict):
    """Defines a complete, structured constraint for dynamic weight calculation."""
    constraint_id: str
    description: str
    scaling_type: ScalingType
    baseline_weight: float
    # Dictionary of parameters passed to the chosen scaling strategy
    dynamic_scaling_parameters: DynamicScalingParameters

class OmegaCalculationParameters(TypedDict):
    """Parameters for the highly critical Omega factor calculation."""
    base_value: float
    metric_factor_coefficient: float
    max_reduction_limit: float
    min_omega_floor: float

# NOTE: In a production system, these TypedDicts would be replaced by Pydantic models 
# to enforce runtime validation and type guarantees upstream of the ConstraintEvaluatorRuntime.