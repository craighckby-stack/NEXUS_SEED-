import struct
import hashlib
import logging
import sys
import time

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')


class Message:
    # Define constant for checksum size for clarity
    CHECKSUM_SIZE = 64 # SHA256 hex string is 64 characters (32 bytes raw)
    
    def __init__(self, sender_id: str, recipient_id: str, message_type: str, payload: str, timestamp: float = None):
        self.sender_id = sender_id
        self.recipient_id = recipient_id
        self.message_type = message_type
        self.payload = payload
        # Use current time if not provided, ensuring consistency
        self.timestamp = timestamp if timestamp is not None else time.time()

    def serialize(self) -> bytes:
        sender_bytes = self.sender_id.encode('utf-8')
        recipient_bytes = self.recipient_id.encode('utf-8')
        message_type_bytes = self.message_type.encode('utf-8')
        payload_bytes = self.payload.encode('utf-8')

        # V94.1 Protocol Standard: Include precise timestamp (8 bytes, double)
        timestamp_bytes = struct.pack('>d', self.timestamp)
        
        # Header structure: | Timestamp (d) | L(sender) (I) | sender | L(recipient) (I) | recipient | L(type) (I) | type |
        header_data = struct.pack(
            f'>I{len(sender_bytes)}sI{len(recipient_bytes)}sI{len(message_type_bytes)}s',
            len(sender_bytes), sender_bytes, 
            len(recipient_bytes), recipient_bytes, 
            len(message_type_bytes), message_type_bytes
        )
        
        serialized_message_header = timestamp_bytes + header_data
        
        checksum = hashlib.sha256(payload_bytes).hexdigest()
        
        # Full message structure: Header + Payload Bytes + Checksum (64 ASCII bytes)
        serialized_message = serialized_message_header + payload_bytes + checksum.encode('ascii')
        return serialized_message

    @staticmethod
    def deserialize(serialized_message: bytes):
        offset = 0
        try:
            # 1. Read Timestamp (8 bytes float)
            if len(serialized_message) < offset + 8:
                 raise ValueError("Message truncated (missing timestamp)")
            timestamp = struct.unpack_from('>d', serialized_message, offset)[0]
            offset += 8
            
            # 2. Read Sender ID length and ID
            sender_id_len = struct.unpack_from('>I', serialized_message, offset)[0]
            offset += 4
            sender_id = serialized_message[offset:offset + sender_id_len].decode('utf-8')
            offset += sender_id_len

            # 3. Read Recipient ID length and ID
            recipient_id_len = struct.unpack_from('>I', serialized_message, offset)[0]
            offset += 4
            recipient_id = serialized_message[offset:offset + recipient_id_len].decode('utf-8')
            offset += recipient_id_len

            # 4. Read Message Type length and Type
            message_type_len = struct.unpack_from('>I', serialized_message, offset)[0]
            offset += 4
            message_type = serialized_message[offset:offset + message_type_len].decode('utf-8')
            offset += message_type_len
            
            # 5. Extract Payload and Checksum
            if len(serialized_message) < offset + Message.CHECKSUM_SIZE:
                 raise ValueError(f"Message too short (missing payload/checksum size: {Message.CHECKSUM_SIZE})")

            payload_bytes = serialized_message[offset:-Message.CHECKSUM_SIZE]
            checksum = serialized_message[-Message.CHECKSUM_SIZE:].decode('ascii')
            
            # 6. Verification
            expected_checksum = hashlib.sha256(payload_bytes).hexdigest()
            if checksum != expected_checksum:
                logging.warning("Checksum verification failed. Dropping message.")
                return None 
            
            payload = payload_bytes.decode('utf-8')
            
            # Return Message object, including the deserialized timestamp
            return Message(sender_id, recipient_id, message_type, payload, timestamp=timestamp)

        except struct.error as e:
            logging.error(f"Deserialization error (Struct Parse Failure): {e}")
            return None
        except Exception as e:
            logging.error(f"Deserialization error (General/Index): {e}")
            return None


def receive_warp_message(serialized_message: bytes):
    """
    Handles deserialization and basic validation of an incoming message stream.
    Requires Message class to be defined.
    """
    try:
        message = Message.deserialize(serialized_message)
        if message:
            logging.info(f"[WARP] Received message from {message.sender_id} (Type: {message.message_type}, Time: {message.timestamp:.2f}, Size: {sys.getsizeof(serialized_message)} bytes)")
            return message
        else:
            logging.warning("Warp message failed internal validation or checksum verification.")
            return None
    except Exception as e:
        logging.critical(f"Warp message receiving failed structurally: {type(e).__name__}: {e}")
        return None
