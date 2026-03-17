# system/security/log_signer.py
# Mandatory utility for cryptographic integrity enforcement on AGI audit logs.
import hashlib
import json
import os
from typing import Dict, Any

# NOTE: Production implementation requires proper hardware security module (HSM)
# or secure enclave interaction and high-assurance cryptographic libraries.
# This serves as the structural implementation using SHA256 integrity hashing.

class LogSigner:
    INTEGRITY_SALT = os.getenv("AGI_LOG_INTEGRITY_SALT", "V94_SOVEREIGN_SEED")
    
    @classmethod
    def sign(cls, entry: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generates a secure cryptographic signature/hash for the log entry.
        Note: Must ensure consistent key sorting before serialization for reproducible hashing.
        """
        # Hashable content (excluding signing_metadata if already present)
        hashable_entry = entry.copy()
        hashable_entry.pop('signing_metadata', None)
        
        # Ensure consistent serialization order for hashing
        entry_data = json.dumps(hashable_entry, sort_keys=True, separators=(',', ':')).encode('utf-8')
        
        hasher = hashlib.sha256()
        hasher.update(entry_data)
        hasher.update(cls.INTEGRITY_SALT.encode('utf-8'))
        
        signature_hash = hasher.hexdigest()
        
        entry['signing_metadata'] = {
            'status': 'SIGNED_V94_INTEGRITY',
            'hash_type': 'SHA256',
            'signature': signature_hash
        }
        return entry
