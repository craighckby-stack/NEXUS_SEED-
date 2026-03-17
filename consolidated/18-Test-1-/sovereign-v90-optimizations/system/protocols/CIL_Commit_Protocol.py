# CIL_Commit_Protocol V94.1

"""
Protocol Handler for committing immutable constraints to the CIL ledger.
Enforces hash-chain linkage and multi-signature integrity requirements defined by CIL V94.2.
"""

import time
import hashlib
from typing import Dict, Any
from core.crypto.SignatureValidator import AICV_Validator

def compute_entry_hash(data: Dict[str, Any]) -> str:
    """Computes the definitive Entry_Hash (SHA-384) for integrity verification.
       Must exclude signatures and the entry hash itself to hash core content only.
    """
    # Exclude non-content fields for hashing the core immutable data set
    content_to_hash = {k: v for k, v in data.items() if k not in ['GCO_Integrity_Signature', 'Entry_Hash']}
    # Ensure stable ordering for reproducible hashing
    serialized_content = str(sorted(content_to_hash.items())).encode('utf-8')
    return hashlib.sha384(serialized_content).hexdigest()

class CIL_Committer:
    
    def __init__(self, ledger_access, scr_snapshot_generator, previous_entry_hash: str):
        self.ledger = ledger_access
        self.scr_gen = scr_snapshot_generator
        self.previous_hash = previous_entry_hash

    def finalize_entry(self, entry_payload: Dict[str, Any], gco_signature: str) -> Dict[str, Any]:
        """
        Protocol Steps:
        1. Validate GCO signature using AICV.
        2. Verify SCR integrity linkage (SCR_Source_Root match).
        3. Populate linkage fields (Previous_Entry_Hash, Timestamp).
        4. Compute and lock the final Entry_Hash, completing the block.
        """
        
        # 1. Verification of Provenance and Integrity
        if not AICV_Validator.verify_gco_signature(entry_payload, gco_signature):
            raise IntegrityError("GCO signature validation failed by AICV protocol.")

        # 2. Check SCR Integrity Linkage
        # NOTE: self.scr_gen is assumed to retrieve/compute the mandated hash for the SCR subset.
        expected_scr_hash = self.scr_gen.generate_root_hash(entry_payload['Constraint_UUID'])
        if expected_scr_hash != entry_payload['SCR_Source_Root']:
            raise IntegrityError(f"SCR hash mismatch for UUID {entry_payload['Constraint_UUID']}.")

        # 3. Structure Finalization and Chaining
        entry_payload['GCO_Integrity_Signature'] = gco_signature
        entry_payload['Previous_Entry_Hash'] = self.previous_hash
        # Adheres to UTC-NANO high-precision timestamping
        entry_payload['Timestamp_T_UTC'] = time.time_ns()
        
        # 4. Hashing and Final Lock
        entry_payload['Entry_Hash'] = compute_entry_hash(entry_payload)

        # 5. Commitment to ledger storage
        self.ledger.commit_block(entry_payload)
        
        return entry_payload
