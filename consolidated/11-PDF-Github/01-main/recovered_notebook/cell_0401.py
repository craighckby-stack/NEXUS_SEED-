import hashlib
import hmac
import json
import os
import struct
import base64
import secrets
from typing import Dict, Optional, Tuple

# --- Core Exchange Logic ---

class CryptoExchange:
    def __init__(self):
        # Key: API Key (Public), Value: API Secret (Private)
        self.api_keys: Dict[str, str] = {}
        # Key: api_key, Value: BTC balance
        self.btc_balance: Dict[str, float] = {}
        self.vulnerabilities: Dict[str, str] = {}
        self.user_id_counter: int = 0

    def generate_api_key(self, user_id: int) -> Tuple[str, str]:
        """Generate a new, cryptographically secure API key and secret for a given user ID.
        Uses standard crypto libraries for robust key generation.
        """
        self.user_id_counter += 1
        # Key: 32 bytes, base64 encoded
        api_key: str = base64.b64urlsafe_encode(secrets.token_bytes(24)).decode('utf-8').rstrip('=')
        # Secret: 48 bytes, base64 encoded (suitable for HMAC-SHA256)
        api_secret: str = base64.b64urlsafe_encode(secrets.token_bytes(32)).decode('utf-8').rstrip('=')
        
        self.api_keys[api_key] = api_secret
        self.btc_balance[api_key] = 0.0
        return api_key, api_secret

    def _generate_signature(self, api_secret: str, payload_data: Dict) -> str:
        """Helper function to generate HMAC signature for request integrity checking."""
        # Ensure payload is canonicalized (sorted keys) for consistent signing
        payload_str = json.dumps(payload_data, sort_keys=True, separators=(',', ':'))
        
        signer = hmac.new(
            api_secret.encode('utf-8'), 
            payload_str.encode('utf-8'), 
            hashlib.sha256
        )
        return signer.hexdigest()

    def authenticate_request(self, api_key: str, signature: str, payload: Dict) -> Optional[str]:
        """Verifies the signature against the stored secret using constant-time comparison."""
        if api_key not in self.api_keys:
            return None # Invalid Key

        api_secret = self.api_keys[api_key]
        expected_signature = self._generate_signature(api_secret, payload)
        
        # Constant-time comparison prevents timing attacks
        if hmac.compare_digest(signature, expected_signature):
            return api_key # Authentication successful
        else:
            return None # Invalid Signature

    def buy(self, symbol: str, amount: float, api_key: str, signature: str) -> bool:
        """Buy an asset, requires valid API key and HMAC signature verification."""
        if amount <= 0:
            return False
            
        request_payload = {"symbol": symbol, "amount": amount, "action": "buy"}
        auth_key = self.authenticate_request(api_key, signature, request_payload)
        
        if auth_key:
            # Use .get() defensively, although balance should exist after key generation
            self.btc_balance[api_key] = self.btc_balance.get(api_key, 0.0) + amount
            return True
        return False

    def sell(self, symbol: str, amount: float, api_key: str, signature: str) -> bool:
        """Sell an asset, requires valid API key and HMAC signature verification."""
        if amount <= 0:
            return False
            
        request_payload = {"symbol": symbol, "amount": amount, "action": "sell"}
        auth_key = self.authenticate_request(api_key, signature, request_payload)
        
        if auth_key:
            current_balance = self.btc_balance.get(api_key, 0.0)
            if current_balance >= amount:
                self.btc_balance[api_key] -= amount
                return True
        return False

    def simulate_api_vulnerability(self, api_key: Optional[str] = None, exploit_type: str = "api_key_leak") -> bool:
        """Simulate an API vulnerability, logging the potential exploit type."""
        self.vulnerabilities[exploit_type] = f"Triggered on key: {api_key}" if api_key else "Generic"
        return True

    def patch_vulnerability(self) -> bool:
        """Patch and clear simulated vulnerabilities."""
        self.vulnerabilities.clear()
        return True

    def brute_force_api_key(self, target_agent_id: int) -> bool:
        """Placeholder for brute-force simulation or defense implementation."""
        return True

# --- Communication Protocol (Binary/Legacy System) ---

class ProtocolMessage:
    """Represents a low-level binary protocol message structure."""
    def __init__(self, sender_id: int, recipient_id: int, message_type: str, payload: str):
        self.sender_id: int = sender_id
        self.recipient_id: int = recipient_id
        self.message_type: str = message_type
        self.payload: str = payload

def serialize_message(message: ProtocolMessage) -> bytes:
    """Serialize a Message object into a binary format (added for completeness)."""
    if len(message.message_type) != 1:
        raise ValueError("message_type must be a single character for this protocol.")
        
    header = struct.pack('ii', message.sender_id, message.recipient_id)
    type_byte = message.message_type.encode('ascii')
    payload_bytes = message.payload.encode('utf-8')
    
    return header + type_byte + payload_bytes

def deserialize_message(message_bytes: bytes) -> Optional[ProtocolMessage]:
    """Deserialize a message from bytes using a fixed header format.
    Header format: 4 bytes Sender ID, 4 bytes Recipient ID, 1 byte Message Type.
    """
    HEADER_SIZE = 9
    if len(message_bytes) < HEADER_SIZE:
        print("Deserialization error: Message too short.")
        return None
        
    try:
        sender_id, recipient_id = struct.unpack('ii', message_bytes[:8])
        message_type: str = message_bytes[8:9].decode('ascii')
        payload: str = message_bytes[9:].decode('utf-8')
        return ProtocolMessage(sender_id, recipient_id, message_type, payload)
    except (struct.error, UnicodeDecodeError) as e:
        print(f"Deserialization error: {e}")
        return None

# --- Example Usage (Updated for secure protocol) ---
exchange: CryptoExchange = CryptoExchange()

# 1. Generate secure keys
USER_ID = 1001
api_key, api_secret = exchange.generate_api_key(USER_ID)

# 2. Prepare and sign a BUY request
buy_payload = {"symbol": "BTC", "amount": 10.0, "action": "buy"}
# Input used for signing must be canonicalized (sorted keys)
signature_input = json.dumps(buy_payload, sort_keys=True, separators=(',', ':'))

# Generate signature (client side action)
buy_signature = hmac.new(
    api_secret.encode('utf-8'), 
    signature_input.encode('utf-8'), 
    hashlib.sha256
).hexdigest()

# 3. Execute the authenticated transaction
success_buy = exchange.buy("BTC", 10.0, api_key, buy_signature)
# print(f"Buy Success: {success_buy}. Balance: {exchange.btc_balance.get(api_key)}")

# 4. Prepare and sign a SELL request
sell_payload = {"symbol": "BTC", "amount": 5.0, "action": "sell"}
sell_signature_input = json.dumps(sell_payload, sort_keys=True, separators=(',', ':'))

sell_signature = hmac.new(
    api_secret.encode('utf-8'), 
    sell_signature_input.encode('utf-8'), 
    hashlib.sha256
).hexdigest()

success_sell = exchange.sell("BTC", 5.0, api_key, sell_signature)
# print(f"Sell Success: {success_sell}. Balance: {exchange.btc_balance.get(api_key)}")

exchange.simulate_api_vulnerability(api_key, exploit_type="timing_attack_simulated")
exchange.patch_vulnerability()

# Binary message handling (legacy/internal protocol)
message: ProtocolMessage = ProtocolMessage(1, 2, "T", "Hello, secure world!")
message_bytes: bytes = serialize_message(message)
deserialized_message: Optional[ProtocolMessage] = deserialize_message(message_bytes)

# if deserialized_message:
#     print(f"Deserialized message payload: {deserialized_message.payload}")