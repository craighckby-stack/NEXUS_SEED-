import time
import hashlib
import json
from typing import Dict, Any, Optional

# NOTE: Assuming core.crypto.SignatureValidator.AICV_Validator and IntegrityError are defined/imported elsewhere.
# For demonstrative completeness, we include a mock IntegrityError:
class IntegrityError(Exception): pass

# --- Optimization Layer: Hashing ---

def compute_entry_hash(data: Dict[str, Any]) -> str:
    """Computes the definitive Entry_Hash (SHA-384) using canonical JSON serialization.
    Optimized for stable serialization speed using minimal separators and sorted keys.
    """
    
    EXCLUSION_KEYS = frozenset(['GCO_Integrity_Signature', 'Entry_Hash'])
    
    # 1. Filtering content
    content_to_hash = {k: v for k, v in data.items() if k not in EXCLUSION_KEYS}
    
    # 2. Canonical serialization: Using json.dumps optimized with sort_keys=True and minimal separators
    serialized_content = json.dumps(
        content_to_hash, 
        sort_keys=True, 
        separators=(',', ':') 
    ).encode('utf-8')
    
    return hashlib.sha384(serialized_content).hexdigest()

# --- Recursive Abstraction Layer: Committer ---

class CIL_Committer:
    
    def __init__(self, ledger_access, scr_snapshot_generator, previous_entry_hash: str):
        self.ledger = ledger_access
        self.scr_gen = scr_snapshot_generator
        self.previous_hash = previous_entry_hash

    def _recursive_verification(self, payload: Dict[str, Any], gco_signature: str) -> None:
        """Stage 1: Abstracted verification of external signature and internal SCR linkage integrity."""
        from core.crypto.SignatureValidator import AICV_Validator # Local import optimization if possible
        
        # 1. GCO Signature Validation
        if not AICV_Validator.verify_gco_signature(payload, gco_signature):
            raise IntegrityError("GCO signature validation failed by AICV protocol.")

        # 2. SCR Integrity Linkage Check
        constraint_uuid = payload.get('Constraint_UUID')
        if not constraint_uuid:
             raise ValueError("Payload missing required 'Constraint_UUID'.")

        expected_scr_hash = self.scr_gen.generate_root_hash(constraint_uuid)
        if expected_scr_hash != payload.get('SCR_Source_Root'):
            raise IntegrityError(f"SCR hash mismatch for UUID {constraint_uuid}.")

    def _link_and_timestamp(self, payload: Dict[str, Any], gco_signature: str) -> None:
        """Stage 2: Adds protocol linkage fields (previous hash, signature) and high-precision timestamp."""
        payload['GCO_Integrity_Signature'] = gco_signature
        payload['Previous_Entry_Hash'] = self.previous_hash
        # Use time_ns for high-precision timestamping compliance
        payload['Timestamp_T_UTC'] = time.time_ns() 

    def _hash_and_lock(self, payload: Dict[str, Any]) -> None:
        """Stage 3: Computes the final canonical Entry_Hash, locking the state."""
        payload['Entry_Hash'] = compute_entry_hash(payload)
        
    def _commit_to_ledger(self, finalized_entry: Dict[str, Any]) -> None:
        """Stage 4: Isolated persistence step (I/O)."""
        self.ledger.commit_block(finalized_entry)

    def finalize_entry(self, entry_payload: Dict[str, Any], gco_signature: str) -> Dict[str, Any]:
        """Optimized commitment pipeline using function composition and recursive abstraction (Verification -> Linkage -> Hashing -> Persistence)."""
        
        # Optimization Note: Payload is passed by reference and mutated in place across stages
        
        # 1. Verification (Read/Check)
        self._recursive_verification(entry_payload, gco_signature)
        
        # 2. Linkage (Write 1)
        self._link_and_timestamp(entry_payload, gco_signature)
        
        # 3. Hashing (Write 2/Lock)
        self._hash_and_lock(entry_payload)
        
        # 4. Persistence (I/O)
        self._commit_to_ledger(entry_payload)
        
        return entry_payload