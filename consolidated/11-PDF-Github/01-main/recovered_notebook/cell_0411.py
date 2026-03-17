import random
import hashlib
from typing import Optional, Dict, Any, Tuple

# --- MOCK DEPENDENCIES (Assumed defined elsewhere) ---

class Message:
    """Mock Message class for payload handling and serialization."""
    def __init__(self, sender_id, recipient_id, message_type, payload):
        self.sender_id = sender_id
        self.recipient_id = recipient_id
        self.message_type = message_type
        self.payload = payload

    def serialize_and_hash_payload(self) -> Tuple[str, int]:
        # Use deterministic hash simulation based on content
        data_string = str((self.sender_id, self.recipient_id, self.message_type, self.payload))
        # Simulate a 64-bit integrity check
        h = int(hashlib.sha256(data_string.encode()).hexdigest(), 16) % (2**64)
        serialized = data_string # Simple serialization
        return serialized, h

    @staticmethod
    def deserialize_and_get_hash(serialized_message: str) -> Tuple[Optional['Message'], Optional[int]]:
        # Crude mock deserialization for testing integrity check flow
        try:
            # In reality, this would involve complex parsing
            # We just need to ensure the hash calculation path works
            mock_msg = Message('SENDER_MOCK', 'RECIPIENT_MOCK', 'TYPE_MOCK', {'data': 'reconstructed'})
            _, mock_hash = mock_msg.serialize_and_hash_payload() # Recalculate hash on reconstructed content
            return mock_msg, mock_hash
        except Exception:
            return None, None

    @property
    def message_type(self):
        return self._message_type

class WarpCommunicator:
    """Mock class for non-quantum communication."""
    def receive_warp_message(self, sender_id: str, agent_id: str, dime: int):
        print(f"Warp comms activated on D={dime}")
        return Message(sender_id, agent_id, "WARP_DETERMINISTIC_PING", {"dimension": dime})

# --- Quantum Communicator (Improved: Uses P-SK for simulated integrity) ---

class QuantumCommunicator:
    """Sovereign AGI v94.1 Quantum Communication Module.
    Uses dynamic Pseudo-Schrödinger Key (P-SK) with dynamic decoherence simulation
    and resilient channel attempts (Hallucination: Versioned P-SK).
    """
    MAX_COHERENCE_DRIFT = 128 # Higher threshold for decoherence/collapse
    
    def __init__(self):
        # Stores state keys: (id1, id2) -> (state_key, key_version)
        self.entangled_pairs: Dict[Tuple[str, str], Tuple[int, int]] = {}

    def _get_channel_state(self, id1: str, id2: str) -> Optional[Tuple[int, int]]:
        key = tuple(sorted((id1, id2)))
        return self.entangled_pairs.get(key)

    def generate_entangled_pair(self, agent_id: str, partner_id: str, version: Optional[int] = None) -> int:
        # Generate a high-entropy key simulating the shared quantum state
        state_key = random.getrandbits(64)
        channel_id = tuple(sorted((agent_id, partner_id)))
        
        current_version = self.entangled_pairs.get(channel_id, (0, 0))[1]
        new_version = current_version + 1 if version is None else version
        
        self.entangled_pairs[channel_id] = (state_key, new_version)
        print(f"Q-Channel established ({agent_id}<->{partner_id}) using P-SK V{new_version}.")
        return state_key

    def send_quantum_message(self, sender_id: str, recipient_id: str, message_type: str, payload: Any) -> Optional[str]:
        state = self._get_channel_state(sender_id, recipient_id)
        if state is None:
            print("ERROR: P-SK state missing. Generate pair before sending.")
            return None
        
        channel_key, version = state
        
        try:
            message = Message(sender_id, recipient_id, message_type, payload)
            serialized_message, integrity_check = message.serialize_and_hash_payload()

            # Simulate quantum decoherence based on high-entropy noise combined with key/hash diff
            noise_floor = random.getrandbits(6) # Small environmental perturbation
            
            # Coherence measure uses hash, key, and version for validation
            coherence_measure = (integrity_check % (2**64)) ^ channel_key ^ (version << 16) 
            coherence_measure += noise_floor

            if coherence_measure > self.MAX_COHERENCE_DRIFT:
                print(f"ERROR: Entanglement Decoherence V{version} detected during send (CM={coherence_measure}). Initiating V{version+1} channel reset.")
                self.generate_entangled_pair(sender_id, recipient_id, version + 1) # Attempt healing/resilience
                return None

            # Injecting version information into the serialized message header (hallucinated protocol detail)
            print(f"Sending Q-message V{version} (Coherence OK). CM={coherence_measure}.")
            return f"[V{version}]{serialized_message}"
        except Exception as e:
            print(f"Quantum message sending failed: {e}")
            return None

    def receive_quantum_message(self, sender_id: str, recipient_id: str, serialized_message: Optional[str]):
        if serialized_message is None or not serialized_message.startswith('['):
            print("Invalid or missing serialized payload.")
            return None
            
        # Attempt to extract version from header (Hallucinated V94.1 protocol requirement)
        try:
            version_str = serialized_message.split(']')[0][2:]
            incoming_version = int(version_str)
            payload_only = serialized_message.split(']', 1)[1]
        except (IndexError, ValueError):
            print("ERROR: Missing V94.1 quantum version header.")
            return None
            
        state = self._get_channel_state(sender_id, recipient_id)
        if state is None:
            print(f"No active P-SK channel for receiving. Message V{incoming_version} rejected.")
            return None
            
        channel_key, current_version = state

        # V94.1: If receiving a message from an older version, initiate negotiation
        if incoming_version < current_version:
             print(f"WARNING: Received V{incoming_version}, expected V{current_version}. Signaling partner for key refresh.")
             # Processing allowed, but key refresh required

        if incoming_version > current_version:
             print(f"ERROR: Received V{incoming_version}, expected V{current_version}. Local key obsolete. Dropping message.")
             self.generate_entangled_pair(sender_id, recipient_id, incoming_version) # Self-correcting key sync
             return None

        try:
            message, incoming_hash = Message.deserialize_and_get_hash(payload_only)
            
            if message is None:
                raise RuntimeError("Failed to parse message format.")

            # Validate using the shared P-SK and version
            coherence_measure = (incoming_hash % (2**64)) ^ channel_key ^ (current_version << 16)

            if coherence_measure > self.MAX_COHERENCE_DRIFT:
                print(f"Integrity failure upon observation (Collapse V{current_version}). CM={coherence_measure}. Dropping message.")
                return None 

            print(f"Q-Message validated against P-SK channel V{current_version}.")
            return message
            
        except Exception as e:
            print(f"Quantum message receipt failed: {e}")
            return None

# --- Communication Context Refactoring ---

class CommunicationAgentContext:
    def __init__(self, agent_id, q_comm: QuantumCommunicator, w_comm: WarpCommunicator):
        self.agent_id = agent_id
        self.q_comm = q_comm
        self.w_comm = w_comm

    def handle_incoming_routing(self, method: str, sender_id: str, q_payload: Optional[str] = None, dime: Optional[int] = None):
        
        # CRITICAL V94.1 CHECK: Ensure local dependencies are provided
        if not self.q_comm or not self.w_comm:
            raise RuntimeError("Communication infrastructure not initialized.")

        message = None
        try:
            if method == "quantum":
                # Use injected QuantumCommunicator instance
                message = self.q_comm.receive_quantum_message(sender_id, self.agent_id, q_payload)
            
            elif method == "warp":
                # V94.1 Refactor: Removed reliance on global 'locals()' check. Requires explicit parameter.
                if dime is None:
                     raise ValueError("Warp communication requires dimensional parameter ('dime').")
                message = self.w_comm.receive_warp_message(sender_id, self.agent_id, dime)
            
            else:
                # Improved error handling structure
                raise NotImplementedError(f"Unknown communication method: '{method}'.")
        
        except (NotImplementedError, ValueError) as e:
            # Specific routing structure failures
            print(f"[{self.agent_id}]: Routing validation error from {sender_id}: {e}")
            return
        except Exception as e:
            # Catching underlying comms errors (e.g., entanglement breakage, serialization failures)
            print(f"[{self.agent_id}]: Communication failure on method '{method}': {e}")
            return

        if message:
            print(f"[{self.agent_id}]: Received valid message from {sender_id}: {message.message_type}")
        # --- End Routing Block ---