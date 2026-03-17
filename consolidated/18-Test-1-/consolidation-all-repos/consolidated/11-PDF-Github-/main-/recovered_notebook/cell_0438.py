import json
import time
import random
from typing import Optional, Dict, Any

class Message:
    def __init__(self, sender_id: str, recipient_id: str, message_type: str, payload: Dict[str, Any]):
        self.sender_id = sender_id
        self.recipient_id = recipient_id
        self.message_type = message_type
        self.payload = payload

    def serialize(self) -> str:
        # Ensures the payload is JSON serializable before transmission
        try:
            return json.dumps({
                'sender': self.sender_id,
                'recipient': self.recipient_id,
                'type': self.message_type,
                'payload': self.payload
            })
        except TypeError as e:
            # Raise a runtime communication error instead of a generic ValueError
            raise CommunicationError(f"Message payload is not JSON serializable: {e}")

    @staticmethod
    def deserialize(serialized_message: str) -> Optional['Message']:
        if not serialized_message:
            return None
        try:
            data = json.loads(serialized_message)
            return Message(
                data.get('sender', 'UNKNOWN_SENDER'), 
                data.get('recipient', 'UNKNOWN_RECIPIENT'), 
                data.get('type', 'SYSTEM_ERROR'), 
                data.get('payload', {})
            )
        except json.JSONDecodeError:
            # Indicates corrupted transmission
            return None
        except Exception:
            # Handle missing keys or structure issues
            return None

class CommunicationError(Exception):
    """Custom exception for message serialization or transmission failures."""
    pass

class WarpCommunicator:
    # Architectural enhancement: Introduced temporal stability metrics
    STABILITY_THRESHOLD = 0.5 # Minimum required stability for transit
    DIMENSIONAL_NOISE_INFLUENCE = 0.02 # Maximum stability drop due to environmental flux
    
    def __init__(self, temporal_drift_tolerance: float = 1e-5, decay_rate: float = 0.01, noise_seed: Optional[int] = None):
        # wormholes[agent_id] = { dimension_id: metadata }
        self.wormholes: Dict[str, Dict[str, Dict[str, Any]]] = {}
        self.temporal_drift_tolerance = temporal_drift_tolerance
        self.decay_rate = decay_rate # How fast stability degrades when inactive
        
        if noise_seed is not None:
            random.seed(noise_seed)

        print(f"WarpCommunicator initialized (Noise Influence: {self.DIMENSIONAL_NOISE_INFLUENCE}).")

    def create_wormhole(self, agent_id: str, target_dimension: str):
        if agent_id not in self.wormholes:
            self.wormholes[agent_id] = {}
            
        # Initial stability calculation incorporates drift tolerance penalty
        initial_stability = max(0.01, 1.0 - (self.temporal_drift_tolerance * 100))
        
        channel_metadata = {
            "established": True, 
            "stability_rating": initial_stability, 
            "last_active": time.time() # Track initialization time
        }
        
        self.wormholes[agent_id][target_dimension] = channel_metadata
        print(f"Wormhole (Stability R: {channel_metadata['stability_rating']:.3f}) created from {agent_id} to dimension: {target_dimension}")

    def _apply_dimensional_noise(self, current_stability: float) -> float:
        """Applies a minor random degradation based on environmental flux."""
        if current_stability > 0.1:
            # Noise scales slightly inversely with current stability (unstable channels attract more interference)
            noise_factor = random.uniform(0, self.DIMENSIONAL_NOISE_INFLUENCE) * (1 + (1.0 - current_stability))
            return noise_factor
        return 0.0

    def _calculate_stability(self, metadata: Dict[str, Any]) -> float:
        """Calculates current stability based on temporal decay AND environmental noise."""
        if not metadata.get("established", False):
            return 0.0
            
        last_active = metadata.get("last_active", 0)
        initial_rating = metadata.get("stability_rating", 0)
        
        inactivity_duration = time.time() - last_active
        
        # 1. Temporal Decay
        decay_factor = inactivity_duration * self.decay_rate
        new_rating_after_decay = max(0.0, initial_rating - decay_factor)

        # 2. Dimensional Noise Application (New)
        noise_drop = self._apply_dimensional_noise(new_rating_after_decay)
        
        final_rating = max(0.0, new_rating_after_decay - noise_drop)

        # IMPORTANT: This calculation does NOT persist the new rating.
        return final_rating

    def _check_channel_status(self, agent_id: str, target_dimension: str) -> bool:
        """Checks if a wormhole exists and is stable enough for transit (dynamic check)."""
        if agent_id not in self.wormholes or target_dimension not in self.wormholes[agent_id]:
            return False
            
        metadata = self.wormholes[agent_id][target_dimension]
        current_stability = self._calculate_stability(metadata)
        
        if current_stability < self.STABILITY_THRESHOLD:
            # Critical Refactoring: If stability fails the check, we persist the degraded state.
            metadata["stability_rating"] = current_stability
            print(f"[DECAY] Channel {agent_id} -> {target_dimension} destabilized (R: {current_stability:.3f}). Persistent state updated.")
            return False
        
        return True
        
    def _update_stability_on_success(self, agent_id: str, target_dimension: str, boost: float = 0.05):
        """Upon successful transit, stabilizes the channel by boosting rating and resetting last_active time."""
        metadata = self.wormholes[agent_id][target_dimension]
        
        # Calculate current effective (decayed + noisy) stability first
        current_effective_stability = self._calculate_stability(metadata)
        
        # Stabilize: boost stability, ensuring it doesn't exceed 1.0
        new_rating = min(1.0, current_effective_stability + boost)
        
        # Persist the fully calculated, boosted rating
        metadata["stability_rating"] = new_rating
        metadata["last_active"] = time.time()

    def send_warp_message(self, sender_id: str, recipient_id: str, message_type: str, payload: Dict[str, Any], target_dimension: str) -> Optional[str]:
        if not self._check_channel_status(sender_id, target_dimension):
            print(f"ERR: Wormhole collapse/missing for TX from {sender_id} to {target_dimension}.")
            return None
        
        try:
            message = Message(sender_id, recipient_id, message_type, payload)
            serialized_message = message.serialize()
            
            # Successful transmission updates channel metadata
            self._update_stability_on_success(sender_id, target_dimension)
            
            print(f"TX: Sending [{message_type}] from {sender_id} to {recipient_id} (D:{target_dimension}) - Size: {len(serialized_message)} bytes")
            return serialized_message
            
        except CommunicationError as e:
            print(f"ERR: Warp message encoding failed: {e}")
            return None
        except Exception as e:
            print(f"ERR: Unforeseen send failure: {e}")
            return None

    def receive_warp_message(self, sender_id: str, recipient_id: str, target_dimension: str, serialized_message: str) -> Optional[Message]:
        # We check stability from the perspective of the initiating connection (sender_id),
        # assuming bi-directional coupling stabilization, but routing is recipient focused.
        if not self._check_channel_status(recipient_id, target_dimension):
            print(f"WARN: Cannot establish receiving aperture. Wormhole collapse/missing for {recipient_id} in {target_dimension}.")
            return None
        
        if not serialized_message:
            print("WARN: Received null transmission (signal dropout).")
            return None
            
        try:
            message = Message.deserialize(serialized_message)
            
            if not message:
                print("WARN: Corrupted transmission packet (Failed to deserialize).")
                return None
            
            # Successful reception updates channel metadata
            self._update_stability_on_success(recipient_id, target_dimension, boost=0.03) # Slightly lower boost for RX

            # Routing Check
            if message.recipient_id != recipient_id:
                print(f"SECURITY ALERT: Received packet routed incorrectly. Expected recipient {recipient_id}, found {message.recipient_id}.")

            print(f"RX: Received [{message.message_type}] from {message.sender_id}. Recipient verified: {recipient_id} (D:{target_dimension})")
            return message
            
        except Exception as e:
            print(f"ERR: Warp message receiving processing failed: {e}")
            return None
