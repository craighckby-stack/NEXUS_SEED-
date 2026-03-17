# governance/CRoTPersistenceLayer.py
import logging
import hashlib
import json
from typing import Optional, Dict, Any, TypeAlias, Type, Callable

# --- Architectural Dependency Imports ---
from governance.interfaces.core import (
    PolicyProposalState, 
    StagingArtifact, 
    SecureVaultInterface
)

logger = logging.getLogger(__name__)

class IntegrityError(Exception):
    """Raised when artifact integrity verification fails."""
    pass

class OperationalError(Exception):
    """Raised for errors during vault communication or storage operations."""
    pass

# Helper TypeAlias for clarity
CSRHash: TypeAlias = str 

class CRoTPersistenceLayer:
    """
    CRoT (Configuration Root of Trust) Persistence Layer - V4.1 (Atomic Activation & Verification)
    Role: Handles authenticated, integrity-checked storage and atomic activation 
    of finalized Policy Hot-Patch artifacts, providing the secure anchor for policy evolution.
    
    Adopts DIP using SecureVaultInterface, requiring .put, .get, .exists, and .set_pointer methods.
    """
    
    # Constants for Persistence
    ARTIFACT_ID_PREFIX = "CSR_STAGE_"
    ARTIFACT_ID_SUFFIX = ".json"
    DEFAULT_HASH_ALGORITHM = 'SHA256'
    
    # Identifier for the pointer that marks the current ACTIVE CSR
    ACTIVE_CSR_POINTER_KEY = "CURRENT_ACTIVE_CSR_HASH"

    def __init__(self, secure_vault: SecureVaultInterface, vault_context: str):
        """
        :param secure_vault: Implementation of the SecureVaultInterface.
        :param vault_context: Identifier for the specific high-security storage path/context.
        """
        if not vault_context or not isinstance(vault_context, str):
            raise ValueError("Vault Context identifier must be a non-empty string.")

        # Explicit check for mandatory interface methods (increased interface safety)
        required_methods = ['put', 'get', 'exists', 'set_pointer']
        if not all(hasattr(secure_vault, method) for method in required_methods):
             raise TypeError(f"SecureVaultInterface implementation is missing required methods: {required_methods}.")

        self._vault = secure_vault
        self._context = vault_context
        
        logger.info(f"CRoT Layer initialized successfully for Context: {self._context}")

    # --- Utility Methods ---

    @classmethod
    def _get_artifact_key(cls, csr_hash: CSRHash) -> str:
        """Generates the canonical artifact key for vault storage."""
        return f"{cls.ARTIFACT_ID_PREFIX}{csr_hash.upper()}{cls.ARTIFACT_ID_SUFFIX}"

    @classmethod
    def calculate_payload_hash(cls, payload: PolicyProposalState, algorithm: str = DEFAULT_HASH_ALGORITHM) -> CSRHash:
        """
        Calculates the canonical hash of the policy payload (ensures deterministic JSON serialization).
        """
        try:
            # Ensure deterministic JSON: sorted keys, minimum separators for efficiency and determinism
            payload_str = json.dumps(payload, sort_keys=True, separators=(',', ':')).encode('utf-8')
            
            hasher = hashlib.new(algorithm.lower())
            hasher.update(payload_str)
            return hasher.hexdigest().upper()
        except ValueError as e:
            # Handles errors if the hash algorithm is invalid
            raise IntegrityError(f"Unsupported hash algorithm '{algorithm}' specified.") from e
        except Exception as e:
            raise OperationalError(f"Error calculating policy hash: {e}") from e

    def _validate_staging_artifact(self, artifact: StagingArtifact) -> CSRHash:
        """Performs integrity verification and returns the validated hash."""
        try:
            expected_hash = artifact['CSR_HASH_N_PLUS_1'].upper()
            policy_payload = artifact['POLICY_PAYLOAD']
            algorithm = artifact.get('HASH_ALGORITHM', self.DEFAULT_HASH_ALGORITHM)

            calculated_hash = self.calculate_payload_hash(policy_payload, algorithm)

            if calculated_hash != expected_hash:
                logger.critical(
                    "INTEGRITY FAILURE: Hash mismatch during anchoring. "
                    f"Expected: {expected_hash}, Calculated: {calculated_hash}"
                )
                raise IntegrityError("Artifact content integrity verification failed (Hash mismatch).")
            
            return expected_hash
            
        except KeyError as e:
            raise OperationalError(f"Malformed StagingArtifact missing required key: {e}")
        except IntegrityError:
            raise 
        except Exception as e:
            raise OperationalError(f"Unexpected validation error: {e}")

    # --- Persistence Operations ---

    def anchor_staging_artifact(self, artifact: StagingArtifact) -> bool:
        """
        Anchors the finalized artifact (CSR_N+1) into immutable storage after integrity verification.
        """
        try:
            # 1. Critical Integrity Check & Validation (Separation of Concerns)
            validated_hash = self._validate_staging_artifact(artifact)
            
            # 2. Anchoring to Vault
            artifact_key = self._get_artifact_key(validated_hash)
            artifact_data = json.dumps(artifact)
            
            success = self._vault.put(self._context, artifact_key, artifact_data)
            
            if success:
                logger.info(f"Anchor SUCCESS: Stored immutable artifact {artifact_key}")
                return True
            else:
                raise OperationalError(f"Vault 'put' operation failed for {artifact_key}.")

        except (IntegrityError, OperationalError) as e:
            logger.error(f"Anchoring failed due to critical error: {e}")
            return False
        except Exception:
            logger.exception(f"FATAL UNHANDLED ERROR during vault anchoring to {self._context}.")
            return False

    def activate_artifact(self, csr_hash: CSRHash) -> bool:
        """
        Atomically updates the CSR root pointer to reference the newly anchored artifact.
        """
        validated_hash = csr_hash.upper()
        
        # Pre-activation check: must ensure the artifact exists before promoting the pointer
        if not self.check_artifact_exists(validated_hash):
            logger.warning(f"Activation failure: Cannot activate non-existent artifact {validated_hash}.")
            return False
            
        try:
            success = self._vault.set_pointer(
                context=self._context,
                key_name=self.ACTIVE_CSR_POINTER_KEY,
                pointer_value=validated_hash
            )

            if success:
                logger.info(f"Activation SUCCESS: CSR Root Pointer updated to {validated_hash}.")
                return True
            else:
                raise OperationalError("Vault failed to update active CSR pointer atomically.")
                
        except OperationalError:
            return False
        except Exception as e:
            logger.exception(f"Unexpected error during activation of {validated_hash} in {self._context}. Error: {e}")
            return False

    def retrieve_active_csr_hash(self) -> Optional[CSRHash]:
        """
        Retrieves the hash of the currently ACTIVE Configuration State Root (CSR_N).
        Standardized retrieval using the generic 'get' method for pointer key access.
        """
        try:
            # Removed complex getattr checks, relying solely on 'get' for standardized key retrieval
            active_hash_raw = self._vault.get(self._context, self.ACTIVE_CSR_POINTER_KEY)

            if active_hash_raw is None:
                return None
            
            # Handle byte decoding if necessary and strip whitespace
            active_hash = active_hash_raw.decode('utf-8').strip() if isinstance(active_hash_raw, bytes) else str(active_hash_raw).strip()
            
            if not active_hash:
                 return None

            return active_hash.upper()
        
        except Exception as e:
            logger.exception(f"Operational error retrieving active CSR pointer from vault {self._context}.")
            raise OperationalError("Failed to retrieve active CSR hash.") from e

    def check_artifact_exists(self, csr_hash: CSRHash) -> bool:
        """Utility to quickly check if a specific artifact key exists."""
        artifact_key = self._get_artifact_key(csr_hash)
        try:
            return self._vault.exists(self._context, artifact_key)
        except Exception:
            logger.warning(f"Error checking existence for {artifact_key}. Vault might be unreachable.")
            return False

    def retrieve_artifact_by_hash(self, csr_hash: CSRHash) -> Optional[StagingArtifact]:
        """Retrieves a specific stored governance artifact by its hash and parses it."""
        artifact_key = self._get_artifact_key(csr_hash)
        
        try:
            raw_data = self._vault.get(self._context, artifact_key)
            
            if raw_data is None:
                logger.debug(f"Artifact not found for key: {artifact_key}")
                return None
            
            # Ensure raw_data is a string if bytes are returned (common vault behavior)
            if isinstance(raw_data, bytes):
                raw_data = raw_data.decode('utf-8')

            return json.loads(raw_data)
        
        except json.JSONDecodeError as e:
            logger.warning(f"Vault returned malformed JSON data for key: {artifact_key}. Error: {e}")
            raise OperationalError("Malformed artifact data in vault storage.") from e
        except Exception as e:
            logger.exception(f"Operational error retrieving artifact {artifact_key}.")
            raise OperationalError("Vault retrieval failed.") from e