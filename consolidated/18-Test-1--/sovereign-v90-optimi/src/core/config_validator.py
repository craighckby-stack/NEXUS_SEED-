from typing import Any, Dict
# Assuming a standard location for system exceptions
# If exceptions.py does not exist, it should be created.
class ConfigurationError(Exception):
    """Raised when critical configuration values are invalid or missing."""
    pass

from src.config.cbm_defaults import CBMLimits

class ConfigValidator:
    """Utility class to validate and sanitize system configurations.
    Ensures that critical bounds (like CBM limits) adhere to required value ranges.
    """

    @staticmethod
    def validate_cbm_limits(config: Dict[str, Any]) -> CBMLimits:
        """Validates the input dictionary against the constraints of CBMLimits."""
        try:
            validated_config = config.copy() 

            # 1. Complexity Budget Check: Must be 0.0 < x <= 1.0
            budget = validated_config.get("complexity_budget")
            if not isinstance(budget, (float, int)) or not (0.0 < budget <= 1.0):
                raise ConfigurationError(f"Invalid complexity_budget: {budget}. Must be (0.0, 1.0].")
            validated_config["complexity_budget"] = float(budget)

            # 2. Positive Integer Checks
            for key in ["max_size_bytes", "max_estimated_depth", "max_required_tokens"]:
                value = validated_config.get(key)
                if not isinstance(value, int) or value <= 0:
                    raise ConfigurationError(f"Invalid CBM limit for {key}: {value}. Must be a positive integer.")

            # Cast ensures the returned dictionary satisfies the static type CBMLimits
            return validated_config  # type: ignore

        except KeyError as e:
            raise ConfigurationError(f"Missing critical key in CBM configuration: {e}")
        except Exception as e:
            raise ConfigurationError(f"Failed to validate CBM limits configuration due to internal error: {e}")