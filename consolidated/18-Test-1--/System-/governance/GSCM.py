import hashlib
import time
from typing import Dict, Any, List, Optional
import json

class GSEPStateChainManager:
    """
    GSEP State Chain Manager (GSCM)
    Purpose: Manages cryptographic state transition integrity for the Governance Evolution Protocol (GSEP L0-L6).
    This module is the sole issuer and verifier of the output locks (L_N) required for sequential GSEP progression.
    It enforces deterministic cryptographic chaining based on content and preceding state hash.
    """

    # Hashing algorithms specification
    ARTIFACT_HASH_ALG = hashlib.sha512
    LOCK_HASH_ALG = hashlib.sha256

    def __init__(self, key_material: str):
        # Use a deterministic hash of the key material for internal reference
        self._root_key_hash: str = self.LOCK_HASH_ALG(key_material.encode()).hexdigest()
        self.ledger: Dict[str, Dict[str, Any]] = {}
        # Tracks the lock of the most recently committed stage for efficient chain walking
        self.chain_head: Optional[str] = None 

    def _canonicalize_artifact(self, artifact_content: Dict[str, Any]) -> str:
        """
        Creates a canonical JSON string representation of the artifact content (ASDM compliant).
        This ensures deterministic input for hashing regardless of input key ordering.
        """
        # Using separators and sorting keys ensures strict canonicalization.
        return json.dumps(artifact_content, sort_keys=True, separators=(',', ':'))

    def _generate_artifact_hash(self, artifact_content: Dict[str, Any]) -> str:
        """Generates a verifiable hash based on canonicalized artifact content.
        
        NOTE: If using external schema validation (like Pydantic), this should be executed
        AFTER validation to ensure structural integrity.
        """
        content_string = self._canonicalize_artifact(artifact_content)
        return self.ARTIFACT_HASH_ALG(content_string.encode('utf-8')).hexdigest()

    def issue_stage_lock(self, stage_id: str, preceding_lock: str, artifact: Dict[str, Any]) -> str:
        """
        Issues the deterministic cryptographic lock (L_N) for the current GSEP stage.

        Args:
            stage_id: Unique identifier for the stage (e.g., 'L0', 'L1_Commit').
            preceding_lock: The cryptographic lock (L_N-1) of the preceding state. Use '' for L0.
            artifact: The payload data defining the state transition results.

        Returns:
            The newly generated cryptographic lock L_N.

        Raises:
            PermissionError: If the preceding lock is invalid or sequence integrity is compromised.
            ValueError: If a conflicting stage ID is already recorded.
        """
        artifact_hash = self._generate_artifact_hash(artifact)

        # 1. Validation check for sequential chaining (L0 is an exception)
        if stage_id != 'L0' and preceding_lock:
            is_valid_predecessor = False
            # Check if the preceding lock is known and marked as committed
            if any(record['lock'] == preceding_lock and record['status'] == "COMMITTED" 
                   for record in self.ledger.values()):
                is_valid_predecessor = True

            if not is_valid_predecessor:
                raise PermissionError(
                    f"GSCM: Invalid or uncommitted preceding lock found for stage {stage_id}. Sequence halted."
                )

        # 2. Lock generation (Deterministic component ONLY)
        # Lock generation must be reproducible without time dependency.
        lock_data = f"{self._root_key_hash}:{stage_id}:{artifact_hash}:{preceding_lock}"
        new_lock = self.LOCK_HASH_ALG(lock_data.encode()).hexdigest()

        # 3. State update checks
        if stage_id in self.ledger:
             # Allow idempotent calls if the resulting lock is identical.
             if self.ledger[stage_id]['lock'] != new_lock:
                raise ValueError(f"GSCM: Attempted issuance of already recorded stage {stage_id} with conflicting lock.")
             return new_lock

        self.ledger[stage_id] = {
            "timestamp": time.time(), # Metadata, not used for cryptographic chaining
            "preceding_lock": preceding_lock,
            "artifact_hash": artifact_hash,
            "lock": new_lock,
            "stage_id": stage_id,
            "status": "COMMITTED"
        }
        self.chain_head = new_lock
        return new_lock

    def verify_chain_integrity(self, stage_id: str, expected_lock: str) -> bool:
        """Verifies if the stored lock for a given stage matches the expected cryptographic output.
        (Basic lock lookup)
        """
        if stage_id not in self.ledger:
            return False
        return self.ledger[stage_id]['lock'] == expected_lock

    def verify_full_chain(self) -> List[Dict[str, Any]]:
        """
        Recursively verifies the entire ledger integrity from the most recent commit (chain_head)
        backward, ensuring every link's cryptographic integrity is intact.
        
        Returns:
            A list of failed records or an empty list if the chain is valid.
        """
        if not self.chain_head:
            return []

        # Build the chain sequence from head to L0 based on preceding_lock pointers
        current_lock = self.chain_head
        reverse_ledger = {record['lock']: record for record in self.ledger.values()}
        verification_sequence = []
        
        while current_lock in reverse_ledger:
            record = reverse_ledger[current_lock]
            verification_sequence.append(record)
            
            if not record['preceding_lock']:
                break
                
            current_lock = record['preceding_lock']

        # Process the sequence forward (L0 -> L_N)
        verification_sequence.reverse()

        recalculated_predecessor_lock = ""
        failures = []

        for record in verification_sequence:
            stage_id = record['stage_id']
            stored_lock = record['lock']
            
            # Recalculate based on stored components (artifact hash, root key, stage ID)
            artifact_hash = record['artifact_hash']
            
            lock_data = f"{self._root_key_hash}:{stage_id}:{artifact_hash}:{recalculated_predecessor_lock}"
            recalculated_lock = self.LOCK_HASH_ALG(lock_data.encode()).hexdigest()

            if stored_lock != recalculated_lock:
                failures.append({
                    "stage_id": stage_id,
                    "error": "Lock mismatch. Integrity compromise suspected.",
                    "expected": recalculated_lock,
                    "found": stored_lock,
                    "preceding_lock_used": recalculated_predecessor_lock
                })
                # NOTE: If a failure occurs, the following steps will likely also fail
                # due to the corrupted link, providing an audit trail.

            # The stored lock (L_N) is used as the predecessor lock (L_N-1) for the next iteration
            recalculated_predecessor_lock = stored_lock 

        return failures