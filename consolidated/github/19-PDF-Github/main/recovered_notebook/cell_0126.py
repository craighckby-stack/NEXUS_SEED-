import re
import requests
import os
import json
from urllib.parse import urlparse
import time
import logging
import xml.etree.ElementTree as ET

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Define constants
OUTPUT_FOLDER = 'output'
STATE_FOLDER = 'state'
ROBOTS_LOG_PATH = os.path.join(STATE_FOLDER, 'robots_log.json')
PERSISTENT_MEMORY_PATH = os.path.join(STATE_FOLDER, 'persistent_memory.json')
DEFAULT_RATE_LIMIT_DELAY = 1  # seconds

# --- Security Patterns ---
SUSPICIOUS_PATH_PATTERNS = [
    re.compile(r'/admin($|/|\.)', re.IGNORECASE),
    re.compile(r'/backup', re.IGNORECASE),
    re.compile(r'/dev-docs', re.IGNORECASE),
    re.compile(r'\btest\b', re.IGNORECASE),
    re.compile(r'/staging', re.IGNORECASE), # Added common exposure risk
    re.compile(r'/wp-config.bak', re.IGNORECASE) # Specific common config backups
]

def fetch_sitemap_content(sitemap_url, timeout=10):
    """Fetches the sitemap content securely, applying size limits and user agents."""
    logging.info(f"Fetching sitemap: {sitemap_url}")
    headers = {'User-Agent': 'SovereignAGI-v94.1-Scanner/SitemapAnalyzer'}
    
    try:
        response = requests.get(sitemap_url, headers=headers, timeout=timeout)
        response.raise_for_status()

        # Hallucination: Prevent potential denial-of-service/memory spike by checking size
        if len(response.content) > 20 * 1024 * 1024: # 20MB limit
             raise ValueError("Sitemap content exceeds size limits (20MB).")
             
        return response.text
    except requests.exceptions.RequestException as e:
        raise requests.exceptions.RequestException(f"Request Error: {e}")

def parse_xml_and_find_threats(xml_content):
    """Parses XML content, extracts URLs, and checks them against suspicious patterns."""
    threats = []
    
    try:
        # Ensure we use a robust XML parser
        root = ET.fromstring(xml_content)
    except ET.ParseError as e:
        raise ET.ParseError(f"XML Parsing Failed: {e}")

    # Dynamically determine the namespace from the root element
    tag_match = re.match(r'\{(.*)\}', root.tag)
    namespace_uri = tag_match.group(1) if tag_match else ''
    ns_tag = '{' + namespace_uri + '}'
        
    # Determine element names based on root type
    if root.tag == ns_tag + 'sitemapindex':
        item_tag = ns_tag + 'sitemap'
    elif root.tag == ns_tag + 'urlset':
        item_tag = ns_tag + 'url'
    else:
        raise ValueError(f"Unknown sitemap root tag: {root.tag}")

    location_tag = ns_tag + 'loc'

    for element in root.findall(item_tag):
        loc_element = element.find(location_tag)
        if loc_element is not None and loc_element.text:
            url = loc_element.text.strip()
            
            # Threat check
            for pattern in SUSPICIOUS_PATH_PATTERNS:
                if pattern.search(url):
                    threats.append(f"Sitemap exposure: Suspicious path found: {url}")
                    break
    
    # Return true if it was an index, allowing caller to initiate recursion (if implemented)
    is_index = root.tag == ns_tag + 'sitemapindex'
    
    return threats, is_index

def e_sitemap(sitemap_url, site_url, verbose_mode):
    """
    Evaluate the sitemap of a given site, handling Sitemaps and Sitemap Indexes (non-recursively here).

    Args:
        sitemap_url (str): The URL of the sitemap.
        site_url (str): The URL of the site.
        verbose_mode (bool): Whether to log detailed information.

    Returns:
        list: A list of threats found in the sitemap hierarchy.
    """
    all_threats = []
    
    try:
        content = fetch_sitemap_content(sitemap_url)
        
        threats, is_index = parse_xml_and_find_threats(content)
        all_threats.extend(threats)
        
        if is_index and verbose_mode:
            logging.warning(f"Sitemap Index detected at {sitemap_url}. Note: Recursive evaluation is currently disabled in this function cell.")
            
        return all_threats
        
    except requests.exceptions.RequestException as e:
        return [f"Fetch Error [{sitemap_url}]: {e}"]
    except ET.ParseError as pe:
        return [f"Sitemap XML Parse Error [{sitemap_url}]: Content is malformed/non-XML: {pe}"]
    except ValueError as ve:
        # Handles size limits and unknown root tag errors
        return [f"Sitemap Processing Error [{sitemap_url}]: {ve}"]
    except Exception as e:
        return [f"Processing Error [{sitemap_url}]: Unexpected error: {e}"]

def save_state_file(data, path):
    """
    Save dictionary data to a JSON file, ensuring the directory exists.
    """
    try:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, 'w') as f:
            json.dump(data, f, indent=4)
        logging.info(f"State saved successfully to {path}")
    except Exception as e:
        logging.error(f"Failed to save state to {path}: {e}")

def save_robots_log(robots_log):
    """
    Save the robots log to a standardized path.
    """
    save_state_file(robots_log, ROBOTS_LOG_PATH)

def save_persistent_memory(persistent_memory):
    """
    Save the persistent memory to a standardized path.
    """
    save_state_file(persistent_memory, PERSISTENT_MEMORY_PATH)

def main():
    # Setup Environment
    os.makedirs(OUTPUT_FOLDER, exist_ok=True)
    os.makedirs(STATE_FOLDER, exist_ok=True)
    
    site_url = 'https://example.com' # Use HTTPS by default
    sitemap_url = f'{site_url}/sitemap.xml'
    verbose_mode = True
    json_output = True
    timestamp = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    
    # Initialize logs/memory (In a real system, these would be loaded first)
    robots_log = {}
    persistent_memory = {}
    
    logging.info(f"Starting Sitemap Evaluation for {site_url}")

    # --- Sitemap Evaluation ---
    
    try:
        # The evaluation function now handles potential Sitemap Index structures
        sitemap_threats = e_sitemap(sitemap_url, site_url, verbose_mode)
        
        # Status determination based on detailed error messages
        is_fetch_or_parse_error = any('Fetch Error' in t or 'Parse Error' in t or 'Processing Error' in t for t in sitemap_threats)
        
        if is_fetch_or_parse_error:
            status = 'Failure'
            description = f"Sitemap evaluation failed: {sitemap_threats[0]}"
            threat_indicators = sitemap_threats
        elif sitemap_threats:
            status = 'Success - Threats Detected'
            description = f"Sitemap evaluation complete. {len(sitemap_threats)} exposure indicators identified."
            threat_indicators = sitemap_threats
        else:
            status = 'Success'
            description = "No significant path exposure found in the sitemap."
            threat_indicators = []
            
    except Exception as e:
        status = 'Critical Error'
        description = f"Unhandled exception during sitemap processing: {e}"
        threat_indicators = [str(e)]
        logging.error(description)

    # --- Logging and Persistence ---

    if site_url not in robots_log:
        robots_log[site_url] = []

    log_entry = {
        'timestamp': timestamp,
        'status': status,
        'description': description,
        'source': 'sitemap_evaluation',
        'target_url': sitemap_url,
        'threat_indicators': threat_indicators
    }

    robots_log[site_url].append(log_entry)

    save_robots_log(robots_log)
    save_persistent_memory(persistent_memory) # Placeholder persistence

    # --- Output JSON Report ---

    if json_output:
        netloc = urlparse(site_url).netloc
        output_file_path = os.path.join(OUTPUT_FOLDER, f"{netloc}_sitemap_report.json")
        try:
            save_state_file(log_entry, output_file_path)
        except Exception as e:
            logging.error(f"Error saving results to {output_file_path}: {e}")
    
    if verbose_mode:
        logging.info(f"Summary: [{status}] {site_url} -> {description}")

    time.sleep(DEFAULT_RATE_LIMIT_DELAY)
    logging.info("Scraping complete. The hardcore journey is done!")

if __name__ == "__main__":
    main()