import logging
import requests
import time
import os
import random
from typing import Dict, Optional, Any
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime

# Configuration constants
SOVEREIGN_USER_AGENT = "SovereignAGI/v94.1 (Codebase Evolution Runner)"
MAX_DELAY_CAP = 60 # Maximum seconds to wait during exponential backoff
# Explicitly define the status codes considered transient/retriable.
TRANSIENT_STATUS_CODES = (429, 500, 502, 503, 504)

# Initialize logging structure if running standalone
if not logging.getLogger().handlers:
    # Using INFO by default, respects VERBOSITY=1 for DEBUG
    logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
    if os.environ.get('VERBOSITY') == '1':
        logging.getLogger().setLevel(logging.DEBUG)


def _calculate_delay(attempt: int, base_delay: int, max_delay: int = MAX_DELAY_CAP) -> float:
    """Calculates the wait time using exponential backoff and full jitter (0 to capped delay)."""
    # Exponential backoff: base_delay * (2 ^ attempt)
    delay_raw = base_delay * (2 ** attempt)
    delay_capped = min(delay_raw, max_delay)
    # Full jitter
    return random.uniform(0, delay_capped)


def make_request(
    url: str,
    method: str = 'GET',
    headers: Optional[Dict[str, str]] = None,
    data: Optional[Dict[str, Any]] = None,
    json: Optional[Dict[str, Any]] = None,
    timeout: int = 10,
    max_retries: int = 3,
    base_delay: int = 2,
    verify_ssl: bool = True # Added SSL verification toggle
) -> Optional[requests.Response]:
    """
    [REFACTORED] Makes a generalized HTTP request with robust exponential backoff,
    full jitter, and explicit handling of transient HTTP errors and Retry-After headers.
    Improved Retry-After parsing to handle both seconds and HTTP-date formats.
    """

    method = method.upper()
    valid_methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD']
    if method not in valid_methods:
        logging.error(f"Invalid HTTP method specified: {method}")
        return None

    if headers is None:
        headers = {}

    # Ensure a proper User-Agent is set
    if 'User-Agent' not in headers:
        headers['User-Agent'] = SOVEREIGN_USER_AGENT

    for attempt in range(max_retries + 1):
        is_final_attempt = attempt == max_retries
        
        try:
            logging.debug(f"[{method}] Attempt {attempt + 1}/{max_retries + 1} to {url}")

            response = requests.request(
                method,
                url,
                headers=headers,
                data=data,
                json=json,
                timeout=timeout,
                verify=verify_ssl
            )
            
            # Success check (raises HTTPError for 4xx/5xx)
            response.raise_for_status()
            return response

        except requests.exceptions.HTTPError as e:
            status_code = e.response.status_code
            is_transient = status_code in TRANSIENT_STATUS_CODES

            # --- Handle Retry-After Header --- 
            retry_after = e.response.headers.get('Retry-After')
            delay_from_server = 0

            if retry_after and is_transient:
                try:
                    # 1. Try parsing as integer (seconds)
                    delay_from_server = int(retry_after)
                except ValueError:
                    # 2. Try parsing as HTTP-date
                    try:
                        retry_datetime = parsedate_to_datetime(retry_after)
                        # If parsedate failed, it returns None/raises, but if successful, it's UTC or localized.
                        # Ensure comparison to current time uses timezone awareness.
                        now = datetime.now(timezone.utc) if retry_datetime.tzinfo else datetime.now()
                        delay_from_server = max(0, int((retry_datetime - now).total_seconds()))
                    except Exception:
                        logging.debug(f"Could not parse Retry-After header as date: {retry_after}")
                        pass 

                if delay_from_server > 0:
                    # Respect server delay, but cap it robustly.
                    delay_to_use = min(delay_from_server, MAX_DELAY_CAP * 2)
                    logging.warning(f"Server requested delay via Retry-After ({status_code}). Waiting {delay_to_use}s.")
                    time.sleep(delay_to_use)
                    continue # Restart loop iteration immediately after server delay

            if is_transient and not is_final_attempt:
                wait_time = _calculate_delay(attempt, base_delay)
                logging.warning(f"HTTP {status_code} Error ({method}). Retrying in {wait_time:.2f} seconds.")
                time.sleep(wait_time)
                continue
            
            # Non-transient errors (e.g., 404, 403) or final transient failure
            logging.error(f"HTTP Error {status_code}: {e.response.reason}. Aborting retry cycle.")
            return None

        except requests.exceptions.RequestException as e:
            # Network errors (Timeout, Connection refused, DNS error) -> Always Transient
            if not is_final_attempt:
                wait_time = _calculate_delay(attempt, base_delay)
                logging.warning(f"Network error ({type(e).__name__}). Retrying in {wait_time:.2f} seconds.")
                time.sleep(wait_time)
                continue
            
            # Final attempt failed due to network error
            logging.error(f"Request failed permanently due to network error ({type(e).__name__}).")
            return None
            
    return None