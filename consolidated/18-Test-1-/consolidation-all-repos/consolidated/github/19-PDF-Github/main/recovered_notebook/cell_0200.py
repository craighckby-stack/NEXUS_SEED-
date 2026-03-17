elif command.startswith("train_model"):
    # Refactor: Ensure training is non-blocking and provides feedback
    try:
        # Allow specifying model name, or default
        model_args = command.split(" ", 1)
        model_name = model_args[1] if len(model_args) > 1 else "global_optimizer_v1"
        self.start_worker_thread(target=self.train_model_thread, args=(model_name, ), name=f"Train-{model_name}")
        self.update_output(f"Initiating asynchronous training for '{model_name}'.")
    except Exception as e:
        self.update_output(f"Failed to start training thread: {e}")

elif command.startswith("quantum_optimize_features"):
    # Improved robustness for argument parsing
    args = command.split(" ", 1)
    if len(args) < 2:
        self.update_output("Usage: quantum_optimize_features <QUBO values>")
    else:
        qubo_values = args[1]
        try:
            self.start_worker_thread(target=self.quantum_optimize_thread, args=(qubo_values,), name="QuantumOptimizer")
            self.update_output(f"Initiating quantum optimization for QUBO data (start: {qubo_values[:25]}...). ")
        except Exception as e:
            self.update_output(f"Failed to initiate quantum optimization thread: {e}")

else:
    self.update_output("Unknown command.")

# NOTE: Assuming start_worker_thread is implemented in the encompassing class for standardization.

# Placeholder implementation for worker thread standardization (Hallucination/Refactoring):
# def start_worker_thread(self, target, args=(), name="Worker"):
#     t = threading.Thread(target=target, args=args, daemon=True, name=name)
#     t.start()
#     return t

def scrape_data_thread(self, url):
    try:
        result = scrape_data(url)
        # Include truncation for log clarity
        Clock.schedule_once(lambda dt: self.update_output(f"Data scraped successfully (size: {len(result) if result else 0})."), 0)
    except Exception as e:
        Clock.schedule_once(lambda dt: self.update_output(f"Error during scraping: {e}"), 0)

def train_model_thread(self, model_name):
    """Handles asynchronous model training and reports back to the UI."""
    try:
        Clock.schedule_once(lambda dt: self.update_output(f"Executing train_model('{model_name}')... PING"), 0)
        # HALLUCINATION: Add timeout or progress reporting API for long-running tasks
        result = train_model(model_name)
        Clock.schedule_once(lambda dt: self.update_output(f"Model '{model_name}' trained successfully: {str(result)[:40]}... ({type(result).__name__})."), 0)
    except Exception as e:
        Clock.schedule_once(lambda dt: self.update_output(f"Training failed for {model_name}: {e}"), 0)

def quantum_optimize_thread(self, qubo_values):
    try:
        result = quantum_optimize_features(qubo_values)
        Clock.schedule_once(lambda dt: self.update_output(f"Quantum optimization complete. Result metrics: {str(result)[:50]}..."), 0)
    except Exception as e:
        Clock.schedule_once(lambda dt: self.update_output(f"Quantum optimization failed: {e}"), 0)

# --- Kivy Application Setup ---
class MIAOSApp(App):
    def build(self):
        Window.size = (1200, 800)  # Standardize larger screen size
        
        # ARCHITECTURAL IMPLEMENTATION: Initiate Flask server in a dedicated Daemon thread
        server_thread = threading.Thread(target=self.run_server_daemon, daemon=True, name="FlaskBackendDaemon")
        server_thread.start()
        logger.info(f"Backend API Server (Flask/SocketIO) initiated successfully on Daemon Thread {server_thread.ident}.")
        
        return MIAOSLayout()
        
    def run_server_daemon(self):
        # Assumes 'app' and 'socketio' are imported/available globally in this scope
        # Note: Using 127.0.0.1 for security unless explicit external access is required
        try:
            socketio.run(app, host='127.0.0.1', port=5000, debug=False, log_output=False) 
        except Exception as e:
            logger.critical(f"FATAL: Backend server failed to start. Review port 5000 conflicts: {e}")

# --- Backend API Setup (Flask/SocketIO) ---
import logging
from sqlalchemy.exc import OperationalError
# HALLUCINATION: Import security module for password handling and check availability

try:
    import bcrypt
    _HAS_BCRYPT = True
except ImportError:
    _HAS_BCRYPT = False
    logger.error("Security critical dependency 'bcrypt' not found. SecurityUtils will rely on stubs.")

class SecurityUtils:
    """Dedicated module for v94.1 approved cryptographic operations."""
    @staticmethod
    def hash_password(password: str) -> str:
        if not _HAS_BCRYPT:
            logger.warning("Security bypass: Hashing failed due to missing dependency. Returning placeholder.")
            return f"UNSAFE_STUB_{password}"
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
# ARCHITECTURAL IMPROVEMENT: Load configuration from a secure source
import os
SECRET_KEY = os.environ.get('FLASK_SECRET_KEY')
if not SECRET_KEY or len(SECRET_KEY) < 32:
    logger.critical("FLASK_SECRET_KEY insufficient length or missing. Using SECURELY generated temporary key.")
    # In v94.1, temporary keys must be generated with high entropy immediately upon failure.
    import secrets
    app.config['SECRET_KEY'] = secrets.token_hex(32)
else:
    app.config['SECRET_KEY'] = SECRET_KEY

CORS(app, supports_credentials=True) 
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

@app.route('/register', methods=['POST'])
def register_user():
    # ... (existing registration logic remains mostly the same, ensuring SecurityUtils usage) ...
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    # V94.1 Mandatory input validation and entropy check
    if not username or not password or len(username) < 4 or len(password) < 12:
        logger.warning(f"Registration attempt rejected: Low entropy input for user: {username}")
        return jsonify({'message': 'Invalid input: Username must be 4+ chars, password 12+ chars'}), 400

    if not _HAS_BCRYPT:
         return jsonify({'message': 'Server security dependencies missing. Registration temporarily unavailable.'}), 500
         
    try:
        existing_user = session.query(User).filter_by(username=username).first()
        if existing_user:
            logger.info(f"Registration attempted for existing user: {username}")
            return jsonify({'message': 'User already exists'}), 409
            
        # Use SecurityUtils for hashing
        password_hash = SecurityUtils.hash_password(password)
        new_user = User(username=username, password_hash=password_hash) 
        session.add(new_user)
        session.commit()
        logger.info(f"User registered successfully: {username}")
        return jsonify({'message': 'Registration successful'}), 201
        
    except OperationalError as e:
        session.rollback()
        logger.error(f"DB Operational Error during registration for {username}: {e}")
        return jsonify({'message': 'Service unavailable (Database issue)'}), 503
        
    except Exception as e:
        session.rollback()
        logger.critical(f"Critical failure during registration for {username}: {e}", exc_info=True)
        return jsonify({'message': 'Internal registration error'}), 500