import requests
from requests.exceptions import RequestException, HTTPError
from datetime import datetime

# --- Configuration Constants ---
DEFAULT_REQUEST_TIMEOUT = 10  # seconds
RESOURCES_TO_FETCH = ["robots.txt", "sitemap.xml", "security.txt"]

def log_message(message, level="INFO"):
    """Standardized logging utility using print()."""
    timestamp = datetime.now().strftime("%Y-%m-%dT%H:%M:%S.%f")
    # Truncate milliseconds for cleaner output
    print(f"[{timestamp[:-3]}] [{level:5}] {message}")

def _fetch_resource(base_url, resource_path):
    """
    Generic function to fetch a specific resource (e.g., robots.txt, sitemap.xml)
    from a given base URL, handling various RequestExceptions.
    """
    full_url = f"{base_url.rstrip('/')}/{resource_path}"
    
    try:
        response = requests.get(full_url, timeout=DEFAULT_REQUEST_TIMEOUT)
        response.raise_for_status()
        
        log_message(f"Success (Status {response.status_code}) for {resource_path} @ {base_url}. Size: {len(response.text)} bytes", level="DEBUG")
        return response.text
        
    except HTTPError as http_err:
        # Handle 4xx or 5xx responses specifically
        log_message(f"HTTP Error {http_err.response.status_code} retrieving {resource_path} from {base_url}: {http_err.response.reason}", level="WARN")
        return None
    except RequestException as req_err:
        # Catch connection errors, DNS resolution failures, timeouts, etc.
        log_message(f"Connection/Request Error retrieving {resource_path} from {base_url}: {type(req_err).__name__}", level="ERROR")
        return None

def main():
    # List of target URLs
    urls = [
        "https://www.iob.in",
        "https://www.pnbindia.in",
        "https://punjabandsindbank.co.in",
        "https://sbi.co.in",
        "http://example.com/nonexistent"
    ]

    log_message(f"Starting resource fetching for {len(urls)} URLs. Timeout set to {DEFAULT_REQUEST_TIMEOUT}s.", level="INFO")

    fetch_summary = {}
    
    for url in urls:
        fetch_summary[url] = {}
        log_message(f"--- Processing URL: {url} ---", level="INFO")
        
        for resource in RESOURCES_TO_FETCH:
            content = _fetch_resource(url, resource)
            
            if content is not None:
                fetch_summary[url][resource] = {"status": "SUCCESS", "size": len(content)}
            else:
                # Determine status based on the error level raised in _fetch_resource
                fetch_summary[url][resource] = {"status": "FAILED", "size": 0}

    log_message("\n--- FINAL SUMMARY REPORT ---", level="INFO")
    for url, data in fetch_summary.items():
        summary_items = []
        for r, d in data.items():
            status_color = "OK" if d['status'] == 'SUCCESS' else "FAIL"
            summary_items.append(f"{r} ({status_color})")
        log_message(f"{url}: {', '.join(summary_items)}", level="SUMMARY")

if __name__ == "__main__":
    main()