# Execution Post-Mortem Report Utility (EPRU) V94.2
# Mandate: Process signed Forensic Data & Log Snapshots (FDLS) to ensure continuous operational feedback and failure analysis integrity.

import json
from pathlib import Path
from typing import Dict, Any, Optional

# --- System Dependencies (Mocked/Injected) ---
# NOTE: Assumes AGI_AuditSystem handles persistence, integrity, and structured logging.
class AGI_AuditLog:
    @staticmethod
    def error(msg): return print(f"[AGI_LOG: ERROR] {msg}")
    @staticmethod
    def info(msg): return print(f"[AGI_LOG: INFO] {msg}")
    @staticmethod
    def audit(msg): return print(f"[AGI_LOG: AUDIT] {msg}")

# --- Configuration ---
DEFAULT_REGISTRY_PATH = Path('config/failure_registry.json')
MINIMUM_REQUIRED_FIELDS = ["ih_time", "p_set_id", "gsep_stage", "summary"]

class EPRU:
    def __init__(self, registry_path: Path = DEFAULT_REGISTRY_PATH, audit_log=AGI_AuditLog):
        self.log = audit_log
        self.registry_path = registry_path
        self.registry: Dict[str, Any] = {"version": "V94.2", "reports": []}
        self._load_registry()

    def _load_registry(self) -> None:
        """Loads the failure registry, creating it if it doesn't exist or handling corruption."""
        if not self.registry_path.exists():
            self.log.info(f"Registry not found. Initializing new registry at {self.registry_path}.")
            return

        try:
            with open(self.registry_path, 'r') as f:
                data = json.load(f)

            if not isinstance(data.get("reports"), list):
                # Critical structural failure, but file is readable JSON.
                raise ValueError("Registry structure invalid (reports key missing or not a list).")

            self.registry.update(data)
                
        except json.JSONDecodeError:
            self.log.error(f"FATAL CORRUPTION: Registry file {self.registry_path} is corrupted. Resetting reports structure.")
            self.registry["reports"] = []
        except Exception as e:
            self.log.error(f"Unexpected error loading registry: {type(e).__name__}: {e}. Initializing clean reports list.")
            self.registry["reports"] = []

    def _save_registry(self) -> None:
        """Writes the updated registry state. WARNING: This overwrites the entire file. Must migrate to JSONL/DB for high volume audit logs."""
        try:
            self.registry_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Note: For true audit integrity, an atomic write strategy (temp file then rename) is usually preferred over direct overwrite.
            with open(self.registry_path, 'w') as f:
                json.dump(self.registry, f, indent=4, ensure_ascii=False)
            
        except IOError as e:
            self.log.error(f"I/O Error: Failed to save EPRU registry to disk: {e}")

    def ingest_signed_fdls(self, signed_fdls: Dict[str, Any], aass_signature_valid: bool) -> bool:
        """Ingests a cryptographically signed FDLS, verifies signature status, and logs the incident."""
        
        # 1. Integrity Check (External AASS Verification)
        if not aass_signature_valid:
            # P-R03 Breach: Verification failure implies potential system or communication compromise.
            self.log.error("Ingestion rejected (P-R03): AASS signature verification failed. FDLS dropped.")
            return False

        # 2. Extract and Validate Critical Fields
        metadata = signed_fdls.get("metadata", {})
        trigger = signed_fdls.get("trigger", {})
        forensic = signed_fdls.get("forensic", {})

        incident_data = {
            "timestamp": metadata.get("ih_time", "UNKNOWN_TIME"),
            "ih_trigger": trigger.get("p_set_id", "NO_ID"),
            "gsep_stage": trigger.get("gsep_stage", "UNKNOWN_STAGE"),
            "root_cause_summary": forensic.get("summary", "No forensic summary provided."),
            "aass_seal": signed_fdls.get("signature", "MISSING_SEAL")
        }
        
        # Mandatory field check
        if incident_data["ih_trigger"] == "NO_ID":
            self.log.error(f"FDLS lacks critical process identifier (p_set_id). Ingestion aborted.")
            return False

        # 3. Log and Persist
        self.registry["reports"].append(incident_data)
        self._save_registry()
        
        self.log.audit(f"Incident {incident_data['ih_trigger']} logged and sealed. GSEP Stage: {incident_data['gsep_stage']}.")
        return True