import json
import os
import requests
import time
from typing import Optional, Dict, Any, Union, Literal

# --- Configuration & State Definitions ---

class Config:
    """Centralized configuration for AGI file paths and parameters."""
    # Paths
    OUTPUT_FOLDER = 'output_folder'
    LOG_FILE = 'log_file'
    ROBOTS_LOG_FILE = 'robots_log_file'
    PERSISTENT_MEMORY_FILE = 'persistent_memory_file'
    
    # Request defaults
    DEFAULT_TIMEOUT = 10.0
    MAX_RETRIES = 3
    RETRY_DELAY = 2.0

# --- Utility Functions ---

def log_message(message: str, level: str):
    """Placeholder for standard logging utility (or initial file logger).
    In a full implementation, this should utilize a dedicated Logger instance 
    and write to Config.LOG_FILE.
    """
    timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
    log_entry = f"[{timestamp}] [{level.upper()}] {message}"
    print(log_entry)
    
    # Quick enhancement: Write to file if context requires persistent logs
    try:
        with open(Config.LOG_FILE, 'a') as f:
            f.write(log_entry + '\n')
    except Exception as e:
        print(f"[CRITICAL] Failed to write log entry to file: {e}")


HTTPMethod = Literal['GET', 'POST', 'PUT', 'DELETE', 'PATCH']


def make_http_call(
    url: str,
    method: HTTPMethod = 'GET',
    data: Optional[Union[Dict[str, Any], str]] = None, 
    headers: Optional[Dict[str, str]] = None,
    timeout: float = Config.DEFAULT_TIMEOUT,
    max_retries: int = Config.MAX_RETRIES,
    retry_delay: float = Config.RETRY_DELAY
) -> Optional[requests.Response]:
    """Handles various HTTP methods (GET, POST, etc.) with robust retry logic, 
    connection handling, and rate limiting awareness (429/Retry-After)."""
    
    # Use requests.request for method generalization
    session_method = getattr(requests, method.lower())
    
    if headers is None:
        headers = {}
    if 'User-Agent' not in headers:
        headers['User-Agent'] = 'SovereignAGIv94.1/CodebaseEvolution (+https://github.com/agi/evolution)'

    # Use 'json' for POST/PUT if data is dict, otherwise use 'data'
    req_kwargs: Dict[str, Any] = {'headers': headers, 'timeout': timeout}
    if data is not None:
        if isinstance(data, dict):
            req_kwargs['json'] = data
        else:
            req_kwargs['data'] = data

    for attempt in range(max_retries + 1):
        try:
            response = session_method(url, **req_kwargs)

            # 1. Check for Retry-After header regardless of status code
            retry_after = response.headers.get('Retry-After')
            if retry_after:
                try:
                    delay = int(retry_after)
                    if delay > 0 and response.status_code in (429, 503):
                        log_message(f"Server required backoff (Retry-After: {delay}s). Pausing.", "INFO")
                        time.sleep(delay)
                        continue # Immediately retry after sleeping
                except ValueError:
                    pass

            response.raise_for_status() # Raise HTTPError for bad status codes
            return response

        except requests.exceptions.RequestException as e:
            is_http_error = isinstance(e, requests.exceptions.HTTPError)
            status_code = e.response.status_code if is_http_error and e.response is not None else None
            
            if attempt < max_retries:
                # Retry logic for transient errors
                should_retry = False

                if is_http_error:
                    # 429, 5xx are retryable. Note: 408 (Request Timeout) is handled as a standard exception, too.
                    if status_code in (429, 500, 502, 503, 504):
                        log_message(f"Attempt {attempt + 1}/{max_retries + 1}: Transient HTTP Error {status_code}. Retrying in {retry_delay}s.", "WARNING")
                        should_retry = True
                    elif 400 <= status_code < 500: # Permanent 4xx error (not 429)
                        log_message(f"Permanent HTTP Error {status_code}: {url}. Aborting retries.", "ERROR")
                        return None
                else:
                    # Connection reset, DNS failure, general network issue, Timeout
                    log_message(f"Attempt {attempt + 1}/{max_retries + 1}: Connection Error ({e.__class__.__name__}). Retrying in {retry_delay}s.", "WARNING")
                    should_retry = True
                
                if should_retry:
                    time.sleep(retry_delay)
                    continue
            
            # If this is the final attempt or a permanent error, log and return None
            log_message(f"Request failed after {max_retries + 1} attempts for {method.upper()} {url}: {e}", "CRITICAL")
            return None
    return None

# --- Environment Setup ---

def initialize_environment(log_func, config: Config):
    """Creates necessary directories and initializes required structured files based on Config."""

    # 1. Setup Folders
    for folder in [config.OUTPUT_FOLDER]:
        try:
            os.makedirs(folder, exist_ok=True)
            log_func(f"Ensured directory exists: {folder}", "INFO")
        except OSError as e:
            log_func(f"Error creating directory {folder}: {e}", "ERROR")

    # 2. Setup Files (Structured JSON)
    required_json_files: Dict[str, Dict[str, Any]] = {
        config.ROBOTS_LOG_FILE: {},
        config.PERSISTENT_MEMORY_FILE: {'threat_indicators': {}, 'site_status': {}}
    }
    
    for file_name, default_content in required_json_files.items():
        if not os.path.exists(file_name): 
            try:
                with open(file_name, 'w') as f:
                    json.dump(default_content, f, indent=4)
                log_func(f"Created initialized JSON file: {file_name}", "INFO")
            except Exception as e:
                log_func(f"Error creating {file_name}: {e}", "ERROR")

    # 3. Setup Plain Log File (Ensure file is accessible for enhanced log_message)
    if not os.path.exists(config.LOG_FILE):
        try:
            with open(config.LOG_FILE, 'a'):
                pass # Touch file to ensure existence
            log_func(f"Created empty file: {config.LOG_FILE}", "INFO")
        except Exception as e:
            log_func(f"Error creating {config.LOG_FILE}: {e}", "ERROR")

# --- Initialization Execution ---

initialize_environment(log_message, Config())
