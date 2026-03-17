def make_request(url, headers=None, timeout=10, max_retries=MAX_RETRIES, retry_delay=RETRY_DELAY):
    """Makes an HTTP request with retries, exponential backoff (2^n), and prioritized
    dynamic rate limiting via the Retry-After header.
    """
    if headers is None:
        headers = {}
    
    local_headers = headers.copy() 
    local_headers['User-Agent'] = USER_AGENT

    for attempt in range(max_retries + 1):
        if verbose:
            log_message(f"Attempt {attempt + 1}/{max_retries + 1} to fetch {url}", "DEBUG")

        is_last_attempt = (attempt == max_retries)
        
        # Use exponential backoff (2^attempt) rather than linear backoff
        exp_delay = retry_delay * (2 ** attempt) 
        
        try:
            response = requests.get(url, headers=local_headers, timeout=timeout)
            response.raise_for_status()
            
            # Successful response (2xx)
            return response
            
        except requests.exceptions.HTTPError as e:
            status_code = e.response.status_code
            delay = exp_delay

            # --- Dynamic Delay based on Retry-After header (429/503 priority) ---
            retry_after = e.response.headers.get('Retry-After')
            
            if retry_after:
                try:
                    dynamic_delay = float(retry_after)
                    if dynamic_delay > 0:
                        delay = dynamic_delay
                        log_message(f"Server dictated delay via Retry-After header. Delaying {delay:.1f}s.", "WARNING")
                except ValueError:
                    pass 

            # If this is the final attempt, log and fail regardless of status code
            if is_last_attempt:
                log_message(f"HTTP Error {status_code} after {attempt + 1} attempts", "ERROR")
                return None

            # Handle status codes that require retrying
            if status_code == 429:
                log_message(f"Rate limited (429). Retrying in {delay:.1f}s.", "WARNING")
            elif 400 <= status_code < 500:
                # Note: Retrying all client errors (40x) is potentially wasteful but maintained here for robustness.
                log_message(f"Client error {status_code}. Retrying in {delay:.1f}s.", "INFO")
            elif status_code >= 500:
                log_message(f"Server error {status_code}. Retrying in {delay:.1f}s.", "INFO")
            
            # Wait and continue to the next attempt
            time.sleep(delay)
            continue

        except requests.exceptions.RequestException as e:
            if is_last_attempt:
                log_message(f"Request Error: {e} after {attempt + 1} attempts", "ERROR")
                return None
            
            delay = exp_delay
            log_message(f"Request Error: {e}. Retrying in {delay:.1f}s.", "WARNING")
            time.sleep(delay)
            continue
            
        except Exception as e:
            log_message(f"Unexpected system error: {e}", "FATAL")
            return None