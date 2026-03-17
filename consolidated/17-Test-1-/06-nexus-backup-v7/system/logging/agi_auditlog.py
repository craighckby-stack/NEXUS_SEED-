# AGI_AuditLog: Sovereign AGI V94.1 Tamper-Resistant Logging and Auditing
# Mandate: Provide secure, structured, and optionally signed logging channels for critical system components (like EPRU).
# Optimization v94.1: Implemented asynchronous logging via dedicated writer thread to minimize latency impact on core execution.

import json
import datetime
import threading
import sys
import atexit
import queue
from typing import Dict, Any, Optional
# from system.security.log_signer import LogSigner # Security Utility required

AUDIT_LOG_FILE = 'system/audit/core_log.jsonl'
QUEUE_TIMEOUT_SECONDS = 0.5
QUEUE_MAX_SIZE = 5000

class AGI_AuditLog:
    """
    Asynchronous, thread-safe, and tamper-ready audit logging utility.
    Handles instantiation using the Singleton pattern to ensure global writer infrastructure.
    """
    _instance = None
    _lock = threading.Lock()

    def __new__(cls, component_name: str = "CORE"):
        """Ensures the writer infrastructure (queue/thread) is only initialized once globally."""
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    # Initialize global infrastructure only on first instantiation
                    cls._log_queue = queue.Queue(maxsize=QUEUE_MAX_SIZE)
                    cls._stop_event = threading.Event()
                    
                    # Initialize and start the background writer thread
                    cls._writer_thread = threading.Thread(
                        target=cls._writer_daemon, 
                        daemon=True,
                        name="AGILogWriter"
                    )
                    cls._writer_thread.start()
                    
                    # Register shutdown hook
                    atexit.register(cls.shutdown_writer)
                    
                    # Create the actual instance
                    cls._instance = super(AGI_AuditLog, cls).__new__(cls)
                    # cls._instance.signer = LogSigner.get_instance() # Future signer integration
                    
        # Return the singleton instance, allowing instantiation component_name per logger instance
        instance = cls._instance
        instance.component_name = component_name
        return instance

    @classmethod
    def shutdown_writer(cls):
        """Called upon system shutdown (via atexit) to gracefully drain the log queue."""
        if not cls._stop_event.is_set():
            cls._stop_event.set()
            try:
                # Put a sentinel value to signal the daemon to exit after draining
                # This handles the case where the queue is empty when stop is set.
                cls._log_queue.put(None, timeout=1) 
            except queue.Full:
                pass 
            except queue.Timeout:
                 pass
                
            if cls._writer_thread.is_alive():
                # Wait briefly for the writer to finish
                cls._writer_thread.join(timeout=5)
                if cls._writer_thread.is_alive():
                    print("[CRITICAL] AGI Log Writer thread failed to terminate gracefully.", file=sys.stderr)

    @staticmethod
    def _prepare_entry(level: str, component: str, message: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Creates a standardized, time-stamped log entry."""
        return {
            "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
            "level": level,
            "component": component,
            "message": message,
            "context": context
        }

    def _sign_entry(self, entry: Dict[str, Any]) -> Dict[str, Any]:
        """
        [MANDATE HOOK] Applies cryptographic signing metadata to the entry.
        Requires the LogSigner component for full functionality.
        """
        # Placeholder implementation for integrity check readiness
        entry['signing_metadata'] = {
            'status': 'UNSIGNED_V94',
            'hash_type': 'SHA-256' # Added hash type readiness
        }
        # FUTURE: return self.signer.sign(entry)
        return entry

    @classmethod
    def _writer_daemon(cls):
        """Dedicated background thread responsible for dequeuing and persistent disk writing."""
        while not cls._stop_event.is_set() or not cls._log_queue.empty():
            try:
                # Use a short timeout to allow checking the stop event periodically
                log_entry = cls._log_queue.get(timeout=QUEUE_TIMEOUT_SECONDS)
                
                if log_entry is None and cls._stop_event.is_set():
                    # Sentinel received during shutdown, exit loop
                    break 
                
                if log_entry is None: 
                    # Should not happen unless put(None) was called without shutdown, treat as corruption
                    cls._log_queue.task_done()
                    continue
                    
                serialized_entry = json.dumps(log_entry) + '\n'
                
                # Critical IO operation
                try:
                    with open(AUDIT_LOG_FILE, 'a', encoding='utf-8') as f:
                        f.write(serialized_entry)
                except IOError as e:
                    # Fallback to stderr
                    print(f"[FATAL LOG WRITE DAEMON FAILURE] Persistence Error: {e} | Entry Sample={str(log_entry)[:80]}", file=sys.stderr)
                except Exception as e:
                    print(f"[FATAL LOG WRITE DAEMON FAILURE] Unexpected Error: {e}", file=sys.stderr)

                cls._log_queue.task_done()

            except queue.Empty:
                # Expected when the queue is idle, loops to check stop event.
                continue
            except Exception as e:
                # Safety net for general queue processing failure
                print(f"[FATAL LOG QUEUE FAILURE] Unexpected daemon error: {e}", file=sys.stderr)
                if cls._stop_event.is_set():
                    break

    def _submit_entry(self, level: str, message: str, context: Dict[str, Any] = {}) -> None:
        """Prepares the log entry (with component name) and submits it to the asynchronous queue."""
        
        # 1. Prepare and sign entry on the calling thread 
        # (Ensures quick timestamping and early signing, reducing queue payload variability)
        raw_entry = self._prepare_entry(level, self.component_name, message, context)
        signed_entry = self._sign_entry(raw_entry)
        
        # 2. Submit to queue (non-blocking)
        try:
            AGI_AuditLog._log_queue.put_nowait(signed_entry)
        except queue.Full:
            # Drop the log if the queue is full (prefer queue drop over blocking core execution)
            print(f"[WARNING LOG DROP] Log queue full. Component={self.component_name}, Level={level} | Message={message[:50]}...", file=sys.stderr)


    # Public logging interface methods

    def info(self, message: str, context: Dict[str, Any] = {}) -> None:
        self._submit_entry("INFO", message, context)

    def warning(self, message: str, context: Dict[str, Any] = {}) -> None:
        self._submit_entry("WARNING", message, context)

    def error(self, message: str, context: Dict[str, Any] = {}) -> None:
        self._submit_entry("ERROR", message, context)

    def critical(self, message: str, context: Dict[str, Any] = {}) -> None:
        self._submit_entry("CRITICAL", message, context)

    def audit(self, message: str, context: Dict[str, Any] = {}) -> None:
        """The audit channel must be used for forensic events (like EPRU ingestion)."""
        self._submit_entry("AUDIT", message, context)