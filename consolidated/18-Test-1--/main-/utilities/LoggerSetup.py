import logging
import sys

def setup_root_logger(level=logging.INFO):
    """
    Sets up a standardized root logger configuration necessary for AGI operational stability.
    This ensures consistent timestamping and structured output across all modules.
    """
    # Prevent duplicate handlers on re-setup
    if logging.root.handlers:
        return

    # Use ISO 8601 compatible format for easy parsing/sorting
    formatter = logging.Formatter(
        '{ "time": "%(asctime)s", "level": "%(levelname)s", "name": "%(name)s", "module": "%(module)s", "message": "%(message)s"}',
        datefmt='%Y-%m-%dT%H:%M:%S%z'
    )
    
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(level)
    handler.setFormatter(formatter)
    
    root = logging.getLogger()
    root.setLevel(level)
    root.addHandler(handler)
    
    root.info("System root logging initialized.")

# Call this once at application startup:
# setup_root_logger(logging.DEBUG)
