import hashlib
import logging
import hmac
from typing import Union, Optional

logger = logging.getLogger(__name__)

class IntegrityHashValidator:
    """
    Validates the integrity hash of input content (GSEP L0 payloads or local files).

    This utility ensures payload integrity before resource-intensive decoding/processing.
    It supports pluggable hashing algorithms and uses cryptographically secure comparison.
    """

    def __init__(self, algorithm: str = 'sha256'):
        """
        Initializes the validator with a specified hashing algorithm.

        :param algorithm: The hashlib-supported algorithm name (e.g., 'sha256', 'sha512').
        """
        self.algorithm = algorithm.lower()
        
        # Pre-check if the algorithm is supported
        if self.algorithm not in hashlib.algorithms_available:
            logger.critical(
                f"Configured hash algorithm '{algorithm}' is not available in system hashlib. "
                "Validation attempts will likely fail."
            )
        
    def _calculate_hash(self, content_data: bytes) -> Optional[bytes]:
        """Calculates the hash digest based on the configured algorithm, returning bytes."""
        try:
            h = hashlib.new(self.algorithm, content_data)
            return h.digest() 
        except ValueError as e:
            logger.critical(f"Hash calculation failed due to unsupported algorithm '{self.algorithm}': {e}")
            return None

    def validate_hash(self, content: Union[str, bytes], expected_hash_hex: str) -> bool:
        """
        Compares the generated hash of the content against the expected hash.

        :param content: The raw data (str or bytes) to be validated. If str, encoded as UTF-8.
        :param expected_hash_hex: The expected hash digest represented as a hexadecimal string.
        :return: True if the hashes match securely, False otherwise.
        """
        if not content or not expected_hash_hex:
            logger.warning("Attempted integrity validation with missing content or expected hash.")
            return False

        if isinstance(content, str):
            content_bytes = content.encode('utf-8')
        else:
            content_bytes = content
            
        calculated_digest_bytes = self._calculate_hash(content_bytes)

        if calculated_digest_bytes is None:
            return False

        try:
            # Convert expected hex string to bytes for cryptographic comparison
            expected_digest_bytes = bytes.fromhex(expected_hash_hex)
        except ValueError:
            logger.error(f"Expected hash '{expected_hash_hex}' is not a valid hex string.")
            return False

        # Use hmac.compare_digest for constant-time comparison (timing attack mitigation)
        if hmac.compare_digest(calculated_digest_bytes, expected_digest_bytes):
            logger.debug(f"Payload integrity verified using {self.algorithm}.")
            return True
        else:
            logger.error(
                f"[HASH MISMATCH:{self.algorithm}] "
                f"Expected: {expected_hash_hex[:12]}..., Calculated: {calculated_digest_bytes.hex()[:12]}..."
            )
            logger.debug(
                f"Full comparison failure. Calc: {calculated_digest_bytes.hex()}, Exp: {expected_hash_hex}"
            )
            return False
