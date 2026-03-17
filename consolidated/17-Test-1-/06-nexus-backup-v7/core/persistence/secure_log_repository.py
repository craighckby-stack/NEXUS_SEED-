from typing import Dict, Any, Optional, List, Union
from pathlib import Path
import json
import os 
import logging

# Initialize logger for the repository
logger = logging.getLogger(__name__)

class SecureLogRepository:
    """Abstracts and provides secure, append-only persistence for sealed forensic logs.
       Designed for maximum resistance to corruption using forced disk synchronization (fsync).
       
       Uses JSON Lines (.jsonl) format.
    """
    # Use JSON Lines extension for clarity
    DEFAULT_PATH = Path("./forensic_logs/sealed_data.jsonl")

    def __init__(self, storage_path: Union[Path, str] = DEFAULT_PATH):
        # Use Union for compatibility with older type hint interpreters, though Path | str is modern.
        self.storage_path: Path = Path(storage_path)
        
        # Ensure the directory exists
        self.storage_path.parent.mkdir(parents=True, exist_ok=True)

    def store_log(self, sealed_log_entry: Dict[str, Any]) -> None:
        """Atomically appends a new, sealed log entry to the log file.
           Forces synchronization (fsync) to guarantee write commitment.
        """
        try:
            line = json.dumps(sealed_log_entry) + '\n'
            
            # Open in append mode
            with open(self.storage_path, 'a', encoding='utf-8') as f:
                f.write(line)
                
                # Step 1: Write to OS buffer
                f.flush() 
                
                # CRITICAL STEP: Step 2: Force write to physical disk
                # Handles edge case where OS caches writes aggressively.
                os.fsync(f.fileno()) 

        except Exception as e:
            # Catching generic Exception for I/O covers permission, disk full, etc.
            logger.critical(
                "[CRITICAL LOG FAILURE] Failed to atomically write forensic log to %s: %s",
                self.storage_path, e
            )
            # Re-raise to alert the calling component of failure
            raise IOError(f"Log write failed due to disk persistence error: {e}")

    def retrieve_log(self, ih_event_id: str) -> Optional[Dict[str, Any]]:
        """Linearly searches the repository for a specific event ID (slow audit/retrieval only)."""
        try:
            if not self.storage_path.exists():
                return None
                
            with open(self.storage_path, 'r', encoding='utf-8') as f:
                for line in f:
                    try:
                        entry = json.loads(line)
                        if entry.get('event_id') == ih_event_id:
                            return entry
                    except json.JSONDecodeError:
                        logger.warning(
                            "Corrupted JSON line skipped during retrieval from %s.",
                            self.storage_path
                        )
                        continue
        except FileNotFoundError: # Should be caught by the check above, but safe to keep.
            return None
        except Exception as e:
             logger.error("Unexpected error during specific log retrieval: %s", e)
             raise RuntimeError(f"Log retrieval system error: {e}")
        
        return None

    def retrieve_all(self) -> List[Dict[str, Any]]:
        """Retrieves all sealed logs for full system audit, gracefully handling corruption."""
        logs: List[Dict[str, Any]] = []
        corrupted_lines = 0
        
        if not self.storage_path.exists():
            return []
            
        try:
            with open(self.storage_path, 'r', encoding='utf-8') as f:
                for line in f:
                    try:
                        logs.append(json.loads(line))
                    except json.JSONDecodeError:
                        corrupted_lines += 1
                        continue 
        except Exception as e:
            logger.error("Fatal error encountered while attempting full retrieval from %s: %s", self.storage_path, e)
            # Optionally re-raise or return partial data based on error type.
            
        if corrupted_lines > 0:
            logger.warning(
                "%d corrupted log entries skipped during full retrieval from %s.",
                corrupted_lines, self.storage_path
            )
            
        return logs
