import time
import hashlib
import struct

class Message:
    def __init__(self, sender_id, recipient_id, message_type, payload):
        self.sender_id = sender_id
        self.recipient_id = recipient_id
        self.message_type = message_type
        self.payload = payload
        self.timestamp = time.time()

    def serialize(self):
        sender_bytes = self.sender_id.encode('utf-8')
        recipient_bytes = self.recipient_id.encode('utf-8')
        type_bytes = self.message_type.encode('utf-8')
        payload_bytes = self.payload.encode('utf-8')

        # Use digest for bytes checksum comparison
        checksum = hashlib.sha256(payload_bytes).digest()

        # Structure: L_sender (I) | sender_data | L_recipient (I) | recipient_data | L_type (I) | type_data
        header_format = f">I{len(sender_bytes)}sI{len(recipient_bytes)}sI{len(type_bytes)}s"
        
        header_data = struct.pack(
            header_format,
            len(sender_bytes), sender_bytes,
            len(recipient_bytes), recipient_bytes,
            len(type_bytes), type_bytes
        )
        
        # Final structure: Header + Payload + Checksum
        return header_data + payload_bytes + checksum

    @staticmethod
    def deserialize(serialized_message):
        if not serialized_message or len(serialized_message) < 32 + 12:
            # Minimum size check (3 Length prefixes + 32 byte checksum)
            print("Deserialization failed: Message too short.")
            return None
            
        offset = 0
        
        try:
            # 1. Read SENDER ID
            sender_id_len = struct.unpack('>I', serialized_message[offset:offset+4])[0]
            offset += 4
            sender_id = serialized_message[offset:offset + sender_id_len].decode('utf-8')
            offset += sender_id_len

            # 2. Read RECIPIENT ID
            recipient_id_len = struct.unpack('>I', serialized_message[offset:offset+4])[0]
            offset += 4
            recipient_id = serialized_message[offset:offset + recipient_id_len].decode('utf-8')
            offset += recipient_id_len

            # 3. Read MESSAGE TYPE
            message_type_len = struct.unpack('>I', serialized_message[offset:offset+4])[0]
            offset += 4
            message_type = serialized_message[offset:offset + message_type_len].decode('utf-8')
            offset += message_type_len
            
        except (struct.error, IndexError) as e:
            print(f"Deserialization error parsing header: {e}")
            return None

        # 4. Read PAYLOAD and CHECKSUM
        if len(serialized_message) < offset + 32: # Check if remaining data is less than minimum checksum size
            print("Deserialization failed: Insufficient space for checksum.")
            return None
            
        payload_data = serialized_message[offset:-32]
        checksum_received = serialized_message[-32:]

        # 5. Verification
        expected_checksum = hashlib.sha256(payload_data).digest()
        
        if checksum_received != expected_checksum:
            print("Checksum verification failed!")
            return None
            
        payload = payload_data.decode('utf-8')
        
        return Message(sender_id, recipient_id, message_type, payload)

class CryptoExchange:
    def __init__(self):
        self.api_keys = {}
        self.btc_balance = {}
        self.vulnerabilities = {}
        self.user_id_counter = 0

    def generate_api_key(self, user_id):
        # Implementation placeholder
        pass

# --- Orchestration and Test Initialization (Replacing orphaned code) ---

# 1. Define required variable for execution context
sender_id_test = "SOV_AGI_V94"
recipient_id_test = "CryptoExchange001"

# 2. Create and serialize a test message
original_message = Message(
    sender_id=sender_id_test,
    recipient_id=recipient_id_test,
    message_type="COMMAND_PING",
    payload='{"instruction": "verify_protocol_integrity"}'
)

serialized_message_test = original_message.serialize()

# 3. Attempt deserialization and processing
try:
    message = Message.deserialize(serialized_message_test)
    if message:
        # Updated print statement to use deserialized attributes
        print(f"Received warp message from {message.sender_id} to {message.recipient_id} (Type: {message.message_type})")
        # Simulating dimension/context handling from original print
    else:
        print("Warp message failed to deserialize.")
except Exception as e:
    print(f"Warp message receiving failed: {e}")