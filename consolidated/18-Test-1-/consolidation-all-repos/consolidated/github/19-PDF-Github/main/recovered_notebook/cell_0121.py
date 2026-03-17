import xml.etree.ElementTree as ET
# NOTE: Assuming necessary infrastructure imports (log_message, make_request, USER_AGENT)

def parse_sitemap_from_robots(robots_content, site_url, verbose=False):
    """Parses sitemap URLs from robots.txt."""
    sitemap_urls = []
    for line in robots_content.splitlines():
        line = line.strip()
        if line and line.lower().startswith("sitemap:"):
            # Use partition for clearer split logic and robustness against malformed input
            _, _, sitemap_url = line.lower().partition("sitemap:")
            sitemap_url = sitemap_url.strip()
            if sitemap_url:
                sitemap_urls.append(sitemap_url)
    if verbose and sitemap_urls:
        log_message(f"Sitemap URLs found in robots.txt for {site_url}: {sitemap_urls}", "INFO")
    return sitemap_urls

def _fetch_sitemap_content(sitemap_url):
    """Fetches sitemap content and handles basic connectivity errors."""
    try:
        # Assuming make_request, USER_AGENT exist globally or imported
        response = make_request(sitemap_url, headers={'User-Agent': USER_AGENT}, timeout=15)
        if response is None or response.status_code >= 400:
            status = response.status_code if response else 'No Response'
            log_message(f"Failed to fetch sitemap from {sitemap_url}. Status: {status}", "ERROR")
            return None, {
                'type': 'sitemap_fetch_error',
                'description': f'Failed to fetch sitemap (Status: {status})',
                'severity': 'high'
            }
        log_message(f"Successfully fetched sitemap from {sitemap_url}", "DEBUG")
        return response.text, None
    except Exception as e:
        log_message(f"Exception during sitemap fetch for {sitemap_url}: {e}", "ERROR")
        return None, {
            'type': 'sitemap_analyze_error',
            'description': f'Unexpected error during fetching: {e}',
            'severity': 'high'
        }

def _check_url_for_threats(url_loc):
    """Applies specific security checks and canonical validation to an extracted URL."""
    threats = []
    
    # Expanded check for common exposed management/sensitive paths and files
    SENSITIVE_PATHS = ['wp-admin', 'admin', 'login', '.git', '.env', 'config.php', 'api/v1/users', 'test.php', 'backup.zip']
    if any(path in url_loc for path in SENSITIVE_PATHS):
        threats.append({
            'type': 'exposed_sensitive_path',
            'description': f'Sensitive web application path exposed in sitemap: {url_loc}',
            'severity': 'medium'
        })
        
    # Check for non-standard schemes or relative paths (if the sitemap claims absolute URLs)
    if not (url_loc.startswith('http://') or url_loc.startswith('https://')):
         threats.append({
            'type': 'non_absolute_url',
            'description': f'URL is not absolute or uses non-standard scheme: {url_loc}',
            'severity': 'low'
        })
        
    return threats

def analyze_sitemap(sitemap_url, site_url, verbose=False, max_depth=5):
    """
    Analyzes a sitemap for potential issues, handling sitemap indexes recursively.
    Uses ElementTree for efficient XML parsing (replacing BeautifulSoup).
    """
    if max_depth <= 0:
        log_message(f"Max recursion depth reached for {sitemap_url}", "WARNING")
        return []
    
    threat_indicators = []
    
    sitemap_content, fetch_error = _fetch_sitemap_content(sitemap_url)
    if fetch_error:
        threat_indicators.append(fetch_error)
        return threat_indicators

    try:
        # Using ElementTree (ET) for faster parsing and reduced external dependency footprint.
        root = ET.fromstring(sitemap_content)
        
        is_sitemap_index = root.tag.endswith('sitemapindex')
        is_url_set = root.tag.endswith('urlset')
        
        if is_sitemap_index:
            log_message(f"Sitemap index found in {sitemap_url}. Recursing.", "DEBUG")
            for sitemap_element in root.findall('sitemap'):
                loc = sitemap_element.find('loc')
                if loc is not None and loc.text:
                    index_url = loc.text.strip()
                    
                    # Check for external indexing which might violate scope
                    if not index_url.startswith(site_url) and site_url not in index_url:
                        threat_indicators.append({
                            'type': 'sitemap_external_index',
                            'description': f'Sitemap index references external domain: {index_url}',
                            'severity': 'medium'
                        })
                        continue

                    sitemap_threats = analyze_sitemap(index_url, site_url, verbose, max_depth - 1)
                    threat_indicators.extend(sitemap_threats)
        
        elif is_url_set:
            log_message(f"URL set found in {sitemap_url}. Processing URLs.", "DEBUG")
            url_count = 0
            for url_element in root.findall('url'):
                url_count += 1
                loc = url_element.find('loc')
                if loc is not None and loc.text:
                    url_loc = loc.text.strip()
                    threat_indicators.extend(_check_url_for_threats(url_loc))
            
            if url_count > 50000:
                log_message(f"Sitemap {sitemap_url} contains excessive URLs ({url_count}). Potential attack surface sprawl detected.", "WARNING")

        else:
             log_message(f"Sitemap content for {sitemap_url} recognized root tag ({root.tag}) was not standard (urlset/sitemapindex).", "WARNING")

    except ET.ParseError as e:
        log_message(f"Failed to parse sitemap XML (ET ParseError) for {sitemap_url}: {e}", "ERROR")
        threat_indicators.append({
            'type': 'sitemap_parse_error',
            'description': f'Failed to parse sitemap XML (ParseError): {e}',
            'severity': 'high'
        })
    except Exception as e:
        log_message(f"Unexpected processing error for {sitemap_url}: {e}", "ERROR")
        threat_indicators.append({
            'type': 'sitemap_process_error',
            'description': f'Unexpected general error during analysis: {type(e).__name__}',
            'severity': 'high'
        })
        
    return threat_indicators