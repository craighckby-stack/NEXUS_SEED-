from __future__ import annotations
import json
import datetime
import threading
import sys
import atexit
import queue
from typing import Dict, Any, NamedTuple, List

# from system.security.log_signer import LogSigner # Security Utility required

AUDIT_LOG_FILE = 'system/audit/core_log.jsonl'
QUEUE_TIMEOUT_SECONDS = 0.05  # Reduced timeout for faster thread responsiveness
QUEUE_MAX_SIZE = 5000
IO_BATCH_SIZE = 50          # Optimization: Batch size for IO buffer flushing

class LogRecord(NamedTuple):
    """Abstracted, immutable structure for log data passing, optimizing queue transit efficiency.
    NamedTuples offer faster attribute access and reduced overhead compared to dictionaries.
    """
    timestamp: str
    level: str
    component: str
    message: str
    context: Dict[str, Any]
    signing_metadata: Dict[str, Any]

    def serialize(self) -> str:
        """Optimized serialization function attached to the structure."""
        # Serializes the LogRecord directly using its dictionary representation
        return json.dumps(self._asdict()) + '\n'

class AGI_AuditLog:
    """
    Asynchronous, thread-safe, audit logging utility optimized for high-throughput.
    Implements the Singleton pattern to centralize the asynchronous writer infrastructure.
    Computational Optimization Focus: IO batching and lightweight LogRecord structures.
    """
    _instance: AGI_AuditLog | None = None
    _lock = threading.Lock()
    
    # Global Infrastructure Components (Class-level)
    _log_queue: queue.Queue[LogRecord | None]
    _stop_event: threading.Event
    _writer_thread: threading.Thread

    def __new__(cls, component_name: str = "CORE") -> AGI_AuditLog:
        """Ensures the writer infrastructure (queue/thread) is only initialized once globally."""
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    # Initialize global, shared infrastructure
                    cls._log_queue = queue.Queue(maxsize=QUEUE_MAX_SIZE)
                    cls._stop_event = threading.Event()
                    
                    cls._writer_thread = threading.Thread(
                        target=cls._writer_daemon, 
                        daemon=True,
                        name="AGILogWriter"
                    )
                    cls._writer_thread.start()
                    
                    # Register shutdown hook
                    atexit.register(cls.shutdown_writer)
                    
                    # Create the actual singleton instance
                    cls._instance = super().__new__(cls)
                    # cls._instance.signer = LogSigner.get_instance() # Future signer integration
                    
        instance = cls._instance
        # Allow component name to be instance-specific for calling convenience
        instance.component_name = component_name
        return instance

    @classmethod
    def shutdown_writer(cls) -> None:
        """Called upon system shutdown to gracefully drain the log queue and stop the daemon."""
        if hasattr(cls, '_stop_event') and not cls._stop_event.is_set():
            cls._stop_event.set()
            try:
                # Put sentinel to ensure the daemon wakes up and sees the stop flag, even if queue is empty.
                cls._log_queue.put(None, timeout=1)
            except (queue.Full, queue.Timeout): 
                pass 
                
            if cls._writer_thread.is_alive():
                cls._writer_thread.join(timeout=5)
                if cls._writer_thread.is_alive():
                    print("[CRITICAL] AGI Log Writer thread failed to terminate gracefully.", file=sys.stderr)

    @staticmethod
    def _prepare_entry(level: str, component: str, message: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Creates a standardized, time-stamped log entry structure (Dict)."""
        return {
            "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
            "level": level,
            "component": component,
            "message": message,
            "context": context
        }

    def _sign_entry(self, entry: Dict[str, Any]) -> Dict[str, Any]:
        """[MANDATE HOOK] Applies cryptographic signing metadata (Placeholder)."""
        entry['signing_metadata'] = {
            'status': 'UNSIGNED_V94',
            'hash_type': 'SHA-256'
        }
        # FUTURE: return self.signer.sign(entry)
        return entry

    @classmethod
    def _writer_daemon(cls) -> None:
        """Dedicated background thread implementing efficient IO batching to reduce syscall overhead."""
        buffer: List[str] = []
        
        def flush_buffer() -> None:
            """Writes accumulated lines to disk in a single IO operation."""
            if not buffer:
                return
            
            payload = "".join(buffer)
            try:
                with open(AUDIT_LOG_FILE, 'a', encoding='utf-8') as f:
                    f.write(payload)
                buffer.clear()
            except IOError as e:
                print(f"[FATAL LOG WRITE DAEMON FAILURE] Persistence Error: {e} | Buffer Size={len(payload)}", file=sys.stderr)
            except Exception as e:
                print(f"[FATAL LOG WRITE DAEMON FAILURE] Unexpected Error during IO: {e}", file=sys.stderr)

        
        while True:
            pulled_count = 0
            # Phase 1: Aggressive, non-blocking drain to fill the IO batch buffer
            while pulled_count < IO_BATCH_SIZE:
                try:
                    record: LogRecord | None = cls._log_queue.get_nowait()
                    if record is None:
                        cls._log_queue.task_done()
                        if cls._stop_event.is_set():
                            break # Exit inner loop
                        continue
                        
                    buffer.append(record.serialize())
                    cls._log_queue.task_done()
                    pulled_count += 1
                except queue.Empty:
                    break # Queue is empty, proceed to check stop condition or wait
                except Exception as e:
                    print(f"[FATAL LOG QUEUE FAILURE] Error processing record: {e}", file=sys.stderr)

            # Phase 2: Conditional Flush
            if pulled_count > 0 and len(buffer) >= IO_BATCH_SIZE:
                flush_buffer()

            # Phase 3: Controlled Blocking Wait or Exit Check
            if cls._stop_event.is_set():
                # Shutdown sequence: Ensure final queue items are drained and flushed
                if not cls._log_queue.empty() or buffer:
                    flush_buffer() # Flush any remaining buffer contents
                    if cls._log_queue.empty() and not buffer:
                        break # Successful exit
                else:
                    break # Successful exit
            
            if cls._log_queue.empty():
                # If queue is empty and not shutting down, block briefly to wait for new data
                try:
                    record_wait = cls._log_queue.get(timeout=QUEUE_TIMEOUT_SECONDS)
                    if record_wait is not None:
                        buffer.append(record_wait.serialize())
                        cls._log_queue.task_done()
                    elif record_wait is None and cls._stop_event.is_set():
                        cls._log_queue.task_done()
                except queue.Empty:
                    pass # Loop iteration ends, checks stop condition again

    def _submit_entry(self, level: str, message: str, context: Dict[str, Any] = {}) -> None:
        """Prepares, signs, and submits the entry using the efficient LogRecord abstraction."""
        
        # 1. Preparation and Signing (on calling thread for timely metadata generation)
        raw_entry = self._prepare_entry(level, self.component_name, message, context)
        signed_dict = self._sign_entry(raw_entry)
        
        # 2. Recursive Abstraction: Convert mutable Dict to Immutable/Efficient LogRecord NamedTuple
        log_record = LogRecord(**signed_dict) 
        
        # 3. Submission (non-blocking)
        try:
            self._log_queue.put_nowait(log_record)
        except queue.Full:
            # Drop log entry if queue is full to ensure zero latency impact on core execution
            print(f"[WARNING LOG DROP] Log queue full. Component={self.component_name}, Level={level} | Message={message[:50]}...", file=sys.stderr)


    # Public logging interface methods (Simplified abstraction layer)

    def info(self, message: str, context: Dict[str, Any] = {}) -> None:
        self._submit_entry("INFO", message, context)

    def warning(self, message: str, context: Dict[str, Any] = {}) -> None:
        self._submit_entry("WARNING", message, context)

    def error(self, message: str, context: Dict[str, Any] = {}) -> None:
        self._submit_entry("ERROR", message, context)

    def critical(self, message: str, context: Dict[str, Any] = {}) -> None:
        self._submit_entry("CRITICAL", message, context)

    def audit(self, message: str, context: Dict[str, Any] = {}) -> None:
        self._submit_entry("AUDIT", message, context)
