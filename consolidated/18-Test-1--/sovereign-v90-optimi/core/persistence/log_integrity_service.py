from typing import Tuple
from pathlib import Path
import json

class LogIntegrityService:
    """A dedicated service for verifying the consistency and structural integrity of JSONL forensic logs.
       This utility is designed to run periodically to detect silent log file corruption.
    """

    def __init__(self, log_repository_path: Path | str):
        self.log_path = Path(log_repository_path)

    def verify_integrity(self) -> Tuple[bool, int]:
        """Reads the entire log file and checks JSON validity for every line.

        Returns:
            Tuple[bool, int]: (is_file_healthy, count_corrupted_lines)
        """
        if not self.log_path.exists():
            print(f"[Integrity Check] Log file not found at {self.log_path}.")
            return True, 0

        total_lines = 0
        corrupted_lines = 0

        print(f"[Integrity Check] Starting verification of {self.log_path}...")

        try:
            with open(self.log_path, 'r', encoding='utf-8') as f:
                for line in f:
                    total_lines += 1
                    try:
                        json.loads(line)
                    except json.JSONDecodeError:
                        corrupted_lines += 1
                        print(f"  -> Corruption detected at line {total_lines}.")

        except Exception as e:
            # Catch file read errors
            print(f"[CRITICAL] Cannot read log file for verification: {e}")
            return False, 0 

        if corrupted_lines > 0:
            print(f"[FAILURE] Verification complete. Found {corrupted_lines} corrupted out of {total_lines} lines.")
            return False, corrupted_lines
        else:
            print(f"[SUCCESS] Verification complete. All {total_lines} lines are structurally valid.")
            return True, 0
