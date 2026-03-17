import logging
import sys

def configure_system_logging(level=logging.INFO):
    """Sets up basic, consistent logging across the entire system."""
    # Define format: Timestamp | Level | Logger Name | Message
    log_format = '%(asctime)s | %(levelname)-8s | %(name)s | %(message)s'
    
    # Use basicConfig to set up the root logger
    logging.basicConfig(
        level=level,
        format=log_format,
        datefmt='%Y-%m-%d %H:%M:%S',
        stream=sys.stdout
    )
    
    # Optional: Set forensic loggers (like SecureLogRepository) to warning or critical to ensure visibility
    logging.getLogger('core.persistence.secure_log_repository').setLevel(logging.WARNING)
    
    logging.info("System logging initialized at level: %s", logging.getLevelName(level))

# Example usage in main application startup:
# from core.utils.logging_setup import configure_system_logging
# configure_system_logging(level=logging.INFO)
