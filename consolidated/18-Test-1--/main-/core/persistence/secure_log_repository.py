from typing import Dict, Any, Optional, List
from pathlib import Path
import json
import os 

class SecureLogRepository:
    """Abstracts and provides secure, append-only persistence for sealed forensic logs.
       This repository is designed to be highly resistant to corruption and write failures
       during critical Incident Handling (IH) events using forced disk synchronization.
    """
    DEFAULT_PATH = Path("./forensic_logs/sealed_data.jsonl")

    def __init__(self, storage_path: Path | str = DEFAULT_PATH):
        # Convert string path to Path object if necessary
        self.storage_path = Path(storage_path)
        
        # Ensure the directory exists
        self.storage_path.parent.mkdir(parents=True, exist_ok=True)

    def store_log(self, sealed_log_entry: Dict[str, Any]) -> None:
        """Atomically appends a new, sealed log entry to the log file (JSONL format).
           Forces synchronization (fsync) to guarantee write commitment to stable storage.
        """
        try:
            line = json.dumps(sealed_log_entry) + '\n'
            
            # Use 'a' (append) mode
            with open(self.storage_path, 'a', encoding='utf-8') as f:
                f.write(line)
                
                # Critical step: Ensure data is written to the OS buffer
                f.flush() 
                
                # CRITICAL STEP: Force OS buffers to write to physical disk (fsync)
                os.fsync(f.fileno()) 

        except IOError as e:
            # Catching generic IOError is appropriate for disk/write issues
            raise IOError(f"[CRITICAL] Failed to atomically write forensic log to disk {self.storage_path}: {e}")

    def retrieve_log(self, ih_event_id: str) -> Optional[Dict[str, Any]]:
        """Linearly searches the repository for a specific IH event ID. 
           (Intended for slow audit/retrieval only).
        """
        try:
            with open(self.storage_path, 'r', encoding='utf-8') as f:
                for line in f:
                    try:
                        entry = json.loads(line)
                        if entry.get('event_id') == ih_event_id:
                            return entry
                    except json.JSONDecodeError:
                        # Continue processing, but indicate corrupted line was skipped
                        print(f"[Warning] Corrupted JSON line encountered and skipped in {self.storage_path}.")
                        continue
        except FileNotFoundError:
            return None
        except Exception as e:
             raise RuntimeError(f"Unexpected error during log retrieval: {e}")
        
        return None

    def retrieve_all(self) -> List[Dict[str, Any]]:
        """Retrieves all sealed logs for full system audit, gracefully handling corruption."""
        logs: List[Dict[str, Any]] = []
        corrupted_lines = 0
        try:
            with open(self.storage_path, 'r', encoding='utf-8') as f:
                for line in f:
                    try:
                        logs.append(json.loads(line))
                    except json.JSONDecodeError:
                        corrupted_lines += 1
                        continue 
        except FileNotFoundError:
            pass 
        
        if corrupted_lines > 0:
            print(f"[Audit Warning] {corrupted_lines} corrupted log entries skipped during full retrieval.")
            
        return logs