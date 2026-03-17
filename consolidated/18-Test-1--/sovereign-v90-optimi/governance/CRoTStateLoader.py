# governance/CRoTStateLoader.py
import logging
from typing import Optional, Dict, Any

from governance.CRoTPersistenceLayer import CRoTPersistenceLayer, OperationalError
from governance.interfaces.core import PolicyProposalState

logger = logging.getLogger(__name__)

class CRoTStateLoader:
    """
    CRoT State Loader: Responsible for reading the currently active configuration root
    and presenting the policy payload in a usable format for governance components (e.g., Policy Engine).
    """
    
    def __init__(self, persistence_layer: CRoTPersistenceLayer):
        self._persistence = persistence_layer
        logger.info("CRoT State Loader initialized.")

    def load_active_policy_state(self) -> Optional[PolicyProposalState]:
        """
        Retrieves the active CSR hash, fetches the corresponding artifact, and extracts the policy payload.
        """
        try:
            active_hash = self._persistence.retrieve_active_csr_hash()
            
            if not active_hash:
                logger.warning("No active CSR hash pointer found in the vault.")
                return None

            artifact = self._persistence.retrieve_artifact_by_hash(active_hash)

            if not artifact or 'POLICY_PAYLOAD' not in artifact:
                logger.error(f"Active artifact ({active_hash}) found but is invalid or corrupted (missing payload).")
                return None

            logger.info(f"Successfully loaded active policy state for CSR: {active_hash}")
            return artifact['POLICY_PAYLOAD']

        except OperationalError as e:
            logger.error(f"Failed to load active policy state due to vault operational error: {e}")
            return None
        except Exception:
            logger.exception("Unexpected error during policy state loading.")
            return None
