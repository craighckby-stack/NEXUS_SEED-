import requests
from bs4 import BeautifulSoup
import logging
import time

# --- Configuration Constants ---
MAX_RETRIES = 3
SENSITIVE_PATHS = [
    "/admin", "/wp-admin", "/login", "/secret", "/test", "/backup", "/logs"
]
DEFAULT_HEADERS = {'User-Agent': 'SovereignAGI/SitemapAnalyzer v94.1'}

# Configure logging
logging.basicConfig(level=logging.DEBUG, 
                    format='%(asctime)s - %(levelname)s - [%(funcName)s] - %(message)s')

def log_message(message: str, level: int = logging.INFO) -> None:
    """
    Logs a message at the specified level.
    """
    logging.log(level, message)

def make_request(url: str, headers: dict = None, timeout: int = 10, retries: int = MAX_RETRIES) -> requests.Response | None:
    """
    Makes a GET request with basic retry logic.
    """
    if headers is None:
        headers = DEFAULT_HEADERS
        
    for attempt in range(retries):
        try:
            response = requests.get(url, headers=headers, timeout=timeout, allow_redirects=True)
            response.raise_for_status() # Raise HTTPError for bad responses (4xx or 5xx)
            return response
        except requests.exceptions.HTTPError as e:
            log_message(f"HTTP Error fetching {url}: {e}. Status: {response.status_code}", logging.WARNING)
            return None # Do not retry on definite client/server errors 
        except requests.exceptions.RequestException as e:
            if attempt < retries - 1:
                log_message(f"Attempt {attempt + 1}/{retries} failed for {url}. Retrying in {2**attempt}s: {e}", logging.WARNING)
                time.sleep(2**attempt)
            else:
                log_message(f"Final attempt failed for {url}: {e}", logging.ERROR)
    return None

def _analyze_url_security(url_loc: str, site_url: str) -> list:
    """
    Performs security checks on a single URL entry.
    """
    indicators = []
    
    # Check 1: Sensitive path exposure
    if any(path in url_loc for path in SENSITIVE_PATHS):
        indicators.append({
            'type': 'sitemap_sensitive_path',
            'description': f'Sensitive path exposed: {url_loc}',
            'severity': 'medium'
        })

    # Check 2: Non-canonical URLs (URLs outside the primary site_url scope)
    if not url_loc.startswith(site_url) and url_loc.startswith('http'):
         indicators.append({
            'type': 'sitemap_external_url',
            'description': f'External or non-canonical URL found: {url_loc}',
            'severity': 'low'
        })
        
    # Check 3: Mixed content (Sitemap should generally use HTTPS if the site does)
    if site_url.startswith('https://') and url_loc.startswith('http://'):
        indicators.append({
            'type': 'sitemap_mixed_protocol',
            'description': f'Insecure HTTP link found in HTTPS sitemap: {url_loc}',
            'severity': 'medium'
        })
        
    return indicators

def analyze_sitemap(sitemap_url: str, site_url: str) -> list:
    """
    Analyzes a sitemap (or sitemap index) for potential issues.
    
    This implementation uses an iterative approach to handle sitemap indices 
    without deep recursion, tracking URLs that need to be processed.

    Args:
    - sitemap_url (str): The URL of the initial sitemap to analyze.
    - site_url (str): The primary URL of the site (for canonical checks).

    Returns:
    - list: A list of threat indicators.
    """
    threat_indicators = []
    sitemaps_to_process = [sitemap_url]
    processed_sitemaps = set()
    
    while sitemaps_to_process:
        current_sitemap_url = sitemaps_to_process.pop(0)
        
        if current_sitemap_url in processed_sitemaps:
            continue
        processed_sitemaps.add(current_sitemap_url)
        
        log_message(f"Processing sitemap: {current_sitemap_url}", logging.INFO)
        
        response = make_request(current_sitemap_url)
        if not response:
            log_message(f"Failed to fetch sitemap from {current_sitemap_url}", logging.ERROR)
            threat_indicators.append({
                'type': 'sitemap_fetch_error', 
                'description': f'Failed to fetch sitemap: {current_sitemap_url}', 
                'severity': 'high'
            })
            continue

        try:
            sitemap_content = response.text
            soup = BeautifulSoup(sitemap_content, 'xml')

            # 1. Check if this is a Sitemap Index 
            if soup.find('sitemapindex'):
                log_message(f"Detected sitemap index in {current_sitemap_url}", logging.DEBUG)
                for sitemap in soup.find_all('sitemap'):
                    loc = sitemap.find('loc')
                    if loc:
                        next_sitemap_url = loc.text.strip()
                        if next_sitemap_url not in processed_sitemaps:
                            sitemaps_to_process.append(next_sitemap_url)
            
            # 2. Analyze URLs
            url_entries = soup.find_all('url')
            
            if url_entries:
                log_message(f"Found {len(url_entries)} URL entries to analyze.", logging.DEBUG)
                
                for url in url_entries:
                    loc = url.find('loc')
                    if loc:
                        url_loc = loc.text.strip()
                        indicators = _analyze_url_security(url_loc, site_url)
                        threat_indicators.extend(indicators)
            
            # Edge case: If no known sitemap tags found
            if not soup.find('sitemapindex') and not url_entries:
                 log_message(f"Sitemap {current_sitemap_url} seems empty or malformed (missing <url> or <sitemapindex> tags).", logging.WARNING)

        except Exception as e:
            log_message(f"Error parsing sitemap XML from {current_sitemap_url}: {e}", logging.ERROR)
            threat_indicators.append({
                'type': 'sitemap_parsing_error',
                'description': f'Error parsing XML sitemap: {current_sitemap_url}',
                'severity': 'high'
            })
            
    return threat_indicators

# Example usage updated to reflect simplified signature
if __name__ == "__main__":
    # Ensure site_url is the base path used for canonical checking
    TEST_SITEMAP = "http://localhost:8000/sitemap.xml" # Replace with actual test target
    TEST_SITE = "http://localhost:8000"

    log_message("Starting Sitemap Analysis...", logging.INFO)
    
    # Placeholder for presentation:
    if TEST_SITEMAP == "http://localhost:8000/sitemap.xml":
        print("\n--- Example Scenario (Localhost Placeholder) ---")
        threat_indicators = []
        threat_indicators.extend(_analyze_url_security("http://localhost:8000/admin/settings", TEST_SITE))
        threat_indicators.extend(_analyze_url_security("https://attacker.com/injection", TEST_SITE))
        threat_indicators.extend(_analyze_url_security("http://localhost:8000/public/page", "https://localhost:8000"))
    
    print("\n--- Threat Report ---")
    if threat_indicators:
        for indicator in threat_indicators:
            print(f"[{indicator['severity'].upper():<6}] {indicator['type']}: {indicator['description']}")
    else:
        print("No immediate threat indicators found.")