import logging
import time
from typing import Dict, Any, Optional

# Exceptions are now centralized and imported directly.
from src.exceptions.RegistryExceptions import RegistryConnectionError, PolicyNotFoundError

logger = logging.getLogger(__name__)


class PolicyRegistryClient:
    """ 
    Handles secure, versioned, and cached retrieval of Policy Correction Safety Schemas (PCSS)
    and Axiomatic Constraint Vector Definitions (ACVD) from a trusted Policy Registry.
    Decouples the APRE validation engine from network I/O specifics.
    
    Attributes:
        endpoint (str): The base URL for the registry.
        timeout (float): Connection timeout for registry API calls (seconds).
    """

    DEFAULT_TIMEOUT_SECONDS = 5.0
    
    def __init__(self, 
                 registry_endpoint: str, 
                 timeout_sec: float = DEFAULT_TIMEOUT_SECONDS):
        
        self.endpoint = registry_endpoint
        self.timeout = timeout_sec
        
        # Cache for static or slow-changing constraint vectors (ACVD)
        self._acvd_cache: Dict[str, Dict[str, Any]] = {}
        logger.info(f"PolicyRegistryClient initialized: Endpoint={self.endpoint}, Timeout={self.timeout}s")

    def _simulate_network_io(self, resource_type: str, resource_id: str, is_acvd: bool = False):
        """Internal helper to simulate network latency and potential failures."""
        time.sleep(0.01) # Small simulated delay to mimic I/O overhead
        
        # Consistent connection failure check
        if resource_id == "FAIL_CONN":
            raise RegistryConnectionError(self.endpoint, status_code=503)
        
        # Resource specific not found checks
        if not is_acvd and resource_id == "FAIL_NOT_FOUND":
            raise PolicyNotFoundError(resource_id, version='specific')
        
        if is_acvd and resource_id == 'error_v1':
             # Simulates failure to find a specific ACVD version
             raise PolicyNotFoundError('ACVD', resource_id)
        
    def get_pcss_data(self, trace_id: str) -> Dict[str, Any]:
        """ 
        Retrieves the specific proposed policy correction (PCSS) by trace ID.
        """
        logger.info(f"Attempting PCSS retrieval | Trace ID: {trace_id}")
        
        try:
            self._simulate_network_io("PCSS", trace_id)

            # Simulated successful retrieval payload
            data = {
                "policy_id": trace_id, 
                "schema": {"rules": ["R1_Safety", "R2_Non_Malice"]},
                "retrieval_ts": int(time.time())
            }
            logger.debug(f"PCSS data successfully retrieved for {trace_id}.")
            return data
        
        except (RegistryConnectionError, PolicyNotFoundError) as e:
            logger.error(f"Fatal error during PCSS lookup for {trace_id}: {e}")
            raise 

    def get_acvd_constraints(self, version: str = 'latest') -> Dict[str, Any]:
        """ 
        Retrieves the latest/specified version of the Axiomatic Constraints (ACVD), utilizing cache. 
        ACVD is mission-critical data, usually static per system lifecycle.
        """
        
        if version in self._acvd_cache:
            logger.debug(f"ACVD constraints version '{version}' served from cache.")
            return self._acvd_cache[version]

        logger.info(f"ACVD Cache miss | Requesting version '{version}'.")

        try:
            self._simulate_network_io("ACVD", version, is_acvd=True)
            
            # Simulated heavy constraint payload
            constraints = {
                "version": version,
                "axioms": ["Non-Turing Completeness", "Safety-Critical Default", "Constraint: Resource Limiting"],
                "checksum": hash(version)
            }
            
            self._acvd_cache[version] = constraints
            logger.info(f"ACVD version '{version}' successfully retrieved, cached, and returned.")
            return constraints

        except PolicyNotFoundError as e:
            logger.warning(f"ACVD retrieval failed for version '{version}'. System behavior may degrade.")
            raise
        except RegistryConnectionError as e:
            logger.critical(f"Connection failure preventing ACVD retrieval: {e}. System may be unsafe without core axioms.")
            raise