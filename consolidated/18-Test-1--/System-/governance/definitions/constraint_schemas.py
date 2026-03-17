from pydantic import BaseModel, Field, validator
from typing import Literal, Dict, Any

# Define accepted scaling algorithms
ScalingType = Literal[
    "ADAPTIVE_INVERSE_MAPPING",
    "EXPONENTIAL_DECAY_0_TO_1",
    "PIECEWISE_LINEAR_CLAMP" 
]

class OmegaParameters(BaseModel):
    """Schema for parameters required by calculate_omega."""
    base_value: float = Field(..., description="Starting value for Omega before reduction.")
    metric_factor_coefficient: float = Field(..., gt=0, description="Coefficient applied to RTM exposure.")
    max_reduction_limit: float = Field(..., gt=0, description="Upper bound on the total reduction applied.")
    min_omega_floor: float = Field(0.0, description="Minimum acceptable final value for Omega.")

class ExponentialDecayParams(BaseModel):
    """Parameters specific to the Exponential Decay scaling algorithm."""
    decay_rate: float = Field(1.0, gt=0, description="The 'k' value in the exponential decay function.")

class InverseLinearParams(BaseModel):
    """Parameters specific to the Inverse Linear scaling algorithm."""
    factor_coefficient: float = Field(1.0, gt=0, description="Linear scaling factor.")
    offset: float = Field(0.0, description="Metric offset before scaling begins.")
    max_reduction_limit: float = Field(float('inf'), gt=0, description="Maximum allowed percentage reduction.")

class DynamicScalingDefinition(BaseModel):
    """Schema for defining how a constraint's weight dynamically scales (SCD)."""
    scaling_type: ScalingType = Field(..., description="The algorithm used for calculating the scaling factor.")
    baseline_weight: float = Field(1.0, ge=0, description="The nominal weight when the metric is ideal.")
    dynamic_scaling_parameters: Dict[str, Any] = Field({}, description="Algorithm-specific parameters.")

    @validator('dynamic_scaling_parameters', always=True)
    def validate_params_match_type(cls, v, values):
        if 'scaling_type' not in values: return v
        
        type_map = {
            "EXPONENTIAL_DECAY_0_TO_1": ExponentialDecayParams,
            "ADAPTIVE_INVERSE_MAPPING": InverseLinearParams,
        }

        schema = type_map.get(values['scaling_type'])
        if schema:
            # Attempt to parse parameters using the specific algorithm schema
            try:
                schema.parse_obj(v)
            except Exception as e:
                raise ValueError(f"Parameters validation failed for type '{values['scaling_type']}': {e}")
        
        return v