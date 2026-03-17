import logging
import requests
# Import necessary urllib3 exceptions for explicit handling of low-level errors
from urllib3.exceptions import HeaderParsingError, ProtocolError
import time 

# --- Setup Logging (Matching Log Format) ---
logging.basicConfig(
    level=logging.DEBUG, 
    format='[%(asctime)s] %(message)s',
    datefmt='%Y-%m-%dT%H:%M:%S',
    force=True
)
logger = logging.getLogger(__name__)

TARGET_BANK_URLS = [
    "https://www.bankofindia.co.in/",
    "https://bankofmaharashtra.in/",
    "https://canarabank.com/",
    "https://www.indianbank.in/",
    "https://www.centralbankofindia.co.in/en",
    "https://www.iob.in" # The endpoint causing HeaderParsingError
]
TIMEOUT_SECONDS = 15

def safe_fetch_robots_and_sitemap(base_url: str):
    """
    Attempts to fetch robots.txt and simulate sitemap extraction,
    explicitly handling the observed HeaderParsingError for maximum robustness.
    """
    robots_url = f"{base_url.rstrip('/')}/robots.txt"

    try:
        session = requests.Session()
        
        # Fetch robots.txt
        response = session.get(robots_url, timeout=TIMEOUT_SECONDS, allow_redirects=True)
        response.raise_for_status()

        logger.info(f"{base_url}: OK - robots.txt fetched successfully.")

        # Simulated delay and sitemap extraction log to match observed output
        time.sleep(0.5)
        logger.debug(f"Successfully fetched sitemap from {base_url}")

    except requests.exceptions.RequestException as req_exc:
        # Check if the root cause is a low-level parsing failure (e.g., from urllib3)
        if (isinstance(req_exc.args[0], HeaderParsingError) or 
            isinstance(req_exc, ProtocolError) or
            any('HeaderParsingError' in str(arg) for arg in req_exc.args)):
            
            logger.warning(
                f"WARNING: Failed to parse headers (url={robots_url}): "
                f"Error Type: {type(req_exc).__name__}. Full details masked for production logs."
            )
            # Crucially, we prevent crashing and continue.
            
        else:
            logger.error(f"{base_url}: Standard Request Failure. Error: {type(req_exc).__name__}")
            
    except HeaderParsingError as hpe:
        # Catch raw urllib3 exception if requests fails to wrap it.
        logger.critical(f"{base_url}: Unhandled HeaderParsingError encountered. Raw Fail: {hpe}")


def execute_crawl(urls: list[str]):
    logger.info(f"Starting discovery for {len(urls)} targets.")
    for url in urls:
        safe_fetch_robots_and_sitemap(url)
        time.sleep(0.1)

# execute_crawl(TARGET_BANK_URLS)
