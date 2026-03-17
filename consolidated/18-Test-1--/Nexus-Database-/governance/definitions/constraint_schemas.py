from pydantic import BaseModel, Field, root_validator, ValidationError
from typing import Literal, Dict, Union, Any

# --- Type Definitions ---

ScalingType = Literal[
    "ADAPTIVE_INVERSE_MAPPING",
    "EXPONENTIAL_DECAY_0_TO_1",
    "PIECEWISE_LINEAR_CLAMP"
]

# --- Constraint/Governance Schemas ---

class OmegaParameters(BaseModel):
    """Schema for parameters required by calculate_omega."""
    base_value: float = Field(..., description="Starting value for Omega before reduction.")
    metric_factor_coefficient: float = Field(..., gt=0, description="Coefficient applied to RTM exposure.")
    max_reduction_limit: float = Field(..., gt=0, description="Upper bound on the total reduction applied.")
    min_omega_floor: float = Field(0.0, description="Minimum acceptable final value for Omega.")

# --- Dynamic Scaling Parameter Schemas ---

class BaseDynamicScalingParameters(BaseModel):
    """Base class for dynamic scaling parameters, defining the discriminator field."""
    type: ScalingType = Field(..., discriminator=True, description="Discriminator field identifying the algorithm.")

class ExponentialDecayParams(BaseDynamicScalingParameters):
    """Parameters specific to the Exponential Decay scaling algorithm."""
    type: Literal["EXPONENTIAL_DECAY_0_TO_1"]
    decay_rate: float = Field(1.0, gt=0, description="The 'k' value in the exponential decay function (exponent).")

class AdaptiveInverseMappingParams(BaseDynamicScalingParameters):
    """Parameters specific to the Adaptive Inverse Mapping (Inverse Linear) scaling algorithm."""
    type: Literal["ADAPTIVE_INVERSE_MAPPING"]
    factor_coefficient: float = Field(1.0, gt=0, description="Coefficient applied to the metric change.")
    offset: float = Field(0.0, description="Metric offset/threshold before scaling begins.")
    max_reduction_limit: float = Field(float('inf'), ge=0, description="Maximum allowed percentage reduction of the base weight. Set to inf for no upper bound.")

class PiecewiseLinearClampParams(BaseDynamicScalingParameters):
    """Parameters specific to the Piecewise Linear Clamp scaling algorithm (added definition)."""
    type: Literal["PIECEWISE_LINEAR_CLAMP"]
    breakpoints: Dict[float, float] = Field(..., description="Map of metric input value (key) to resulting weight reduction factor (value, 0-1). Keys must be monotonically increasing.")
    interpolation_mode: Literal["LINEAR", "STEP", "CUBIC"] = Field("LINEAR", description="Method used to interpolate between defined breakpoints.")

# --- Main Definition ---

ScalingParametersUnion = Union[ExponentialDecayParams, AdaptiveInverseMappingParams, PiecewiseLinearClampParams]

class DynamicScalingDefinition(BaseModel):
    """Schema for defining how a constraint's weight dynamically scales (SCD).
    Refactored to use Pydantic Union/Discriminator for robust parameter typing.
    """
    baseline_weight: float = Field(1.0, ge=0, description="The nominal weight when the metric is ideal.")
    
    scaling_parameters: ScalingParametersUnion = Field(
        ..., 
        description="Algorithm-specific parameters, defined by the 'type' field within the parameters object."
    )