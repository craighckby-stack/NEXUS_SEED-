import json
import datetime
import os
from typing import Dict, Any, Optional, Callable

# --- CONFIGURATION ---
LOG_FILE = 'sovereign_agi.log'
ROBOTS_LOG_FILE = 'data/robots_data.json'
PERSISTENT_MEMORY_FILE = 'data/memory.json'

class Colors:
    """Defines ANSI escape codes for text colors."""
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    GRAY = '\033[90m'
    RESET = '\033[0m'

LOG_LEVEL_COLORS = {
    "INFO": Colors.CYAN,
    "WARNING": Colors.YELLOW,
    "ERROR": Colors.RED,
    "DEBUG": Colors.GRAY,
    "CRITICAL": Colors.MAGENTA,
}

LOG_LEVELS = LOG_LEVEL_COLORS.keys() # Define accepted levels centrally

def color_print(text: str, color: str = Colors.WHITE):
    """Prints text with a specified color."""
    print(f"{color}{text}{Colors.RESET}")

# --- Core Logging Utility ---

def log_message(message: str, level: str = "INFO", log_file: str = LOG_FILE):
    """Logs a message to the console and a file, using colors for console output.
    
    Handles basic threading issues by reopening the file for each write (low-throughput focus).
    """
    level = level.upper()
    if level not in LOG_LEVELS:
        level = "INFO"
        
    timestamp = datetime.datetime.now().isoformat()
    
    # Console output (colored)
    level_color = LOG_LEVEL_COLORS.get(level, Colors.WHITE)
    # Stripping newlines for cleaner console output
    clean_message = message.strip()
    console_entry = f"[{timestamp}] {level_color}[{level}]{Colors.RESET} {clean_message}"
    print(console_entry)
    
    # File output (plain text)
    log_entry = f"[{timestamp}] [{level}] {clean_message}\n"
    try:
        # Ensure the directory exists before writing
        os.makedirs(os.path.dirname(log_file) or '.', exist_ok=True)
        with open(log_file, 'a', encoding='utf-8') as f:
            f.write(log_entry)
    except Exception as e:
        # Avoid recursive logging, print directly to STDERR
        print(f"{Colors.RED}CRITICAL LOG WRITE ERROR: Could not write to {log_file}: {e}{Colors.RESET}")

# --- Logging Level Wrappers (Improved API) ---

def log_info(message: str):
    log_message(message, "INFO")

def log_debug(message: str):
    log_message(message, "DEBUG")

def log_warning(message: str):
    log_message(message, "WARNING")

def log_error(message: str):
    log_message(message, "ERROR")

def log_critical(message: str):
    log_message(message, "CRITICAL")

# --- Generic Persistence Utilities ---

def _load_json_data(filepath: str, default_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Generic function to load JSON data from a specified path."""
    if default_data is None:
        default_data = {}
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        log_debug(f"Persistence file not found: {filepath}")
        return default_data
    except json.JSONDecodeError:
        log_warning(f"Corrupt JSON file detected at {filepath}. Returning default data.")
        return default_data
    except Exception as e:
        log_error(f"Unexpected error loading JSON from {filepath}: {e}")
        return default_data

def _save_json_data(filepath: str, data: Dict[str, Any]):
    """Generic function to save JSON data to a specified path."""
    try:
        os.makedirs(os.path.dirname(filepath) or '.', exist_ok=True)
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4)
        log_debug(f"Successfully saved data to {filepath}")
    except IOError as e:
        log_critical(f"IO/Permission Error saving data to {filepath}: {e}")
    except TypeError as e:
        log_critical(f"Serialization Error (Type/JSON) saving data to {filepath}: {e}")
    except Exception as e:
        log_critical(f"Unhandled critical error saving data to {filepath}: {e}")

# --- Specific Data Handling (Wrapper Functions) ---

def load_robots_log():
    """Loads the robots data log."""
    return _load_json_data(ROBOTS_LOG_FILE, default_data={})

def save_robots_log(log):
    """Saves the robots data log."""
    _save_json_data(ROBOTS_LOG_FILE, log)

def load_persistent_memory():
    """Loads the persistent memory, defaulting essential structural keys."""
    default = {'threat_indicators': {}, 'site_status': {}, 'history': [], 'version': 'v94.1'}
    return _load_json_data(PERSISTENT_MEMORY_FILE, default_data=default)

def save_persistent_memory(memory):
    """Saves the persistent memory."""
    _save_json_data(PERSISTENT_MEMORY_FILE, memory)

# --- Domain Specific Analysis (Improved Placeholder) ---

def analyze_robots_txt(robots_content: str, site_url: str) -> Dict[str, Any]:
    """Analyzes the robots.txt content for potential issues and returns detailed findings.
    
    Returns a structured dictionary of indicators rather than just a list of strings.
    """
    threat_indicators = {
        'severity': 0, # 0=None, 1=Low, 2=Medium, 3=High
        'findings': []
    }
    
    if not robots_content:
        log_warning(f"No robots.txt content found for {site_url}. Cannot perform analysis.")
        threat_indicators['severity'] = 1
        threat_indicators['findings'].append('ROBOTS_MISSING')
        return threat_indicators
    
    content_lower = robots_content.lower()
    
    # 1. Admin/Sensitive Path Exposure Check
    sensitive_paths = ['/admin', '/wp-admin', '/db-backup', 'private', 'config']
    for path in sensitive_paths:
        # Check if a sensitive path is explicitly *not* disallowed or is allowed
        if f'disallow: {path}' not in content_lower and f'allow: {path}' in content_lower:
             log_warning(f"Robots.txt might expose sensitive path: {path} on {site_url}")
             threat_indicators['severity'] = max(threat_indicators['severity'], 2)
             threat_indicators['findings'].append({'type': 'SENSITIVE_PATH_EXPOSURE', 'path': path})

    # 2. Complete Disallow Check (Hiding vs Blocking)
    if 'disallow: /' in content_lower and 'allow:' not in content_lower:
        log_info(f"Robots.txt completely disallows crawling for {site_url}. Potential indicator of site hiding or deep protection.")
        threat_indicators['findings'].append({'type': 'FULL_CRAWL_BLOCK', 'note': 'All user-agents blocked.'})

    # 3. Sitemap Presence Check
    if 'sitemap:' not in content_lower:
        log_debug(f"No sitemap defined in robots.txt for {site_url}.")
        threat_indicators['findings'].append({'type': 'NO_SITEMAP', 'note': 'Missing Sitemap directive.'})
        
    log_debug(f"Analysis complete for {site_url}. Severity: {threat_indicators['severity']}")
    
    return threat_indicators