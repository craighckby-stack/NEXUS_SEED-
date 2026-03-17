import json
from typing import Dict, Any
from config.TEDS_event_contract import TEC_CONTRACT

class TEDSContractManager:
    """
    Centralizes the management, versioning, and secure access of the TEDS Event Contract (TEC).
    Ensures the TEC is loaded consistently and provides utilities for retrieving global requirements.
    """
    def __init__(self, contract_data: Dict[str, Any] = TEC_CONTRACT):
        self._contract = contract_data
        # Future: Implement contract signature verification/integrity check upon load

    def get_contract(self) -> Dict[str, Any]:
        """Returns the full loaded contract definition.
        Future versions may return a specific, versioned contract based on runtime state.
        """
        return self._contract

    def get_sequence_definition(self) -> List[Dict[str, Any]]:
        """Returns the sequence definition list."""
        return self._contract.get("sequence", [])

    def get_global_required_keys(self) -> List[str]:
        """Returns keys required in every TEDS event record.
        """
        return self._contract.get("required_keys", [])

    # Future methods: Contract version negotiation, contract mutation tracking.
