import json
import os
from typing import Dict, Any, List

class TEDSWriteError(Exception):
    """Raised on failure to write to the persistent log."""
    pass

class TEDSFilePersistenceHandler:
    """
    Manages secure, append-only writing to the TEDS log file using JSONL (JSON Lines),
    providing true persistence and sequence resumption capabilities.
    """
    
    def __init__(self, log_file_path: str):
        self.log_file_path = log_file_path
        self._initialize_file()
        self._load_existing_events()

    def _initialize_file(self):
        """Ensures the log file exists and is writable."""
        if not os.path.exists(self.log_file_path):
            try:
                # Create empty file
                with open(self.log_file_path, 'w') as f:
                    pass 
            except IOError as e:
                raise TEDSWriteError(f"Cannot initialize TEDS log file at {self.log_file_path}: {e}")

    def _load_existing_events(self) -> None:
        """Loads existing committed events to correctly set the sequence ID for the sink."""
        self.events: List[Dict[str, Any]] = []
        if os.path.getsize(self.log_file_path) > 0:
            try:
                with open(self.log_file_path, 'r') as f:
                    for line in f:
                        if line.strip():
                            self.events.append(json.loads(line))
            except json.JSONDecodeError as e:
                # Critical corruption detected
                raise TEDSWriteError(f"TEDS log corruption detected during load: {e}")
            except IOError as e:
                raise TEDSWriteError(f"Error reading TEDS log: {e}")

    # --- Interface Implementation for TEDSEventSink ---
    
    def append(self, record: Dict[str, Any]) -> None:
        """Appends a new record to the persistent log and updates in-memory cache."""
        try:
            # 1. Persistent write (atomic append)
            with open(self.log_file_path, 'a', encoding='utf-8') as f:
                f.write(json.dumps(record) + '\n')
            
            # 2. In-memory update (after successful disk write)
            self.events.append(record)
            
        except IOError as e:
            raise TEDSWriteError(f"Failed to append record to TEDS log file: {e}")

    def __len__(self) -> int:
        return len(self.events)

    def __getitem__(self, index: int) -> Dict[str, Any]:
        return self.events[index]

    def get_all_events(self) -> List[Dict[str, Any]]:
        """Returns the full in-memory cache of events."""
        return self.events