import logging
import json
import datetime
from typing import Any, Dict, Set, Optional
import sys
import time

# --- Configuration Constants ---
# Standard Python LogRecord keys that should NOT be dumped into the 'context' dictionary.
# These keys represent the basic metadata fields handled separately.
STANDARD_LOG_KEYS: Set[str] = {
    'name', 'levelno', 'levelname', 'pathname', 'filename', 
    'module', 'lineno', 'funcName', 'created', 'asctime', 
    'msecs', 'relativeCreated', 'thread', 'threadName', 
    'process', 'processName', 'message', 'msg', 'args', 
    'exc_info', 'exc_text', 'stack_info', 'extra', 'v_info', 
    'sinfo', 'taskName', 'level', 'exc_value', 'exc_type', 'exc_traceback'
}

class JsonFormatter(logging.Formatter):
    """
    Formats log records as structured JSON strings.
    Maps fields to standard conventions (e.g., 'severity') and places all 
    custom 'extra' data into a dedicated 'context' object.
    """

    def format(self, record: logging.LogRecord) -> str:
        
        # 1. Base structured data
        # Using direct datetime conversion for high-precision ISO format, standard practice for JSON logs.
        timestamp = datetime.datetime.fromtimestamp(record.created).isoformat(timespec='milliseconds')
        
        log_data: Dict[str, Any] = {
            "timestamp": timestamp,
            "severity": record.levelname, # Standard field name in many centralized logging systems
            "service_name": record.name,
            "message": record.getMessage(),
            "severity_code": record.levelno,
            "source_location": {
                "file": record.filename,
                "line": record.lineno,
                "function": record.funcName,
                "module": record.module
            }
        }
        
        # 2. Trace and Error capture
        exception_data = {}
        if record.exc_info:
            # record.exc_info is a tuple (type, value, traceback)
            exc_type = record.exc_info[0]
            exc_value = record.exc_info[1]
            
            exception_data["type"] = exc_type.__name__ if exc_type else "UnknownException"
            exception_data["message"] = str(exc_value) if exc_value else "No error message."
            
            # formatException ensures standard traceback formatting
            exception_data["stack_trace"] = self.formatException(record.exc_info).strip()
        elif record.exc_text:
             exception_data["stack_trace"] = record.exc_text.strip()

        if exception_data:
            log_data["error"] = exception_data

        # 3. Context/Extra extraction: Capture all remaining attributes passed via `extra`
        context_data = {}
        for key, value in record.__dict__.items():
            # Filter standard keys, internal/private keys, and None values
            if key not in STANDARD_LOG_KEYS and not key.startswith('_') and value is not None:
                
                # Attempt robust serialization check; fallback to repr() if necessary
                try:
                    json.dumps(value) # Check if serializable
                    context_data[key] = value
                except (TypeError, OverflowError):
                    # Fallback for complex/non-JSON serializable objects
                    context_data[key] = repr(value)

        if context_data:
            log_data["context"] = context_data

        # 4. Final serialization
        try:
            return json.dumps(log_data)
        except TypeError:
            # Critical fallback: should only happen if the log_data structure itself is somehow corrupt
            fallback_msg = f"FATAL: Failed to serialize structured log for {record.name}. Original message snippet: {record.getMessage()[:100]}..."
            print(fallback_msg, file=sys.stderr)
            return json.dumps({
                "severity": "FATAL", 
                "message": fallback_msg, 
                "service_name": record.name
            })


def get_structured_logger(name: str, level: int = logging.INFO, handler: Optional[logging.Handler] = None) -> logging.Logger:
    """
    Initializes and returns a structured JSON logger for a module/service.

    Args:
        name: The name of the logger (usually __name__). 
        level: The minimum logging level to report. 
        handler: Optional custom handler (e.g., FileHandler or a proposed AsyncLogHandler).
                 Defaults to StreamHandler writing to stdout.
    """
    logger = logging.getLogger(name)
    logger.setLevel(level)
    
    # Prevent logs propagating to and duplicating setup in the root logger
    logger.propagate = False 

    # Only configure handlers if the logger has not been configured before (ensures idempotency)
    if not logger.handlers:
        # Default handler: standard output stream
        ch = handler if handler else logging.StreamHandler(sys.stdout)
        
        # Apply the structured JSON format
        ch.setFormatter(JsonFormatter())
        logger.addHandler(ch)
        
    return logger