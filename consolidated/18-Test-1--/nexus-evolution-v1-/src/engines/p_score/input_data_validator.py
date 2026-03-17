import json
from typing import Dict, Any, List

class PScoreInputValidator:
    """Fetches and validates raw input data based on P-Score config constraints."""

    def __init__(self, config: Dict):
        self.config = config
        self.inputs_def = config.get('inputs', [])

    def validate_single_metric(self, metric_def: Dict, value: Any) -> bool:
        constraints = metric_def.get('validation_constraints', {})
        
        # 1. Check requirement
        if constraints.get('required', False) and value is None:
            raise ValueError(f"Missing required metric: {metric_def['metric_key']}")

        if value is None: return True
        
        # 2. Check Type (simplified type coercion based on config)
        data_type = metric_def.get('data_type')
        if data_type == 'normalized_float' or data_type == 'percentage':
            value = float(value)
        elif data_type == 'ordinal_integer':
            value = int(value)

        # 3. Check Range Constraints
        if 'min' in constraints and value < constraints['min']:
            raise ValueError(f"Value below minimum threshold for {metric_def['metric_key']}: {value} < {constraints['min']}")
        if 'max' in constraints and value > constraints['max']:
            raise ValueError(f"Value above maximum threshold for {metric_key['metric_key']}: {value} > {constraints['max']}")
            
        return True

    def validate_all(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        validated_data = {}
        for metric_def in self.inputs_def:
            key = metric_def['metric_key']
            value = raw_data.get(key)
            
            self.validate_single_metric(metric_def, value)
            if value is not None:
                validated_data[key] = value
                
        return validated_data

if __name__ == '__main__':
    # Example usage based on config/governance/p_score_engine_config_v1.json
    example_config = {"inputs": [
        {"metric_key": "security_vulnerability_score", "data_type": "normalized_float", "validation_constraints": {"min": 0.0, "max": 1.0, "required": true}},
        {"metric_key": "functional_integrity_coverage", "data_type": "percentage", "validation_constraints": {"min": 0.6, "max": 1.0, "required": true}}
    ]}
    
    validator = PScoreInputValidator(example_config)
    
    good_data = {"security_vulnerability_score": 0.95, "functional_integrity_coverage": 0.75}
    print("Validating good data:", validator.validate_all(good_data))
    
    try:
        bad_data = {"security_vulnerability_score": 1.1, "functional_integrity_coverage": 0.9}
        validator.validate_all(bad_data)
    except ValueError as e:
        print("Validation Failed (Expected):
", e)
