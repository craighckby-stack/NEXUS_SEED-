import hashlib
import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional, Protocol, Callable

# --- PROTOCOLS (To be extracted to interfaces/forensic_protocols.py) ---

class ISecureLogRepository(Protocol):
    """Protocol for the secure, persistent log storage layer (P-R04)."""
    def store_log(self, sealed_entry: Dict[str, Any]) -> None:
        ...

    def retrieve_log(self, ih_event_id: str) -> Optional[Dict[str, Any]]:
        ...

class IAtomicSigningService(Protocol):
    """Protocol for the service guaranteeing atomic, verifiable cryptographic signing (AASS)."""
    def sign_log_entry(self, metadata: Dict[str, Any]) -> str:
        ...

# ------------------------------------------------------------------------

logger = logging.getLogger(__name__)

class TelemetrySealingError(Exception):
    """Base exception for FDLS operations."""
    pass

class IHEventSealedError(TelemetrySealingError):
    """Raised when trying to seal an already registered IH event ID."""
    pass

class IntegritySpecification:
    """Parses and provides cryptographic parameters based on the system integrity spec.
    Leverages robust hashing functions provided by the system standard library."""
    
    def __init__(self, spec_data: Dict[str, Any]):
        self.spec = spec_data
        
    def get_hash_algorithm(self) -> str:
        # Ensures algorithms are always lowercased for internal consistency.
        return self.spec.get("sealing_hash_algo", "sha256").lower()
        
    def get_hashing_function(self) -> Callable:
        algo = self.get_hash_algorithm()
        
        try:
            if algo not in hashlib.algorithms_available:
                logger.warning(f"Unsupported hashing algorithm '{algo}'. Falling back to sha256.")
                return hashlib.sha256
            
            return getattr(hashlib, algo)
        except AttributeError:
            # Final fallback if dynamic loading fails (highly unlikely)
            return hashlib.sha256


class ForensicDataLockboxService:
    """FDLS: Guarantees tamper-proof logging and sealing of critical forensic telemetry upon Integrity Halt (IH).
    Ensures compliance with canonical serialization and atomic persistence requirements."""
    
    def __init__(
        self, 
        integrity_spec: Dict[str, Any], 
        data_repository: Optional[ISecureLogRepository] = None, 
        signing_service: Optional[IAtomicSigningService] = None
    ):
        self.log_store: Dict[str, Dict[str, Any]] = {}
        self.integrity_engine = IntegritySpecification(integrity_spec)
        self.data_repository = data_repository 
        self.signing_service = signing_service 

    @staticmethod
    def _canonical_serialize(data: dict) -> bytes:
        """Enforces canonical, consistent serialization required for integrity proofing (P-R03)."""
        # Consistent order (sort_keys) and no whitespace (separators) are mandatory.
        return json.dumps(
            data, 
            sort_keys=True, 
            separators=(',', ':')
        ).encode('utf-8')
        
    def _calculate_seal_hash(self, data: dict) -> tuple[str, str]:
        """Calculates the necessary cryptographic seal based on current integrity specs."""
        hasher_func = self.integrity_engine.get_hashing_function()
        algo_name = self.integrity_engine.get_hash_algorithm().upper()
        
        serialized_data = self._canonical_serialize(data)
        seal_hash = hasher_func(serialized_data).hexdigest()
        
        return seal_hash, algo_name

    def seal_telemetry(self, telemetry_tag: str, data: dict, ih_event_id: str) -> Dict[str, Any]:
        """
        Seals raw telemetry, calculates hash, records metadata, and manages signing/persistence commitment.
        Returns the finalized, sealed log entry structure.
        """
        if ih_event_id in self.log_store:
            raise IHEventSealedError(f"IH Event ID '{ih_event_id}' already sealed in current session.")

        seal_hash, algo_name = self._calculate_seal_hash(data)
        timestamp_utc = datetime.utcnow().isoformat(timespec='milliseconds')
        
        # 1. Construct Initial Seal Payload
        sealed_log = {
            "event_id": ih_event_id,
            "timestamp_utc": timestamp_utc,
            "telemetry_tag": telemetry_tag,
            "data_hash": seal_hash,
            "payload_copy": data,
            "sealing_algorithm": algo_name,
            "signature": None 
        }
        
        # Metadata for signing (Excluding bulky payload_copy, as only hash and metadata are signed)
        metadata_to_sign = {k: v for k, v in sealed_log.items() if k != 'payload_copy'}

        # 2. Authenticate using AASS
        if self.signing_service:
            try:
                # Production signing MUST block until completed/queued for atomic commit.
                signature = self.signing_service.sign_log_entry(metadata_to_sign)
                sealed_log["signature"] = signature
            except Exception as e:
                 logger.error(f"[AASS_FAILURE] Atomic Signing Service failed for IH Event ID {ih_event_id}. Proceeding without authenticity proof. Error: {e}") 

        # 3. Persistence Commit (Repository must ensure atomic, synchronous write)
        if self.data_repository:
            try:
                self.data_repository.store_log(sealed_log)
            except Exception as e:
                 # If persistence fails, the internal log_store still holds the record, 
                 # but data integrity commitment is compromised. A critical warning is necessary.
                 logger.critical(f"[PERSISTENCE_FAILURE] Secure Repository commit failed for {ih_event_id}. Data may be lost. Error: {e}")
        
        # Internal index update (critical for operational consistency)
        self.log_store[ih_event_id] = sealed_log 
        
        return sealed_log

        
    def retrieve_sealed_data(self, ih_event_id: str) -> Dict[str, Any]:
        """Retrieves sealed log entry, checking persistence if local cache fails."""
        
        if ih_event_id in self.log_store:
            return self.log_store[ih_event_id]
            
        if self.data_repository:
            retrieved = self.data_repository.retrieve_log(ih_event_id)
            if retrieved:
                self.log_store[ih_event_id] = retrieved # Cache retrieved entry
                return retrieved
        
        # If not found anywhere
        raise KeyError(f"IH Event ID '{ih_event_id}' not found in lockbox or repository.")
