import json 
from typing import Dict, Any, Set, List

# Placeholder for dependency loading (requires scaffolding below)
from governance.config.OperationalCatalog import SUPPORTED_OPERATIONS 

class SchemaValidationError(Exception):
    """Custom exception for validation failures in the Synthesis Schema."""
    pass

class SynthesisSchemaValidator:
    """
    Validates Synthesis Manifests, focusing on structural integrity and 
    computational graph dependency resolution.
    """
    def __init__(self, manifest_schema: Dict[str, Any]):
        """
        Initializes the validator with the canonical manifest schema. 
        This schema should be used for detailed structural type checks.
        """
        self.schema = manifest_schema
        # Dynamically load supported operations
        self.supported_operations = SUPPORTED_OPERATIONS

    def _validate_structure(self, manifest_data: Dict[str, Any]):
        """Performs initial structural and required field checks."""
        required_fields = ['manifestId', 'metrics', 'schemaVersion']
        
        if not all(k in manifest_data for k in required_fields):
            missing = [k for k in required_fields if k not in manifest_data]
            raise SchemaValidationError(
                f"Manifest missing critical top-level fields: {missing}."
            )
        
        if not isinstance(manifest_data.get('metrics'), dict):
            raise SchemaValidationError("Metrics field must be a dictionary.")

    def _validate_computational_graph(self, metric_name: str, metric_def: Dict[str, Any]):
        """Validates the data flow and dependency resolution within a single metric."""
        if 'computation' not in metric_def or 'mapping' not in metric_def:
            raise SchemaValidationError(
                f"Metric '{metric_name}' definition missing 'computation' or 'mapping'."
            )

        # 1. Initialize known variables (sources of data)
        known_variables: Set[str] = set(metric_def['mapping'].keys())
        known_variables.update(metric_def.get('weights', {}).keys())

        # 2. Validate computation steps sequentially
        for i, step in enumerate(metric_def['computation']):
            step_id = f"Step {i} ({step.get('operation', 'UNKNOWN')})"

            operation = step.get('operation')
            if operation not in self.supported_operations:
                raise SchemaValidationError(
                    f"[{metric_name}][{step_id}] Unsupported operation: {operation}."
                )

            # Check inputs resolution
            inputs = step.get('inputs', [])
            if not isinstance(inputs, list):
                 raise SchemaValidationError(f"[{metric_name}][{step_id}] 'inputs' must be a list.")
                 
            for input_var in inputs:
                if input_var not in known_variables:
                    raise SchemaValidationError(
                        f"[{metric_name}][{step_id}] Input dependency '{input_var}' not resolved. "
                        f"Must be defined in mapping, weights, or a prior computational step alias."
                    )

            # Register output alias for subsequent steps
            if 'alias' in step:
                alias = step['alias']
                if alias in known_variables:
                     raise SchemaValidationError(
                        f"[{metric_name}][{step_id}] Alias '{alias}' conflicts with existing variable or prior alias."
                    )
                known_variables.add(alias)

    def validate_manifest(self, manifest_data: Dict[str, Any]) -> bool:
        """Entry point for full manifest validation."""
        
        # Step 1: Structural Validation
        self._validate_structure(manifest_data)
        
        # Step 2: Deep Metric/Graph Validation
        for metric_name, metric_def in manifest_data['metrics'].items():
            self._validate_computational_graph(metric_name, metric_def)
        
        return True
