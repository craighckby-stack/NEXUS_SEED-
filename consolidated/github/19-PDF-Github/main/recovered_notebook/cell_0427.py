import uuid
import time
from typing import Dict, Any, Tuple, Optional

class Aspect:
    """Represents an agent/user within the simulation environment, handling APIs and balances.
    Balances are now tracked by persistent user identity (user_id), independent of ephemeral API keys.
    """
    
    def __init__(self, agent_id: str, environment: 'SimulationEnvironment'):
        self.agent_id = agent_id
        self.environment = environment
        self.vulnerabilities: Dict[str, Dict[str, Any]] = {}
        
        # Maps api_key -> {"secret": str, "user_id": str, "status": str, ...}
        self.api_keys: Dict[str, Dict[str, str]] = {}
        
        # Financial Ledger: Maps user_id -> float (BTC balance)
        self.user_balances: Dict[str, float] = {}

    def _get_user_id_from_key(self, api_key: str) -> Optional[str]:
        """Utility to safely retrieve user ID and check key status."""
        key_data = self.api_keys.get(api_key)
        if key_data and key_data.get('status') == 'active':
            return key_data['user_id']
        return None

    def generate_api_key(self, user_id: str) -> Tuple[str, str]:
        # Ensure user_id exists in the balance ledger and initialize if necessary
        if user_id not in self.user_balances:
            self.user_balances[user_id] = 0.0
        
        # Generate more descriptive and unique keys/secrets
        key_prefix = f"SA_{self.agent_id.upper()[:4]}"
        api_key = f"{key_prefix}_{uuid.uuid4().hex[:10]}"
        api_secret = uuid.uuid4().hex + uuid.uuid4().hex # Longer secret for simulation realism
        
        self.api_keys[api_key] = {
            "secret": api_secret,
            "user_id": user_id,
            "status": "active",
            "created_at": self.environment.get_current_time()
        }
        
        print(f"[{self.agent_id}] Generated API Key for UID '{user_id}': {api_key}")
        return api_key, api_secret

    def buy(self, symbol: str, amount: float, api_key: str) -> Dict[str, Any]:
        amount = float(amount)
        user_id = self._get_user_id_from_key(api_key)

        if not user_id:
            return {"success": False, "message": f"Invalid or inactive API key: {api_key}", "code": 401}
        
        # Update balance tied to the persistent user_id
        current_balance = self.user_balances.get(user_id, 0.0)
        self.user_balances[user_id] = current_balance + amount
        
        return {
            "success": True, 
            "message": f"Bought {amount:.2f} of {symbol}.",
            "new_balance": self.user_balances[user_id]
        }

    def sell(self, symbol: str, amount: float, api_key: str) -> Dict[str, Any]:
        amount = float(amount)
        user_id = self._get_user_id_from_key(api_key)
        
        if not user_id:
            return {"success": False, "message": f"Invalid or inactive API key: {api_key}", "code": 401}

        current_balance = self.user_balances.get(user_id, 0.0)
        
        if current_balance >= amount:
            self.user_balances[user_id] -= amount
            return {
                "success": True,
                "message": f"Sold {amount:.2f} of {symbol}.",
                "new_balance": self.user_balances[user_id]
            }
        else:
            return {
                "success": False,
                "message": f"Insufficient balance ({current_balance:.2f}) for UID {user_id}.",
                "available": current_balance,
                "required": amount,
                "code": 400
            }

    def simulate_api_vulnerability(self, exploit_type: str, target: Optional[str] = None) -> Dict[str, Any]:
        ALLOWED_EXPLOITS = {
            "api_key_leak", "login_brute_force", "balance_manipulation", 
            "sql_injection", "zero_day", "denial_of_service"
        }
        
        if exploit_type not in ALLOWED_EXPLOITS:
            return {"success": False, "message": "Unknown exploit type."}

        vuln_id = uuid.uuid4().hex[:12]
        
        self.vulnerabilities[vuln_id] = {
            "type": exploit_type,
            "timestamp": self.environment.get_current_time(),
            "is_patched": False,
            "scope": target or "N/A",
            "severity": 0.7 # Added severity metric
        }
        
        print(f"[{self.agent_id} ALERT] Detected {exploit_type.replace('_', ' ').upper()} vulnerability.")
        
        return {"success": True, "vuln_id": vuln_id, "exploit_type": exploit_type}

    def patch_vulnerability(self, vuln_id: Optional[str] = None) -> Dict[str, Any]:
        patched_count = 0
        
        if vuln_id:
            if vuln_id in self.vulnerabilities and not self.vulnerabilities[vuln_id]["is_patched"]:
                self.vulnerabilities[vuln_id]["is_patched"] = True
                patched_count = 1
                message = f"Specific vulnerability {vuln_id} resolved."
            else:
                return {"success": False, "message": f"Vulnerability ID {vuln_id} not found or already patched."}
        else:
            # Patch all
            to_patch = [vid for vid, data in self.vulnerabilities.items() if not data["is_patched"]]
            for vid in to_patch:
                self.vulnerabilities[vid]["is_patched"] = True
                patched_count += 1
            message = f"{patched_count} vulnerabilities resolved (batch patch)."
            
        return {"success": True, "patched_count": patched_count, "message": message}

    def brute_force_api_key(self, target_agent_id: str) -> bool:
        # Simulation logging for adversarial action
        log_id = uuid.uuid4().hex[:4]
        self.environment.riemann_results.append(f"LOG:{log_id}|{self.agent_id}_BF_ATTACK>{target_agent_id}")
        return True

class SimulationEnvironment:
    def __init__(self):
        self.agents: Dict[str, Aspect] = {}
        self.riemann_results: list = [] # Used for logging simulation events

    def create_agent(self, agent_id: str):
        if agent_id not in self.agents:
            self.agents[agent_id] = Aspect(agent_id, self)
            print(f"Created agent: {agent_id}")
        else:
            print(f"Agent {agent_id} already exists.")

    def get_current_time(self) -> float:
        return time.time()
