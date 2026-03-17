import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

# --- Utilities ---
def log_message(message, level):
    print(f"[{level}] {message}")


def get_sensitive_paths():
    # Extended list focused on root-level application paths or configuration exposure
    return [
        "/admin", "/wp-admin", "/login", "/dashboard", "/api/v1", 
        "/config", "/db_backup", "/.git", "/.env", "/test", "/dev", "/backup"
    ]


def analyze_sitemap(
    sitemap_url: str,
    site_url: str, # Base site URL (used for contextual reporting/filtering)
    verbose: bool = False,
    session: requests.Session = None,
    current_depth: int = 0,
    max_depth: int = 5
) -> list:
    """Fetches and analyzes a sitemap for security indicators (sensitive paths, parsing errors, recursive analysis)."""
    
    threat_indicators = []
    sensitive_paths = get_sensitive_paths()

    if current_depth > max_depth:
        log_message(f"Exceeded max recursion depth ({max_depth}) at {sitemap_url}", "WARNING")
        add_threat = {
            'type': 'sitemap_recursion_limit',
            'description': f'Stopped processing sitemap due to recursion depth limit: {sitemap_url}',
            'severity': 'low'
        }
        threat_indicators.append(add_threat)
        return threat_indicators

    if session is None:
        session = requests.Session()

    log_prefix = f"[D={current_depth}]"

    # --- 1. Fetching ---
    try:
        response = session.get(sitemap_url, timeout=15)
        response.raise_for_status()  # Raise HTTPError for bad responses (4xx or 5xx)
        sitemap_content = response.text
        log_message(f"{log_prefix} Successfully fetched sitemap from {sitemap_url}", "DEBUG" if verbose else "INFO")
    
    except requests.exceptions.RequestException as e:
        log_message(f"{log_prefix} Error fetching sitemap from {sitemap_url}: {e}", "ERROR")
        add_threat = {
            'type': 'sitemap_fetch_error',
            'description': f'Error fetching sitemap: {e}',
            'url': sitemap_url,
            'severity': 'high'
        }
        threat_indicators.append(add_threat)
        return threat_indicators

    # --- 2. Basic Sitemap Analysis (XML parsing) ---
    if sitemap_url.lower().endswith(('.xml', '.gz')):
        # Note: requests handles standard gzip content-encoding automatically if headers are present.
        try:
            soup = BeautifulSoup(sitemap_content, 'xml')

            # Check for sitemap index (Recursive Analysis)
            if soup.find('sitemapindex'):
                log_message(f"{log_prefix} Sitemap index found in {sitemap_url}. Recursing.", "DEBUG" if verbose else "INFO")
                for sitemap in soup.find_all('sitemap'):
                    loc = sitemap.find('loc')
                    if loc:
                        next_sitemap_url = loc.text.strip()
                        # Ensure the URL is absolute before recursing
                        if not urlparse(next_sitemap_url).netloc:
                            next_sitemap_url = urljoin(sitemap_url, next_sitemap_url)
                        
                        sitemap_threats = analyze_sitemap(
                            next_sitemap_url, 
                            site_url, 
                            verbose, 
                            session, 
                            current_depth=current_depth + 1,
                            max_depth=max_depth
                        )
                        threat_indicators.extend(sitemap_threats)

            else:
                # Analyze URLs in the standard sitemap
                for url in soup.find_all('url'):
                    loc = url.find('loc')
                    if loc:
                        url_loc = loc.text.strip()
                        
                        # Enhanced check for sensitive web application paths
                        # We use canonical comparison against the parsed path part
                        parsed_url = urlparse(url_loc)
                        path = parsed_url.path

                        for sensitive_path in sensitive_paths:
                            if path.startswith(sensitive_path) or (path.startswith('/') and path.endswith(sensitive_path)):
                                add_threat = {
                                    'type': 'sitemap_sensitive_path',
                                    'description': f'Sensitive path found in sitemap listing.',
                                    'url': url_loc,
                                    'path_match': sensitive_path,
                                    'severity': 'medium'
                                }
                                threat_indicators.append(add_threat)
                                log_message(f"{log_prefix} Found sensitive path: {url_loc}", "WARNING")
                                break # Move to the next URL once a match is found

        except Exception as e:
            # Catch parsing errors (e.g., malformed XML)
            log_message(f"{log_prefix} Error parsing XML sitemap from {sitemap_url}: {e}", "ERROR")
            add_threat = {
                'type': 'sitemap_parsing_error',
                'description': f'Error parsing XML sitemap: {e}',
                'url': sitemap_url,
                'severity': 'high'
            }
            threat_indicators.append(add_threat)
            
    else:
        log_message(f"{log_prefix} Skipping non-XML sitemap type: {sitemap_url}", "DEBUG")
        # Could add logic here to handle plain text sitemaps if necessary

    return threat_indicators

# Placeholder definition (retained for completeness/API structure)
def is_robots_writable(robots_url):
    # TODO: Implement actual robots write test logic here.
    return False