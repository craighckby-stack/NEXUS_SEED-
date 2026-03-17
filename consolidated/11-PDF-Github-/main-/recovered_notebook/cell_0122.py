import os
import json
import requests
from bs4 import BeautifulSoup
import logging
from typing import List, Dict, Any

# --- Constants ---
ROBOTS_LOG_FILE = 'robots_analyzer.log'
LOG_LEVEL = logging.INFO
SENSITIVE_PATHS = ["/admin", "/wp-admin", "/log", "/config", "/private", "/api/v1/internal"]
HTTP_ANALYSIS_TARGET = "/robots.txt"

# --- Initialization ---

def configure_logging(log_file: str = ROBOTS_LOG_FILE, level: int = LOG_LEVEL):
    """Sets up unified logging configuration."""
    
    # Check if configuration is already applied (to prevent multiple handler additions)
    logger = logging.getLogger(__name__)
    if logger.handlers:
        return
    
    logger.setLevel(level)
    
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(name)s - %(message)s')

    # File Handler
    file_handler = logging.FileHandler(log_file)
    file_handler.setLevel(level)
    file_handler.setFormatter(formatter)
    
    # Console Handler (StreamHandler)
    console_handler = logging.StreamHandler()
    console_handler.setLevel(level)
    console_handler.setFormatter(formatter)
    
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    
    # Initialize the log file if it doesn't exist (as plain text)
    if not os.path.exists(log_file):
        try:
            with open(log_file, 'a'):
                os.utime(log_file, None)
            logger.info(f"Initialized log file: {log_file}")
        except IOError as e:
            # Handle potential permissions issues during initialization
            print(f"CRITICAL: Could not initialize log file {log_file}: {e}")

# Initialize logging immediately
configure_logging()
logger = logging.getLogger(__name__)


def parse_sitemap(sitemap_url: str) -> List[Dict[str, Any]]:
    """Parses the XML sitemap and checks for sensitive paths exposed to search engines."""
    
    logger.info(f"Attempting to fetch and analyze sitemap: {sitemap_url}")
    threat_indicators = []
    response = None
    
    try:
        response = requests.get(sitemap_url, timeout=5)
        response.raise_for_status() # Raise HTTPError for bad responses (4xx or 5xx)
        
        soup = BeautifulSoup(response.content, 'xml')
        
        for url in soup.find_all('url'):
            loc = url.find('loc')
            if loc:
                url_loc = loc.text.strip()
                
                # Check for sensitive paths
                if any(path in url_loc for path in SENSITIVE_PATHS):
                    threat_indicators.append({
                        'type': 'sitemap_sensitive_path',
                        'description': f'Sensitive path exposed in sitemap: {url_loc}',
                        'severity': 'medium'
                    })
        
        logger.info(f"Sitemap analysis complete. Found {len(threat_indicators)} potential indicators.")
        return threat_indicators
    
    except requests.exceptions.HTTPError as e:
        status_code = response.status_code if response else 'N/A'
        logger.error(f"HTTP Error fetching sitemap {sitemap_url}: {status_code} - {e}")
        threat_indicators.append({
            'type': 'sitemap_fetch_error',
            'description': f'Failed to fetch sitemap (HTTP {status_code}): {e}',
            'severity': 'high'
        })
    except requests.exceptions.RequestException as e:
        logger.error(f"Network error fetching sitemap {sitemap_url}: {e}")
        threat_indicators.append({
            'type': 'sitemap_fetch_error',
            'description': f'Network error fetching sitemap: {e}',
            'severity': 'high'
        })
    except Exception as e:
        logger.error(f"Error parsing XML sitemap from {sitemap_url}: {e}")
        threat_indicators.append({
            'type': 'sitemap_parsing_error',
            'description': f'Unexpected error parsing XML sitemap: {e}',
            'severity': 'high'
        })
    
    return threat_indicators

def check_http_methods(base_url: str) -> List[Dict[str, Any]]:
    """
    Checks the allowed HTTP methods (e.g., PUT, DELETE) on a target path 
    using the OPTIONS method. Replaces the unreliable is_robots_writable check.
    """
    url = base_url.rstrip('/') + HTTP_ANALYSIS_TARGET
    indicators = []
    
    logger.info(f"Checking allowed HTTP methods for: {url}")

    try:
        # Use OPTIONS request to determine supported methods
        response = requests.options(url, timeout=3)
        
        if response.status_code == 200:
            allowed_methods = response.headers.get('Allow', '').upper().split(', ')
            allowed_methods = [m.strip() for m in allowed_methods if m.strip()]
            
            dangerous_methods = {'PUT', 'DELETE', 'PATCH'}
            exposed_methods = dangerous_methods.intersection(set(allowed_methods))
            
            if exposed_methods:
                indicators.append({
                    'type': 'http_method_exposure',
                    'description': f'Dangerous HTTP methods exposed on {HTTP_ANALYSIS_TARGET}: {', '.join(exposed_methods)}. Allowed: {', '.join(allowed_methods)}',
                    'severity': 'critical' if 'PUT' in exposed_methods else 'high'
                })
                logger.warning(indicators[-1]['description'])
            else:
                logger.info(f"Safe HTTP methods detected. Allowed: {', '.join(allowed_methods)}")
        else:
            logger.debug(f"OPTIONS request non-200 response ({response.status_code}) on {url}")
            
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to check HTTP methods for {url}: {e}")

    return indicators


def main():
    # Replace example.com with actual target in deployment
    target_domain = 'https://example.com'
    sitemap_url = target_domain + '/sitemap.xml'
    
    all_threats = []

    # 1. Check Sitemap for Sensitive Paths
    all_threats.extend(parse_sitemap(sitemap_url))
    
    # 2. Check HTTP Method Exposure (Security assessment)
    all_threats.extend(check_http_methods(target_domain))
    
    print("\n--- Summary of Security Indicators ---")
    if all_threats:
        for indicator in all_threats:
            print(f"[{indicator['severity'].upper():<8}] {indicator['type']:<25}: {indicator['description']}")
    else:
        print("No high/medium security indicators found.")

if __name__ == "__main__":
    main()