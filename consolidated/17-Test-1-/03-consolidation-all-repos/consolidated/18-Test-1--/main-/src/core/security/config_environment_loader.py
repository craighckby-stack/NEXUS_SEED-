import logging
import json
from pathlib import Path
from typing import Dict, Any, Optional, Protocol, runtime_checkable

# --- Custom Exceptions for Bootstrapping ---
class ConfigurationLoadError(Exception):
    """Base exception for all CEL configuration loading failures."""
    pass

class ArtifactIntegrityError(ConfigurationLoadError):
    """Raised when an artifact fails cryptographic verification (hash/signature check)."""
    pass

class ArtifactMissingError(ConfigurationLoadError):
    """Raised when a required artifact file cannot be found."""
    pass

class ArtifactParseError(ConfigurationLoadError):
    """Raised when decrypted artifact content fails parsing (JSON/YAML)."""
    pass

# --- Dependency Protocols (Require Python 3.8+) ---
@runtime_checkable
class KeyManagementServiceInterface(Protocol):
    def decrypt(self, data: bytes) -> bytes:
        """Decrypts the raw encrypted artifact data."""
        ...
    def instantiate_secure_environment(self) -> None:
        """Locks keys in memory and purges temporary data."""
        ...

@runtime_checkable
class CryptographicVerifierInterface(Protocol):
    def verify_content_integrity(self, artifact_name: str, content: bytes) -> bool:
        """Verifies signature/hash of content against stored manifest data."""
        ...

    @classmethod
    def from_manifest_data(cls, manifest_data: Dict[str, Any]) -> 'CryptographicVerifierInterface':
        """Initializes the verifier using the trusted CRYPTO_MANIFEST content."""
        ...


class ConfigurationEnvironmentLoader:
    """
    CEL (v94.1): Securely bootstraps the environment by loading, decrypting, and 
    cryptographically validating critical governance configurations and secrets.

    The loader enforces sequential dependency: Manifest -> Verifier -> Other Artifacts.
    """
    
    # Defines the core artifacts needed for initial operational security clearance.
    REQUIRED_ARTIFACT_PATHS: Dict[str, str] = {
        "CRYPTO_MANIFEST": "protocol/cryptographic_manifest.json.enc", 
        "ACVM_BOUNDS": "config/acvm_bounds.json.enc",
        "GAX_MASTER": "protocol/gax_master.yaml.enc"
    }

    def __init__(
        self,
        key_service: Optional[KeyManagementServiceInterface] = None,
        artifact_base_path: Path = Path('.')
    ):
        self.log = logging.getLogger('CEL')
        self.key_service = key_service  
        self.base_path = artifact_base_path
        self.verified_manifests: Dict[str, Dict[str, Any]] = {}
        self.verifier: Optional[CryptographicVerifierInterface] = None

    def _verify_and_decrypt_artifact(
        self, 
        content_key: str,
        relative_path_str: str
    ) -> Dict[str, Any]:
        """Handles secure file reading, decryption, and preliminary validation."""
        
        path = self.base_path / relative_path_str

        if not path.is_file():
            self.log.critical(f"Artifact missing: {path}")
            raise ArtifactMissingError(f"Critical governance artifact not found: {path}")
        
        raw_data = path.read_bytes()

        # 1. Decryption
        if self.key_service is None:
            self.log.warning(f"Key management service is uninitialized. Assuming plaintext artifact for testing: {path.name}.")
            decrypted_content_bytes = raw_data
        else:
            try:
                decrypted_content_bytes = self.key_service.decrypt(raw_data)
            except Exception as e:
                self.log.error(f"Decryption failed for {path.name}: {e}")
                raise ConfigurationLoadError(f"Decryption key failure for {path.name}") from e

        # 2. Cryptographic Validation (Skipped only for CRYPTO_MANIFEST during initial load)
        if content_key != "CRYPTO_MANIFEST" and self.verifier:
            if not self.verifier.verify_content_integrity(path.name, decrypted_content_bytes):
                self.log.critical(f"Integrity check FAILED for {path.name}")
                raise ArtifactIntegrityError(f"Integrity check failed for {path.name}. Possible tampering/rollback attack.")
        
        # 3. Parsing (Placeholder assumes JSON for simplicity; real system handles YAML/Custom formats)
        try:
            # Assuming manifest artifacts are JSON for bootstrap clarity
            parsed_content = json.loads(decrypted_content_bytes.decode('utf-8')) 
        except json.JSONDecodeError as e:
            self.log.error(f"Parsing failure for {path.name}")
            raise ArtifactParseError(f"Failed to parse decrypted artifact {path.name}: {e}")
        
        self.log.info(f"Integrity verification SUCCESS (or skipped): {path.name}")
        return parsed_content

    def prepare_environment(self, verifier_protocol: type[CryptographicVerifierInterface]) -> Optional[Dict[str, Dict[str, Any]]]:
        """Executes the environment setup, artifact loading, and hardening."""
        self.log.info("Initiating Configuration Environment Loader (CEL v94.1) for secure bootstrap...")
        
        try:
            required_paths = self.REQUIRED_ARTIFACT_PATHS

            # Step 1: Load and parse the trusted CRYPTO_MANIFEST first.
            manifest_path = required_paths.get("CRYPTO_MANIFEST")
            if not manifest_path:
                 raise ConfigurationLoadError("REQUIRED_ARTIFACT_PATHS is missing CRYPTO_MANIFEST entry.")
                 
            manifest_data = self._verify_and_decrypt_artifact("CRYPTO_MANIFEST", manifest_path)
            self.verified_manifests["CRYPTO_MANIFEST"] = manifest_data
            
            # Step 2: Initialize Cryptographic Verifier using the trusted manifest data.
            # This solves the architectural dependency paradox.
            self.verifier = verifier_protocol.from_manifest_data(manifest_data)
            self.log.info("Cryptographic Verifier initialized from trusted manifest.")

            # Step 3: Load and verify remaining artifacts using the instantiated Verifier.
            for key, relative_path_str in required_paths.items():
                if key == "CRYPTO_MANIFEST":
                    continue
                    
                verified_data = self._verify_and_decrypt_artifact(key, relative_path_str)
                self.verified_manifests[key] = verified_data
                
            # Step 4: Environment hardening (key purging/locking)
            if self.key_service:
                self.key_service.instantiate_secure_environment()
                self.log.debug("Key management service hardening executed.")
            
            self.log.info("CEL v94.1 successful. Environment configuration loaded and verified.")
            return self.verified_manifests
        
        except ConfigurationLoadError as e:
            self.log.critical(f"FATAL CEL BOOTSTRAP FAILURE: {type(e).__name__}: {e}")
            # Trigger FSMU isolation or boot halt.
            return None
        
        except Exception as e:
            self.log.critical(f"UNFORESEEN CEL CRITICAL FAILURE ({type(e).__name__}): {e}")
            return None
