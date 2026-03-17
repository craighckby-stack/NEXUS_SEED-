import logging
import sys

def get_logger(name: str, level=logging.INFO):
    """
    Standardized logger setup for DSE system components.
    Ensures consistent formatting and handling for component output.
    """
    
    logger = logging.getLogger(name)
    logger.setLevel(level)

    if not logger.handlers:
        # Standard console output handler
        ch = logging.StreamHandler(sys.stdout)
        ch.setLevel(logging.DEBUG)

        # Standardized formatter
        formatter = logging.Formatter(
            '[%(asctime)s | %(levelname)s | %(name)s] %(message)s',
            datefmt='%Y-%m-%dT%H:%M:%S%z'
        )

        ch.setFormatter(formatter)
        logger.addHandler(ch)

    return logger
