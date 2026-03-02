# IH_Sentinel.py: Integrity Halt Sentinel Monitoring Layer

import logging
from typing import Dict, Any, List, Union, Type
from abc import ABC, abstractmethod

# Dependencies from Calculus Engine and Governance Framework
from system.core.P01_calculus_engine import IntegrityHalt, RRPManager
# NOTE: TEDS_EVENT_CONTRACT is expected to contain 'mandatory_keys' and potential 'validation_rules'
from config.governance_policies import SENTINEL_CRITICAL_FLAGS
from config.governance_schema import TEDS_EVENT_CONTRACT

logging.basicConfig(level=logging.INFO, format='[IHSentinel] %(levelname)s: %(message)s')

class SentinelViolationError(Exception):
    """Custom exception raised when a non-negotiable TEDS contract or axiomatic
    flag failure occurs, requiring immediate Integrity Halt.
    
    Used for centralized error flow control within monitor_stream.
    """
    def __init__(self, message: str, severity: str = "CRITICAL"):
        super().__init__(message)
        self.severity = severity
        self.message = message

class TEDSContractAuditor(ABC):
    """Abstract Base Class for defining specialized TEDS validation handlers.
    Enables modular extension of contract enforcement (e.g., type checking, range checks).
    """
    @abstractmethod
    def audit(self, event: Dict[str, Any]):
        """Raises SentinelViolationError on failure, otherwise returns silently."""
        pass

class MandatoryKeyAuditor(TEDSContractAuditor):
    """Checks for the presence of all defined mandatory keys based on TEDS_EVENT_CONTRACT."""
    
    def __init__(self, contract: Dict[str, Any]):
        # Pre-extract required keys during initialization for minor efficiency gain
        self.required_keys = contract.get('mandatory_keys', [])

    def audit(self, event: Dict[str, Any]):
        missing_keys = [key for key in self.required_keys if key not in event]
        
        if missing_keys:
            error_msg = f"Schema Violation: Missing mandatory keys: {missing_keys}"
            raise SentinelViolationError(error_msg, severity="SCHEMA_INTEGRITY_FAILURE")

# --- Primary Sentinel --- 

class IHSentinel:
    """Actively monitors the TEDS stream for contract deviations and pre-emptively
    triggers an Integrity Halt (IH) if axiomatic failure conditions (IH Flags) are detected.
    Uses modular auditing and centralized error handling for improved efficiency and robustness.
    """

    # Axiomatic flags loaded dynamically and pre-processed to uppercase
    CRITICAL_FLAGS: List[str] = [flag.upper() for flag in SENTINEL_CRITICAL_FLAGS]
    
    def __init__(self):
        self.auditors: List[TEDSContractAuditor] = [
            MandatoryKeyAuditor(TEDS_EVENT_CONTRACT)
            # Future auditors (e.g., TypeAuditor, RangeAuditor) will be added here
        ]
        logging.info("IHSentinel initialized. Monitoring axiomatic flags and TEDS contract adherence.")

    def _execute_contract_audit(self, event: Dict[str, Any]):
        """Runs all defined auditors sequentially. Raises SentinelViolationError on first failure."""
        
        # Fast-failure auditing
        for auditor in self.auditors:
            auditor.audit(event)

    def _check_critical_flags(self, event: Dict[str, Any]):
        """
        Phase 2: Critical Flag Axiomatic Check.
        Raises SentinelViolationError if a known critical flag is active.
        """
        
        if event.get('flag_active'):
            # flag_name is guaranteed to be upper case in CRITICAL_FLAGS check
            flag_name = str(event['flag_active']).upper()
            
            if flag_name in self.CRITICAL_FLAGS:
                stage = event.get('stage', 'UNKNOWN')
                error_msg = f"AXIOMATIC IH FLAG DETECTED: {flag_name} activated during stage {stage}."
                raise SentinelViolationError(error_msg, severity="AXIOMATIC_FLAG_TRIGGER")

    def monitor_stream(self, new_event: Dict[str, Any]) -> bool:
        """
        Ingest a new TEDS event. Performs synchronous, non-negotiable checks.
        Uses centralized exception handling for robust IH triggering.
        Returns True if an IH was triggered, False otherwise.
        """
        if not new_event:
            return False

        try:
            # Phase 1: Contract Integrity Check
            self._execute_contract_audit(new_event)

            # Phase 2: Critical Flag Check
            self._check_critical_flags(new_event)
            
            return False

        except SentinelViolationError as e:
            stage = new_event.get('stage', 'Unknown/Pre-Validation')
            
            logging.critical(
                f"[{e.severity}] Sentinel triggered Integrity Halt at Stage {stage}: {e.message}"
            )
            
            # Centralized Response Mechanism: Only one place initiates Halt and Rollback
            IntegrityHalt.trigger(f"{e.severity}: {e.message}")
            RRPManager.initiate_rollback()
            return True
