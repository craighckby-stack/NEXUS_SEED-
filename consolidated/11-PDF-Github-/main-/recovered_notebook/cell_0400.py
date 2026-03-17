import time
import hashlib
import struct

# NOTE: This function requires `self.wormholes` defined in the containing class.
def receive_warp_message(self, sender_id, recipient_id, target_dimension, serialized_message):
    if recipient_id not in self.wormholes or target_dimension not in self.wormholes[recipient_id]:
        print("Wormhole does not exist for receiving.")
        return None
    try:
        message = Message.deserialize(serialized_message)
        if message:
            # FIXED: Correctly display target_dimension and close parenthesis
            print(f"Received warp message from {sender_id} targeting {recipient_id} in dimension {target_dimension}.")
            return message
        else:
            print("Warp message failed to deserialize.")
            return None
    except Exception as e:
        # Catching deserialization issues more generally, though the class handles specific errors.
        print(f"Warp message receiving failed unexpectedly: {e}")
        return None

class Message:
    def __init__(self, sender_id, recipient_id, message_type, payload):
        self.sender_id = sender_id
        self.recipient_id = recipient_id
        self.message_type = message_type
        self.payload = payload
        self.timestamp = time.time()

    def serialize(self):
        sender_id_bytes = self.sender_id.encode('utf-8')
        recipient_id_bytes = self.recipient_id.encode('utf-8')
        message_type_bytes = self.message_type.encode('utf-8')
        payload_bytes = self.payload.encode('utf-8')
        
        # Standardized checksum (32 bytes raw SHA256 digest)
        checksum_bytes = hashlib.sha256(payload_bytes).digest()

        # Protocol: [4b LEN] [DATA] * 4 fields + [32b CHECKSUM]
        format_str = (f'>I{len(sender_id_bytes)}s'  # Sender ID
                      f'I{len(recipient_id_bytes)}s' # Recipient ID
                      f'I{len(message_type_bytes)}s' # Type
                      f'I{len(payload_bytes)}s'    # Payload
                      f'32s')                       # Checksum
        
        serialized_message = struct.pack(
            format_str,
            len(sender_id_bytes), sender_id_bytes,
            len(recipient_id_bytes), recipient_id_bytes,
            len(message_type_bytes), message_type_bytes,
            len(payload_bytes), payload_bytes,
            checksum_bytes
        )
        return serialized_message

    @staticmethod
    def _read_variable_field_bytes(data, offset):
        # Helper to read N bytes prefixed by a 4-byte length indicator (raw bytes)
        if len(data) < offset + 4:
            raise ValueError("Buffer too short to read length prefix.")
        length, = struct.unpack_from('>I', data, offset)
        offset += 4
        
        if length < 0 or length > len(data) - offset: # Basic sanity check
            raise ValueError(f"Invalid length declared: {length}")

        data_bytes, = struct.unpack_from(f'{length}s', data, offset)
        offset += length
        
        return data_bytes, offset

    @staticmethod
    def deserialize(serialized_message):
        if not serialized_message or len(serialized_message) < 48: # Minimum size check (16 bytes headers + 32 bytes checksum)
            print("Input message too short.")
            return None
            
        try:
            offset = 0
            
            # 1. Read Sender ID (Bytes and Decode)
            sender_id_bytes, offset = Message._read_variable_field_bytes(serialized_message, offset)
            sender_id = sender_id_bytes.decode('utf-8')
            
            # 2. Read Recipient ID (Bytes and Decode)
            recipient_id_bytes, offset = Message._read_variable_field_bytes(serialized_message, offset)
            recipient_id = recipient_id_bytes.decode('utf-8')

            # 3. Read Message Type (Bytes and Decode)
            message_type_bytes, offset = Message._read_variable_field_bytes(serialized_message, offset)
            message_type = message_type_bytes.decode('utf-8')

            # 4. Read Payload (Raw bytes, needed for checksum calculation)
            payload_bytes, offset = Message._read_variable_field_bytes(serialized_message, offset)
            payload = payload_bytes.decode('utf-8')
            
            # 5. Read Checksum (fixed 32 bytes)
            CHECKSUM_SIZE = 32
            if len(serialized_message) < offset + CHECKSUM_SIZE:
                raise ValueError("Buffer terminated unexpectedly before checksum.")
                
            received_checksum, = struct.unpack_from(f'>32s', serialized_message, offset)
            offset += CHECKSUM_SIZE
            
            # Check for trailing data
            if offset != len(serialized_message):
                print(f"Warning: Trailing data detected ({len(serialized_message) - offset} bytes). Discarding.")
            
            # 6. Verification
            expected_checksum = hashlib.sha256(payload_bytes).digest()
            if received_checksum != expected_checksum:
                print("Checksum verification failed! Data integrity compromised.")
                return None
            
            return Message(sender_id, recipient_id, message_type, payload)
            
        except (struct.error, ValueError, IndexError) as e:
            print(f"Deserialization protocol error: {e}")
            return None