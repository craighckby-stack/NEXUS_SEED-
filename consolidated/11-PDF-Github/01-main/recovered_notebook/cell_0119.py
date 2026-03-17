import json
import logging
import os
from functools import wraps

# --- Configuration ---
LOG_DIR = 'logs'
GLOBAL_LOG_FILE = os.path.join(LOG_DIR, 'g_file.log')
ROBOTS_LOG_FILE = os.path.join(LOG_DIR, 'robots_log.json')
MEMORY_FILE = os.path.join(LOG_DIR, 'persistent_memory.json')

# Ensure logging directory exists
os.makedirs(LOG_DIR, exist_ok=True)

# Configure logging using the standard library
logging.basicConfig(
    filename=GLOBAL_LOG_FILE,
    level=logging.INFO, # Raised logging level to INFO for better operational tracking
    format='%(asctime)s - %(levelname)s - %(message)s'
)
LOGGER = logging.getLogger(__name__)


# --- Centralized I/O Helpers ---

def handle_io_error(func):
    """Decorator to standardize JSON file handling, logging, and error suppression."""
    @wraps(func)
    def wrapper(*args, **kwargs):
        # Try to dynamically figure out the path argument based on common usage in this module
        filepath = args[0] if len(args) > 0 and isinstance(args[0], str) else (args[1] if len(args) > 1 and isinstance(args[1], str) else "<unknown>")
        action = 'loading' if 'load' in func.__name__ else 'saving'
        try:
            return func(*args, **kwargs)
        except FileNotFoundError:
            if action == 'loading':
                LOGGER.info(f"File not found during loading: {filepath}. Returning default state.")
                # Let the specific function catch FNF if it needs to return a specific default
                raise
            else:
                # Should be caught by os.makedirs, but log serious issues if directory creation fails
                 LOGGER.error(f"Directory missing or serious IO error during {action} {filepath}.")
        except json.JSONDecodeError as e:
            LOGGER.error(f"JSON Decode Error during {action} {filepath}: {e}")
            if action == 'loading':
                # Return empty dictionary or re-raise, depending on calling expectation
                return {}
        except Exception as e:
            LOGGER.error(f"Unhandled I/O exception during {action} {filepath}: {e}")
            raise
    return wrapper

@handle_io_error
def load_json_file(filepath):
    """Loads JSON data from a file."""
    with open(filepath, 'r') as f:
        return json.load(f)

@handle_io_error
def save_json_file(data, filepath):
    """Saves data to a JSON file."""
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=4)
    LOGGER.debug(f"Successfully saved data to {filepath}")


# --- API Functions ---

def load_robots_log():
    """Loads the robots.txt log from the JSON file."""
    try:
        return load_json_file(ROBOTS_LOG_FILE)
    except FileNotFoundError:
        return {}
    except json.JSONDecodeError:
        return {}

def save_robots_log(log):
    """Saves the robots.txt log to the JSON file."""
    save_json_file(log, ROBOTS_LOG_FILE)

def load_persistent_memory():
    """Loads the persistent memory from the JSON file."""
    DEFAULT_MEMORY = {'threat_indicators': {}, 'site_status': {}}
    try:
        return load_json_file(MEMORY_FILE)
    except FileNotFoundError:
        return DEFAULT_MEMORY
    except json.JSONDecodeError:
        return DEFAULT_MEMORY

def save_persistent_memory(memory):
    """Saves the persistent memory to the JSON file."""
    save_json_file(memory, MEMORY_FILE)


# --- Analysis Logic ---

def analyze_robots_txt(robots_content, site_url, verbose=False):
    """
    Analyzes the robots.txt content for potential security or indexing issues.
    (V94.1 Enhancement: Focus on exposing hidden endpoints or critical path reveals.)
    """
    threat_indicators = []

    # Helper function to add threat indicators
    def add_threat(threat_type, description, severity='medium', details=None):
        indicator = {
            'type': threat_type,
            'description': description,
            'severity': severity,
            'site_url': site_url
        }
        if details:
            indicator['details'] = details
        threat_indicators.append(indicator)

    # Preprocess content for robust parsing (basic line splitting)
    lines = [line.strip() for line in robots_content.splitlines() if line.strip() and not line.startswith('#')]
    
    # Extract all lowercase disallow paths
    disallow_paths = [
        line.split(':', 1)[1].strip().lower() 
        for line in lines 
        if line.lower().startswith('disallow:')
    ]

    # 1. Check for explicit exposure of typically hidden sensitive paths (Info Leakage)
    common_secrets = ['/private', '/backup', '/temp', '/db_export', '/vcs/', '/.git']
    for secret in common_secrets:
        # Check if the path is explicitly mentioned anywhere, even if disallowed
        if secret in robots_content.lower():
            add_threat('info_leak_path_reveal', f"Sensitive path ('{secret}') explicitly mentioned in robots.txt.", severity='low')

    # 2. Check for Disallow of critical/admin paths
    if any(path.startswith('/admin') for path in disallow_paths):
        add_threat('critical_path_disallowed', 'Admin path disallowed.', severity='medium')
    if any(path.startswith('/wp-admin') for path in disallow_paths):
        add_threat('critical_path_disallowed', 'WordPress admin path disallowed.', severity='medium')
    
    # 3. Check for specific dangerous disallow patterns (e.g., wildcarding potentially sensitive files)
    if any(path.endswith('.git') or path.endswith('/.git/') for path in disallow_paths):
         add_threat('vcs_exposure', 'Disallowing VCS directories - confirms existence/path.', severity='high')
    if any('*.php' in path or '*.js' in path for path in disallow_paths):
         add_threat('wildcard_disallowed', 'Wildcard disallow for dynamic files (*.php, *.js).', severity='low')

    # 4. Check for Full Site Block (usually benign, but high impact)
    if any(path == '/' for path in disallow_paths):
        add_threat('full_site_block', 'Full site crawl blockage detected.', severity='info')

    return threat_indicators