import uuid
import hashlib
import time
from typing import Dict, Tuple, Optional, Any

class AuthenticationError(Exception):
    """Custom exception for authentication failures."""
    pass

class TradeError(Exception):
    """Custom exception for trade execution failures."""
    pass

class UserAccount:
    """Encapsulates user account data, balances, and securely (simulated) stored secrets."""

    def __init__(self, user_id: str):
        self.user_id = user_id
        self.btc_balance = 0.0
        self.usd_balance = 1000.0  # Base currency for trading
        # API keys mapping: public_key_id -> (hashed_secret: str, salt: str)
        self.api_keys: Dict[str, Tuple[str, str]] = {}
        # Key leak means the exchange should invalidate/reject calls using that specific key set
        self.is_compromised: Dict[str, bool] = {"key_leak": False, "manipulated": False}

    def update_balance(self, symbol: str, amount: float):
        if symbol == "BTC":
            self.btc_balance += amount
        elif symbol == "USD":
            self.usd_balance += amount
        else:
            raise ValueError(f"Unsupported symbol: {symbol}")

    def get_balance(self, symbol: str):
        if symbol == "BTC":
            return self.btc_balance
        elif symbol == "USD":
            return self.usd_balance
        else:
            raise ValueError(f"Unsupported symbol: {symbol}")

    @staticmethod
    def hash_secret(secret: str, salt: str) -> str:
        # Standard SHA256 hashing simulation with a unique salt
        return hashlib.sha256(f"{secret}:{salt}".encode()).hexdigest()


class CryptoExchange:
    def __init__(self):
        self.accounts: Dict[str, UserAccount] = {}
        # Map API Key ID -> User ID
        self.key_to_user_map: Dict[str, str] = {}
        self.trade_fee_rate = 0.001
        self.last_btc_price = 40000.0
        # Log includes (key_id/user_id, severity, message, timestamp)
        self.vulnerability_log: list = []

    def _log_event(self, identifier: str, severity: str, message: str):
        self.vulnerability_log.append((identifier, severity, message, time.time()))

    def create_user(self, agent_id: str) -> UserAccount:
        user = UserAccount(user_id=agent_id)
        self.accounts[agent_id] = user
        return user

    def generate_api_key(self, user_id: str) -> Tuple[str, str]:
        if user_id not in self.accounts:
            raise ValueError("User ID not found.")
        
        user = self.accounts[user_id]
        api_key_id = f"API-{uuid.uuid4()}"
        
        # 1. Generate the plain text secret (given to the client only once)
        api_secret_plain = str(uuid.uuid4())
        # 2. Generate a unique salt for secure storage
        salt = str(uuid.uuid4())

        hashed_secret = UserAccount.hash_secret(api_secret_plain, salt)

        # Store the hash and the salt
        user.api_keys[api_key_id] = (hashed_secret, salt) 
        self.key_to_user_map[api_key_id] = user_id
        
        # Return key ID and the actual plain secret for use by the agent
        return api_key_id, api_secret_plain

    def _authenticate(self, api_key_id: str, api_secret: str) -> Optional[UserAccount]:
        user_id = self.key_to_user_map.get(api_key_id)
        if not user_id:
            return None
        
        user = self.accounts[user_id]

        # SECURITY CHECK 1: Global account compromise lockout
        if user.is_compromised["key_leak"]:
             self._log_event(api_key_id, "SECURITY", "Rejected trade: Account flagged as compromised/key leaked (system lockout).")
             # In a real system, the key associated with this API call might be revoked immediately here.
             return None 

        stored_data = user.api_keys.get(api_key_id)
        if not stored_data:
            # Key ID might be expired or not belong to this user anymore (e.g., after patching)
            return None
            
        stored_hash, stored_salt = stored_data
        
        # SECURITY CHECK 2: Credential verification
        incoming_hash = UserAccount.hash_secret(api_secret, stored_salt)
        
        if incoming_hash == stored_hash:
            return user
        return None

    def buy(self, symbol: str, amount: float, api_key_id: str, api_secret: str) -> bool:
        account = self._authenticate(api_key_id, api_secret)
        if not account:
            raise AuthenticationError(f"Authentication failed for API key {api_key_id}.")

        if symbol != "BTC":
            raise TradeError("Only BTC/USD trading supported.")

        cost_usd = amount * self.last_btc_price
        fee = cost_usd * self.trade_fee_rate
        total_cost = cost_usd + fee

        if account.usd_balance >= total_cost:
            account.update_balance("BTC", amount)
            account.update_balance("USD", -total_cost)
            self._log_event(api_key_id, "TRADE", f"Bought {amount} {symbol}")
            return True
        else:
            raise TradeError(f"Insufficient USD balance ({account.usd_balance:.2f}) for required total cost ({total_cost:.2f}).")

    def sell(self, symbol: str, amount: float, api_key_id: str, api_secret: str) -> bool:
        account = self._authenticate(api_key_id, api_secret)
        if not account:
            raise AuthenticationError(f"Authentication failed for API key {api_key_id}.")

        if symbol != "BTC":
            raise TradeError("Only BTC/USD trading supported.")

        if account.get_balance("BTC") >= amount:
            received_usd = amount * self.last_btc_price
            fee = received_usd * self.trade_fee_rate
            net_received = received_usd - fee
            
            account.update_balance("BTC", -amount)
            account.update_balance("USD", net_received)
            self._log_event(api_key_id, "TRADE", f"Sold {amount} {symbol}")
            return True
        else:
            raise TradeError(f"Insufficient BTC balance ({account.get_balance('BTC'):.8f}) required {amount:.8f}.")

    def simulate_api_vulnerability(self, user_id: str, exploit_type: str):
        if user_id not in self.accounts:
            self._log_event(user_id, "WARNING", f"Vulnerability target {user_id} not found.")
            return False
        
        account = self.accounts[user_id]
        
        if exploit_type == "api_key_leak":
            account.is_compromised["key_leak"] = True
            # Note: This simulation marks the account as having leaked keys, _authenticate will reject trades.
            self._log_event(user_id, "ALERT", "Key leak detected/simulated. Account locked down (all keys invalidated).")
            return True
        elif exploit_type == "balance_manipulation":
            account.is_compromised["manipulated"] = True
            # Example: give the attacker a small balance boost
            account.update_balance("USD", 10.0)
            self._log_event(user_id, "CRITICAL", "Balance manipulation simulated (USD +10.0). Flag set).")
            return True
        return False

    def patch_vulnerability(self, user_id: str):
        if user_id in self.accounts:
            account = self.accounts[user_id]

            # Step 1: Invalidate associated API keys across the entire exchange map
            keys_to_remove = [k_id for k_id, u_id in list(self.key_to_user_map.items()) if u_id == user_id]
            for k_id in keys_to_remove:
                del self.key_to_user_map[k_id]

            # Step 2: Clear stored API keys from the account itself (forcing regeneration)
            account.api_keys = {}

            # Step 3: Clear account compromise status
            for k in account.is_compromised: 
                account.is_compromised[k] = False
            
            self._log_event(user_id, "INFO", "Patches applied. Account restored, all API keys revoked (regeneration required).")
            return True
        return False


class SimulationEnvironment:
    def __init__(self):
        self.exchange = CryptoExchange()
        self.agents: Dict[str, Any] = {}

    def create_agent_and_account(self, agent_id):
        user_account = self.exchange.create_user(agent_id)
        key, secret = self.exchange.generate_api_key(agent_id)
        print(f"[SETUP] Agent {agent_id} created with API Key ID: {key}. Secret must be stored securely by agent.")
        return key, secret
