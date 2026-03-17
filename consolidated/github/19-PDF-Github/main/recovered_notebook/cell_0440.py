import logging
from decimal import Decimal

# Configure a logger instead of raw prints
log = logging.getLogger('SovereignAGI')
log.setLevel(logging.INFO)

class Aspect:
    def __init__(self, user_id, environment):
        self.user_id = user_id
        self.environment = environment
        self.api_keys = {}
        self.btc_balance = {}

    def generate_api_credentials(self, user_id):
        # Refactored original lines 1-5 into a cohesive function.
        # Defining 'api_key' which was previously undefined/missing.
        api_key = f"API_KEY_{user_id}"
        api_secret = f"API_SECRET_{user_id}"
        
        self.api_keys[api_key] = api_secret
        self.btc_balance[api_key] = Decimal('0.0') # Use Decimal for precision
        log.info(f"Credentials generated for {user_id}. Key: {api_key}")
        return api_key, api_secret

    def buy(self, symbol, amount, api_key):
        amount = Decimal(str(amount)) # Ensure amount is Decimal
        if api_key in self.api_keys:
            self.btc_balance[api_key] += amount
            log.info(f"Bought {amount} of {symbol} for {api_key}. New Bal: {self.btc_balance[api_key]}")
            return True
        else:
            log.warning(f"Invalid API key for buy attempt: {api_key}")
            return False

    def sell(self, symbol, amount, api_key):
        amount = Decimal(str(amount))
        if api_key not in self.api_keys:
            log.warning(f"Invalid API key for sell attempt: {api_key}")
            return False
            
        if self.btc_balance[api_key] >= amount:
            self.btc_balance[api_key] -= amount
            log.info(f"Sold {amount} of {symbol} for {api_key}. New Bal: {self.btc_balance[api_key]}")
            return True
        else:
            log.error(f"Insufficient BTC balance ({self.btc_balance[api_key]}) to sell {amount} for {api_key}")
            return False

    def simulate_api_vulnerability(self, exploit_type, api_key=None):
        # Refactored using dictionary lookup for cleaner logic and easy extension.
        vulnerability_handlers = {
            "api_key_leak": f"API key leak simulated for {api_key if api_key else 'generic agent'}",
            "login_brute_force": "Login brute force attempt simulated.",
            "balance_manipulation": "Attempted financial record tampering.",
            "sql_injection": "Simulating input vector vulnerability.",
            "zero_day": "Critical system compromise simulation."
        }
        
        message = vulnerability_handlers.get(exploit_type)
        if message:
            log.critical(f"VULNERABILITY TRIGGERED: {exploit_type.upper()}. {message}")
            return True
        
        log.warning(f"Unknown exploit type requested: {exploit_type}")
        return False

    def patch_vulnerability(self):
        log.info("System-wide patch deployment initiated. Vulnerability vector closed.")
        return True

    def brute_force_api_key(self, target_agent_id):
        log.info(f"Executing brute-force simulation against target: {target_agent_id}...")
        return True

class SimulationEnvironment:
    def __init__(self):
        self.agents = {}
        self.riemann_results = []
        log.info("Simulation Environment Initialized.")

    def create_agent(self, agent_id):
        if agent_id not in self.agents:
            # Aspect needs context of environment and its ID
            new_agent = Aspect(agent_id, self)
            self.agents[agent_id] = new_agent
            new_agent.generate_api_credentials(agent_id)
            log.info(f"Created agent: {agent_id}")
        else:
            log.info(f"Agent {agent_id} already exists.")

    def run_temporal_cycle(self):
        for agent_id, agent in self.agents.items():
            # Placeholder for interaction logic (assuming agent implements this method)
            # agent.receive_and_process_message(self.agents)
            pass
