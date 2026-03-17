import uuid
import secrets
import logging
from typing import Dict, Any, List, Optional

# Setup basic logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

class Essence:
    """Represents a fundamental resource or entity state, critical for stability and transfer."""
    def __init__(self, properties: Optional[Dict[str, Any]] = None, temporal_stability: float = 1.0):
        self.properties = properties if properties is not None else {}
        # Stability affects persistence and measurement reliability (0.0 to 1.0)
        self.temporal_stability = max(0.0, min(1.0, temporal_stability))

    def is_stable(self, threshold: float = 0.9) -> bool:
        return self.temporal_stability >= threshold

class QuantumCommunicator:
    """Handles communication via entangled quantum states, incorporating decoherence."""
    
    BASE_DECOHERENCE_RATE = 0.05 

    def __init__(self, communication_delay: int = 1):
        self.entangled_pairs: Dict[str, List[str]] = {}
        # Stores state data: {"state": hex_key, "creation_cycle": int}
        self.quantum_states: Dict[str, Dict[str, Any]] = {}
        self.communication_delay = communication_delay

    def calculate_reliability(self, current_cycle: int, creation_cycle: int) -> float:
        """Simulates reliability loss due to temporal distance (decoherence)."""
        elapsed_time = current_cycle - creation_cycle
        # Simple decay model
        return max(0.0, 1.0 - (self.BASE_DECOHERENCE_RATE * elapsed_time))

    def create_entangled_pair(self, agent_id1: str, agent_id2: str, creation_cycle: int = 0) -> tuple[str, str]:
        pair_id = str(uuid.uuid4())
        quantum_state = secrets.token_hex(32) 
        self.quantum_states[pair_id] = {
            "state": quantum_state,
            "creation_cycle": creation_cycle
        }
        self.entangled_pairs[pair_id] = [agent_id1, agent_id2]
        return pair_id, quantum_state

    def verify_quantum_state(self, pair_id: str, measured_state: str) -> bool:
        """Verifies the measurement outcome instantaneously (no decoherence check)."""
        state_data = self.quantum_states.get(pair_id)
        if not state_data:
            return False
        return state_data["state"] == measured_state

    def verify_communication(self, pair_id: str, message: str, current_cycle: int) -> bool:
        """Verifies communication factoring in quantum stability over time."""
        state_data = self.quantum_states.get(pair_id)
        if not state_data:
            logging.warning(f"Pair ID {pair_id} not found.")
            return False

        reliability = self.calculate_reliability(current_cycle, state_data["creation_cycle"])
        
        if reliability < 0.5:
             # Simulate failure chance if system is highly unstable
             if secrets.randbelow(100) / 100 > reliability:
                 logging.warning(f"Communication failure due to high decoherence (R={reliability:.2f}).")
                 return False

        return state_data["state"] == message

class WarpCommunicator:
    """Manages dimensional travel and calculates warp latency."""
    def __init__(self):
        self.wormholes: Dict[str, tuple[str, str]] = {}
        self.multiverse_registry: Dict[str, List[str]] = {}

    def create_wormhole(self, agent_id: str, target_dimension: str) -> str:
        wormhole_id = str(uuid.uuid4())
        self.wormholes[wormhole_id] = (agent_id, target_dimension)
        self.multiverse_registry.setdefault(target_dimension, []).append(agent_id)
        return wormhole_id

    def calculate_warp_latency(self, origin_dimension: str, target_dimension: str, essence_stability: float = 1.0) -> int:
        """Latency based on dimensional distance and local essence stability."""
        if origin_dimension == target_dimension:
            return 0
        
        base_latency = 100 
        # Low stability (low essence quality) increases travel time
        latency_factor = 1.0 + (1.0 - essence_stability) * 5 
        return int(base_latency * latency_factor)

class CryptoExchange:
    """Handles financial transactions, smart contracts, and resource management with nonce protection."""
    
    ASSET_TYPES = ["CREDITS", "ESSENCE_UNITS", "TEMPORAL_LOCKS"]

    def __init__(self):
        self.wallets: Dict[str, Dict[str, float]] = {}
        self.transactions: List[Dict[str, Any]] = []
        self.contracts: Dict[str, Dict[str, Any]] = {}
        self.nonce_registry: Dict[str, int] = {}

    def initialize_wallet(self, agent_id: str):
        if agent_id not in self.wallets:
            self.wallets[agent_id] = {asset: 0.0 for asset in self.ASSET_TYPES}
            logging.info(f"Initialized wallet for {agent_id}")

    def get_balance(self, agent_id: str, asset: str) -> float:
        self.initialize_wallet(agent_id)
        return self.wallets[agent_id].get(asset, 0.0)

    def process_transaction(self, transaction: Dict[str, Any]):
        """Executes a validated transaction with replay protection and balance check."""
        required_fields = ["sender", "recipient", "asset", "amount", "nonce"]
        if not all(field in transaction for field in required_fields):
            logging.error("Invalid transaction format.")
            return

        sender, recipient, asset, amount, nonce = (
            transaction["sender"], transaction["recipient"], transaction["asset"], transaction["amount"], transaction["nonce"]
        )

        # 1. Nonce Check (Replay Protection)
        last_nonce = self.nonce_registry.get(sender, 0)
        if nonce <= last_nonce:
            logging.warning(f"Transaction rejected for {sender}: Invalid nonce {nonce}.")
            return
        
        # 2. Asset and Balance Check
        if asset not in self.ASSET_TYPES:
            logging.error(f"Unknown asset type: {asset}")
            return

        sender_balance = self.get_balance(sender, asset)
        if sender_balance < amount:
            logging.warning(f"Transaction failed: Insufficient {asset} for {sender}.")
            return
        
        # 3. Execution
        self.initialize_wallet(recipient)

        self.wallets[sender][asset] -= amount
        self.wallets[recipient][asset] += amount
        self.transactions.append(transaction)
        self.nonce_registry[sender] = nonce

        logging.info(f"SUCCESS: Transferred {amount} {asset} from {sender} to {recipient}.")

    def execute_smart_contract(self, contract_id: str) -> bool:
        contract = self.contracts.get(contract_id)
        if not contract:
            return False

        # Contract must provide a callable 'conditions_met'
        if callable(contract.get("conditions_met")) and contract["conditions_met"]():
            transaction_data = contract.get("transaction")
            if transaction_data:
                self.process_transaction(transaction_data)
                contract["status"] = "executed"
                return True
            else:
                 logging.error(f"Contract {contract_id} lacks transaction payload.")
        
        return False
