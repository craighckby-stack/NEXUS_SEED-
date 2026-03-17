import os
import logging
from logging.handlers import RotatingFileHandler

# --- Central Logging Configuration Constants ---

LOG_BASE_DIR = os.environ.get('AGI_LOGS_DIR', 'logs')
os.makedirs(LOG_BASE_DIR, exist_ok=True)

# Core operational logs (highest importance, lower volume)
CORE_LOG_FILE = os.path.join(LOG_BASE_DIR, 'operational_core.log')
CORE_LOG_LEVEL = logging.INFO

# Debug/Audit logs (detailed internal workings)
AUDIT_LOG_FILE = os.path.join(LOG_BASE_DIR, 'audit_debug.log')
AUDIT_LOG_LEVEL = logging.DEBUG

# Log rotation policy
MAX_BYTES = 10 * 1024 * 1024  # 10 MB
BACKUP_COUNT = 5

def setup_rotating_file_handler(filepath: str, level: int) -> RotatingFileHandler:
    """Creates a RotatingFileHandler with standard rotation policy."""
    handler = RotatingFileHandler(
        filepath,
        maxBytes=MAX_BYTES,
        backupCount=BACKUP_COUNT,
        encoding='utf-8'
    )
    handler.setLevel(level)
    return handler

# Future implementation note: Integrate with structured_logger.py:
# In a central initialization script, use handlers defined here:
# from src.core.utils.structured_logger import JsonFormatter
# root_logger = logging.getLogger()
# root_logger.setLevel(logging.DEBUG)
# file_handler = setup_rotating_file_handler(CORE_LOG_FILE, CORE_LOG_LEVEL)
# file_handler.setFormatter(JsonFormatter())
# root_logger.addHandler(file_handler)
