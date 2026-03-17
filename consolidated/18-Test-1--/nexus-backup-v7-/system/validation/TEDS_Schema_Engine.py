from typing import Dict, Any, List, Union, Type
from config.governance_schema import TEDS_EVENT_CONTRACT
import logging

logging.basicConfig(level=logging.WARNING)

class SchemaLookupError(Exception):
    """Raised if a defined field or contract version is not found."""
    pass

class TEDS_Schema_Engine:
    """Manages the definitive, versioned TEDS contracts and provides runtime utilities.
    
    Centralizes type mapping, complex validation rules, and ensures schema consistency
    across monitoring components, decoupling IH_Sentinel from raw configuration.
    """
    
    _TYPE_MAP: Dict[str, Union[Type, tuple]] = {
        'str': str, 'string': str,
        'int': int, 'integer': int,
        'float': float, 'number': (int, float),
        'bool': bool, 'boolean': bool,
        'dict': dict, 'object': dict,
        'list': list, 'array': list,
        'json_serializable': (dict, list, str),
    }

    def __init__(self, contract: Dict[str, Any]):
        self._contract = contract
        self.fields = contract.get('fields', {})
        self.version = contract.get('version', 'v0.94')

    def get_expected_type(self, field_key: str) -> Union[Type, tuple, None]:
        """Retrieves the Python type object(s) corresponding to the field definition."""
        definition = self.fields.get(field_key)
        if not definition:
            return None
        
        expected_type_str = definition.get('type', 'str').lower()
        
        return self._TYPE_MAP.get(expected_type_str)

    def get_mandatory_keys(self) -> List[str]:
        return self._contract.get('mandatory_keys', [])
        
    # Future functionality: def validate_range(self, key, value): ...

# Initialize the primary contract engine instance
TEDS_CONTRACT_ENGINE = TEDS_Schema_Engine(TEDS_EVENT_CONTRACT)
