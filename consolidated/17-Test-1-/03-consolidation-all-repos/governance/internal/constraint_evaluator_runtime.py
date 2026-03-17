import math
from typing import Dict, Any, Callable, Union

# Define internal scaling constants for clarity and type safety
SCALE_TYPE_ADAPTIVE_INVERSE = "ADAPTIVE_INVERSE_MAPPING"
SCALE_TYPE_EXPONENTIAL_DECAY = "EXPONENTIAL_DECAY_0_TO_1"

class ConstraintEvaluationError(Exception):
    """Base exception for constraint evaluation failures."""
    pass

def _extract_float_param(params: Dict[str, Union[float, str]], key: str) -> float:
    """
    Robustly extracts and casts a required parameter to float, raising
    a specific ConstraintEvaluationError on failure (missing key or invalid type).
    """
    try:
        return float(params[key])
    except KeyError:
        raise ConstraintEvaluationError(f"Missing required parameter '{key}' for calculation.")
    except (ValueError, TypeError):
        raise ConstraintEvaluationError(f"Parameter '{key}' has invalid type or value: {params.get(key)}")


class ConstraintEvaluatorRuntime:
    """ 
    Core engine for interpreting Structured Constraint Definitions (SCD) 
    and real-time metrics (RTM) to determine final runtime governance values.
    Implements a Strategy pattern for various scaling algorithms.
    
    Version v94.1 emphasizes efficiency, clear error handling, and separation of concerns.
    """

    # --- Internal Scaling Functions (Static Strategies) ---

    @staticmethod
    def _scale_exponential_decay(metric_value: float, params: Dict[str, float]) -> float:
        """Scales weight using exponential decay: factor = e^(-k * metric_value), clamped to [0, 1]."""
        k = params.get('decay_rate', 1.0)
        if k < 0:
             raise ConstraintEvaluationError("Decay rate 'k' must be non-negative for standard exponential decay.")
             
        # math.exp calculation provides the normalized scaling factor
        factor = math.exp(-k * metric_value)
        return max(0.0, min(1.0, factor))

    @staticmethod
    def _scale_adaptive_inverse_linear(metric_value: float, params: Dict[str, float]) -> float:
        """
        Calculates a normalized reduction factor using an inverse linear model (1.0 - Reduction).
        Reduction = (M - Offset) * Coefficient, clamped to guarantee a factor in [0, 1].
        """
        factor_coeff = params.get('factor_coefficient', 1.0)
        offset = params.get('offset', 0.0)
        
        reduction_amount = (metric_value - offset) * factor_coeff
        
        max_reduction = params.get('max_reduction_limit', float('inf'))
        reduction_amount = min(reduction_amount, max_reduction)
        
        # Normalized factor (1.0 is full weight, 0.0 is zero weight)
        return max(0.0, 1.0 - reduction_amount)

    SCALING_STRATEGIES: Dict[str, Callable[[float, Dict[str, float]], float]] = {
        SCALE_TYPE_EXPONENTIAL_DECAY: _scale_exponential_decay,
        SCALE_TYPE_ADAPTIVE_INVERSE: _scale_adaptive_inverse_linear,
    }

    # --- Public Calculation Methods ---

    def calculate_omega(self, rtm_exposure: float, params: Dict[str, Union[float, str]]) -> float:
        """
        Calculates the final Omega factor (scaling parameter) using an adaptive linear reduction.
        Omega = Base - Reduction, clamped by min_omega_floor.
        """
        
        # Use helper for clean, robust parameter extraction
        base_value = _extract_float_param(params, 'base_value')
        metric_factor_coefficient = _extract_float_param(params, 'metric_factor_coefficient')
        max_reduction_limit = _extract_float_param(params, 'max_reduction_limit')
        min_omega_floor = _extract_float_param(params, 'min_omega_floor')

        reduction = rtm_exposure * metric_factor_coefficient
        
        reduction = min(reduction, max_reduction_limit)
        
        omega = base_value - reduction
        
        return max(omega, min_omega_floor)

    def calculate_dynamic_weight(self, metric_value: float, definition: Dict[str, Any]) -> float:
        """
        Calculates a dynamic constraint weight based on a defined scaling type and parameters 
        (Structured Constraint Definition - SCD).
        """
        
        try:
            scaling_type = definition['scaling_type']
            # Ensure baseline weight is a valid float immediately
            baseline_weight = float(definition['baseline_weight'])
            dynamic_scaling_parameters = definition['dynamic_scaling_parameters']
        except KeyError as e:
            raise ConstraintEvaluationError(f"SCD missing required key: {e.args[0]}")
        except ValueError:
             raise ConstraintEvaluationError(f"SCD baseline_weight must be numerical.")

        
        strategy = self.SCALING_STRATEGIES.get(scaling_type)
        if not strategy:
            raise ConstraintEvaluationError(f"Unknown scaling type defined: '{scaling_type}'. Available types: {list(self.SCALING_STRATEGIES.keys())}")

        try:
            # The strategy function returns the normalized scaling factor (0.0 to 1.0)
            normalized_factor = strategy(metric_value, dynamic_scaling_parameters)
        except ConstraintEvaluationError:
            # Re-raise internal evaluation errors without changing type
            raise
        except Exception as e:
            # Catch unexpected errors during strategy execution
             raise ConstraintEvaluationError(f"Scaling strategy '{scaling_type}' failed execution: {e}")

        # Apply the scaling factor to the baseline weight
        final_weight = baseline_weight * normalized_factor
        
        return final_weight