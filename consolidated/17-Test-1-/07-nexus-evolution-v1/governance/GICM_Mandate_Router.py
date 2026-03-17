import json
from typing import Dict, List, Optional

class MandateRouter:
    """Utility for rapid validation and routing based on attested AIDS documents."""

    def __init__(self, aids_registry: List[Dict]):
        self.mandate_map: Dict[str, Dict[str, List[str]]] = {}
        self._build_index(aids_registry)

    def _build_index(self, registry: List[Dict]):
        # Maps GSEP Mandate -> {Agent_ID: Interface_Method_List}
        for definition in registry:
            agent_id = definition.get('agent_id')
            # Ensure interfaces are iterable and non-empty before processing
            interfaces = list(definition.get('interface_api', {}).keys())
            
            if not agent_id or not interfaces:
                continue # Skip invalid definitions

            for mandate in definition.get('mandate_scope', []):
                if mandate not in self.mandate_map:
                    self.mandate_map[mandate] = {}
                
                # Store agent ID and the list of available interfaces under that mandate
                self.mandate_map[mandate][agent_id] = interfaces

    def find_agent_for_mandate(self, mandate_code: str, interface_name: Optional[str] = None) -> List[Dict[str, List[str]]]:
        """Returns attested agents and their methods capable of handling the mandate."""
        if mandate_code in self.mandate_map:
            results = []
            for agent_id, methods in self.mandate_map[mandate_code].items():
                if interface_name is None or interface_name in methods:
                    # Returning full list of methods for context
                    results.append({'agent_id': agent_id, 'interfaces': methods})
            return results
        return []

    def validate_call(self, agent_id: str, mandate_code: str, interface_name: str) -> bool:
        """Validates if the specified agent is attested to handle the mandate via the specific interface."""
        if mandate_code in self.mandate_map:
            agent_data = self.mandate_map[mandate_code]
            if agent_id in agent_data and interface_name in agent_data[agent_id]:
                return True
        return False

# Note: This requires a pre-loaded registry of all active AIDS files for initialization.
