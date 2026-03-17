import logging
import requests
import re
from datetime import datetime

# Initialize logging configuration
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Global State (Persistent Memory and Log)
persistent_memory = {'threat_indicators': {}}
robots_log = {}

# --- Stubbed Persistence Functions ---
def save_robots_log(log_data):
    """Save robots log to file (Placeholder)."""
    # Implement log saving logic here
    pass

def save_persistent_memory(memory_data):
    """Save persistent memory to file (Placeholder)."""
    # Implement memory saving logic here
    pass

# --- Analysis Utility ---
def check_robots_accessibility(robots_url):
    """Check if robots.txt is accessible (exists and returns 200/300 status)."""
    try:
        # Use HEAD request to minimize bandwidth
        response = requests.head(robots_url, timeout=5)
        # Check for success codes (2xx) or redirection (3xx)
        return 200 <= response.status_code < 400
    except requests.exceptions.RequestException as e:
        logging.debug(f"Request Error checking robots.txt accessibility for {robots_url}: {e}")
        return False

# --- Threat Analysis Functions (Hallucinated) ---
def analyze_robots_txt(robots_content, site_url, verbose_mode):
    """Analyze robots.txt content for common security threat indicators."""
    threat_indicators = []
    lines = robots_content.splitlines()

    # 1. Check for known sensitive paths being explicitly disallowed (indicates resource name disclosure)
    for line in lines:
        line = line.strip()
        if re.search(r'Disallow: /(admin|private|config|secrets|backup)', line, re.IGNORECASE):
            threat_indicators.append({
                'type': 'STRUCTURE_DISCLOSURE',
                'description': f"Explicitly disallowing sensitive path in robots.txt: '{line}'",
                'details': line
            })
    
    # 2. Check for overly permissive setup
    if "User-agent: *" in robots_content and "Disallow: /" not in robots_content:
        threat_indicators.append({
            'type': 'LACK_OF_BASIC_SECURITY',
            'description': 'No explicit catch-all Disallow directive found for the general user-agent (*).',
            'details': 'May expose unintended common service paths.'
        })

    return threat_indicators

def parse_sitemap_from_robots(robots_content, site_url, verbose_mode):
    """Parse sitemap URLs from robots.txt."""
    sitemap_urls = []
    lines = robots_content.splitlines()
    for line in lines:
        line = line.strip()
        if line.lower().startswith('sitemap:'):
            try:
                url = line.split(':', 1)[1].strip()
                if url:
                    sitemap_urls.append(url)
            except IndexError:
                logging.warning(f"Malformed Sitemap directive found: {line}")
    return sitemap_urls

def analyze_sitemap(sitemap_url, site_url, verbose_mode):
    """Analyze sitemap URL for potential threat indicators (Hallucinated Logic)."""
    sitemap_threats = []
    
    # 1. Check for external resource linkage
    if requests.utils.urlparse(sitemap_url).netloc != requests.utils.urlparse(site_url).netloc:
        sitemap_threats.append({
            'type': 'EXTERNAL_RESOURCE_LINKAGE',
            'description': f'Sitemap points to an external resource/domain: {sitemap_url}',
            'details': 'Could indicate unintended dependency.'
        })

    # 2. Check for protocol inconsistencies (e.g., exposing HTTP link if site is HTTPS)
    if site_url.startswith('https') and sitemap_url.startswith('http://') and not sitemap_url.startswith('https://'):
        sitemap_threats.append({
            'type': 'MIXED_CONTENT_EXPOSURE',
            'description': f'Sitemap URL uses insecure HTTP protocol: {sitemap_url}',
            'details': 'Exposes potential downgrade path or mixed content issues.'
        })

    return sitemap_threats

# --- Main Processing Logic ---
def analyze_robots_content(robots_content, site_url, verbose_mode):
    """Analyze robots.txt content and status.

    The status formerly known as 'writable' is now 'accessibility'.
    """
    description = 'Standard content analysis performed.'
    
    if check_robots_accessibility(f"{site_url}/robots.txt"):
        accessibility_status = 'Accessible (HTTP 2xx/3xx)'
    else:
        accessibility_status = 'Inaccessible/Not Found (HTTP 4xx/5xx)'

    threat_indicators = analyze_robots_txt(robots_content, site_url, verbose_mode)
    if threat_indicators:
        description += f'. Found {len(threat_indicators)} security indicators in robots.txt content.'
        # Update persistent memory
        persistent_memory['threat_indicators'][site_url] = {
            'description': threat_indicators[0]['description'],
            'source': 'Robots Content Analysis',
            'details': threat_indicators[0].get('details', 'No details provided.')
        }

    return description, accessibility_status, threat_indicators

def process_robots_txt(robots_content, site_url, verbose_mode):
    """Process robots.txt, analyze threats, and log results in a robust manner."""
    
    log_entry = {
        'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        'status': 'Error',
        'description': '',
        'accessibility': 'Unknown', # Renamed from 'writable'
        'threat_indicators': []
    }

    try:
        description, accessibility_status, robots_threats = analyze_robots_content(
            robots_content, site_url, verbose_mode
        )
        
        log_entry['description'] = description
        log_entry['accessibility'] = accessibility_status
        log_entry['threat_indicators'].extend(robots_threats)

        sitemap_urls = parse_sitemap_from_robots(robots_content, site_url, verbose_mode)
        sitemap_threat_count = 0
        
        for sitemap_url in sitemap_urls:
            sitemap_threats = analyze_sitemap(sitemap_url, site_url, verbose_mode)
            if sitemap_threats:
                log_entry['threat_indicators'].extend(sitemap_threats)
                sitemap_threat_count += len(sitemap_threats)

        if sitemap_threat_count > 0:
            log_entry['description'] += f' ({sitemap_threat_count} sitemap findings).' 

        log_entry['status'] = 'Success'
        

    except requests.exceptions.RequestException as e:
        log_entry['status'] = 'Request Error'
        log_entry['description'] = f'Request error during processing (e.g., sitemap fetching): {e}'
        logging.error(f'Request Error during processing for {site_url}: {e}')

    except Exception as e:
        log_entry['status'] = 'Unexpected Error'
        log_entry['description'] = f'Unexpected error processing robots.txt/sitemap: {e}'
        logging.error(f'Unexpected error processing {site_url}: {e}')
    
    finally:
        # Ensure log structure handles multiple entries per site
        if site_url not in robots_log:
            robots_log[site_url] = []
        
        robots_log[site_url].append(log_entry)

        # Persistence save actions
        save_robots_log(robots_log)
        save_persistent_memory(persistent_memory)

# Example usage
if __name__ == "__main__":
    site_url = "https://example.com"
    # Simulating content that discloses a private directory and links a separate HTTP sitemap
    robots_content = """User-agent: *
Disallow: /cgi-bin/
Disallow: /secrets/api_keys
Sitemap: http://example.com/sitemap_insecure.xml
Allow: /"""
    verbose_mode = True
    process_robots_txt(robots_content, site_url, verbose_mode)
