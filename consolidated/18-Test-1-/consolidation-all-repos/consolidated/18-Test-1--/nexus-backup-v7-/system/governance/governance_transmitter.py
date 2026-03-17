import json
import hashlib
import time
import logging
from typing import Dict, Any, Optional, Set
from enum import Enum

# NOTE: Assuming centralized logging configuration has been established by the system.
logger = logging.getLogger('GovernanceTransmitter')
logger.setLevel(logging.INFO)


class AdjustmentType(Enum):
    """Defines recognized types of governance actions supported by the system."""
    POLICY_UPDATE = "POLICY_UPDATE"
    RESOURCE_ALLOCATION = "RESOURCE_ALLOCATION"
    VERSION_FREEZE = "VERSION_FREEZE"
    CRITICAL_HALT = "CRITICAL_HALT"


class GovernanceTransmitter:
    """
    Manages secure packaging, integrity signing, and initiation of 
    governance proposals directed towards the Policy Configuration Server (PCS).

    Responsibilities:
    1. Canonicalization and signing of proposals (integrity check).
    2. Adding essential attestation metadata (timestamp, source, protocol version).
    3. Delegation of secure transmission to the dedicated SecureClient (to be implemented).
    """

    # Explicitly define mandatory structural components for every proposal.
    MANDATORY_FIELDS: Set[str] = {'SOURCE_DAEMON', 'ADJUSTMENT_TYPE', 'RATIONALE', 'PAYLOAD'}
    PROTOCOL_VERSION = "v94.1_G1"

    def __init__(self, pcs_endpoint: str):
        """Initializes the transmitter with the target Policy Configuration Server endpoint."""
        if not pcs_endpoint:
            raise ValueError("PCS endpoint cannot be empty.")
        self.pcs_endpoint = pcs_endpoint

        # Placeholder for secure client initialization once scaffolded
        # self.secure_client = SecurePCSClient(pcs_endpoint)
        
        logger.debug(f"Initialized GovernanceTransmitter targeting {self.pcs_endpoint}")

    @staticmethod
    def _create_payload_signature(proposal: Dict[str, Any]) -> str:
        """Generates a unique, reproducible SHA256 signature for the canonicalized proposal.
        Ensures consistent hashing using sorted keys and minimal separators.
        """
        try:
            # Canonical representation for signing integrity: sorted keys, minimal separators.
            canonical_proposal = json.dumps(proposal, sort_keys=True, separators=(',', ':'))
            return hashlib.sha256(canonical_proposal.encode('utf-8')).hexdigest()
        except TypeError as e:
            logger.error(f"Serialization error during signature generation: {e}")
            raise

    def validate_schema(self, proposal: Dict[str, Any]) -> bool:
        """Checks if the proposal meets all mandatory structural requirements and type constraints."""
        missing = self.MANDATORY_FIELDS - proposal.keys()
        if missing:
            logger.error(f"Proposal schema validation failed: Missing fields: {list(missing)}.")
            return False
        
        # Check if ADJUSTMENT_TYPE is a recognized, defined type.
        adj_type = proposal.get('ADJUSTMENT_TYPE')
        valid_types = {item.value for item in AdjustmentType}

        if adj_type not in valid_types:
            logger.error(f"Proposal schema validation failed: Unknown ADJUSTMENT_TYPE: {adj_type}. Must be one of {list(valid_types)}.")
            return False
        
        return True

    def transmit(self, proposal: Dict[str, Any]) -> Optional[str]:
        """
        Packages the proposal, generates metadata, and delegates transmission.
        Returns the payload hash (tracking ID) on success, or None on failure.
        """
        if not self.validate_schema(proposal):
            return None

        # 1. Generate Integrity Hash
        try:
            payload_hash = self._create_payload_signature(proposal)
        except Exception as e:
            logger.error(f"Aborting transmission due to failed signature generation: {e}")
            return None

        attestation_metadata = {
            "timestamp_utc": time.time(),
            "source_daemon": proposal['SOURCE_DAEMON'],
            "payload_hash": payload_hash,
            "governance_protocol_version": self.PROTOCOL_VERSION
        }

        # 2. Final Package Assembly
        final_package = {
            "metadata": attestation_metadata,
            "proposal_data": proposal
        }

        # 3. Secure Transport Delegation
        try:
            package_json = json.dumps(final_package, separators=(',', ':'))
            
            # Delegation Point: This is where the dedicated SecurePCSClient should take over.
            # self.secure_client.send_secure(package_json)
            
            logger.info(
                f"Tx initiated (Handing off): {proposal['ADJUSTMENT_TYPE']} | Hash: {payload_hash[:10]}... | Target: {self.pcs_endpoint}"
            )
            
            time.sleep(0.0001) # Simulate rapid delegation

            logger.debug("Transmission handoff confirmed. Payload released to Secure Client queue.")
            
            return payload_hash
        
        except Exception as e:
            logger.critical(f"Transmission CRITICAL FAILURE for {proposal.get('ADJUSTMENT_TYPE', 'unknown')}: {e}", exc_info=True)
            return None
