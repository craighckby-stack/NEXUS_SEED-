import logging
from urllib.parse import urljoin

# --- Configuration Enhancement (Architectural Change) ---
# Define sensitive items structured by category and associated risk.
SENSITIVE_ITEMS = {
    "DB_ACCESS": {
        "paths": ["/db_dumps", "/phpmyadmin", "/adminer.php", "/sqldb"],
        "description": "Exposing database management interfaces or dump files."
    },
    "CONFIG_FILES": {
        "paths": [".env", "/config", "/settings.yaml", "/api_keys.json"],
        "description": "Exposure of environment or configuration files containing credentials."
    },
    "CMS_ADMIN": {
        "paths": ["/wp-admin", "/user/login", "/admin", "/management"],
        "description": "Common administrative or login interfaces, often targeted by scanners."
    },
    "BACKUP_ARTIFACTS": {
        "paths": ["/backup", "/temp", "/archives", "/old_versions"],
        "description": "Temporary or backup directories which may contain unindexed files."
    }
}

# Consolidate all paths for easier iteration
ALL_SENSITIVE_PATHS = {}
for category, details in SENSITIVE_ITEMS.items():
    for path in details['paths']:
        ALL_SENSITIVE_PATHS[path] = category


# Initialize logging
logger = logging.getLogger(__name__)
if not logger.handlers:
    # Use standard logging handlers setup
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(name)s - %(message)s')


def analyze_robots_txt(robots_content: str, site_url: str, verbose: bool = False) -> list:
    """
    Analyzes robots.txt for potential threats, misconfigurations, and compliance issues.
    Uses structured sensitive path definitions to provide richer analysis.
    Returns a list of structured threat indicators, including severity.
    """
    
    threat_indicators: list = []
    
    # 1. Preprocessing and Robust Line Parsing
    lines = [line.strip() for line in robots_content.splitlines()]

    for line in lines:
        if not line or line.startswith('#'):
            continue
        
        # Robust directive parsing (handling only the first colon)
        try:
            directive, *value_parts = [part.strip() for part in line.split(':', 1)]
            directive = directive.lower()
            value = value_parts[0].strip() if value_parts else ""

            # Handle potential inline comments after the value 
            if '#' in value:
                value = value.split('#', 1)[0].strip()

        except Exception:
            logger.debug(f"Skipping poorly formatted line: {line}")
            continue

        
        # A. Crawl Delay Check 
        if directive == "crawl-delay":
            threat_indicators.append({
                "type": "CRAWL_DELAY_PRESENT",
                "description": f"Crawl-delay directive found (Value: {value}). Indicates server rate limiting preference.",
                "severity": "LOW",
                "target": value
            })
        
        # B. Disallow/Allow Directives Analysis
        if directive in ["disallow", "allow"]:
            path = value
            
            # i. Wildcard Disallow Check
            if directive == "disallow":
                if path in ["/", "*", "/*"]:
                     threat_indicators.append({
                        "type": "GLOBAL_INDEXING_BLOCKED",
                        "description": f"Directive '{directive}: {path}' blocks entire site access. Review indexing strategy.",
                        "severity": "WARNING",
                        "target": path
                    })
            
            # ii. Sensitive Path Exposure Analysis
            for sensitive_path_key, category in ALL_SENSITIVE_PATHS.items():
                
                # Check for prefix match or exact match
                if path.startswith(sensitive_path_key):
                    
                    if directive == "disallow":
                         # Disallowing sensitive paths leaks their existence via robots.txt
                         threat_indicators.append({
                            "type": "SENSITIVE_PATH_DISALLOWED",
                            "description": f"Path '{sensitive_path_key}' is explicitly disallowed, hinting at its existence/sensitivity. Category: {category}.",
                            "target": sensitive_path_key,
                            "category": category,
                            "severity": "INFO"
                        })
                    
                    elif directive == "allow":
                         # Allowing sensitive paths leads to indexing risk (Critical severity)
                         threat_indicators.append({
                            "type": "SENSITIVE_PATH_ALLOWED",
                            "description": f"Path '{sensitive_path_key}' is explicitly ALLOWED. HIGH RISK of indexing sensitive files. Category: {category}.",
                            "target": sensitive_path_key,
                            "category": category,
                            "severity": "CRITICAL"
                        })

    
    if verbose and threat_indicators:
        logger.info(f"--- Robots.txt Analysis Results ({site_url}) ---")
        for indicator in threat_indicators:
            category_tag = f" ({indicator.get('category')})" if indicator.get('category') else ""
            logger.info(f"[{indicator['severity']:<8}] {indicator['type']}{category_tag}: {indicator['description']}")
    
    return threat_indicators


def parse_sitemap_from_robots(robots_content: str, site_url: str, verbose: bool = False) -> list:
    """Parses sitemap URLs from robots.txt, ensuring absolute URLs and handling comments."""
    sitemap_urls: list = []
    
    for line in robots_content.splitlines():
        line = line.strip()
        if not line.lower().startswith("sitemap:"):
            continue

        try:
            # Extract the value part robustly
            sitemap_url = line.split(":", 1)[1].strip()
            
            # Handle inline comments
            if '#' in sitemap_url:
                sitemap_url = sitemap_url.split('#', 1)[0].strip()

            # Ensure the sitemap URL is absolute
            if not sitemap_url.lower().startswith(("http://", "https://")):
                sitemap_url = urljoin(site_url, sitemap_url)
                
            if sitemap_url and sitemap_url not in sitemap_urls:
                sitemap_urls.append(sitemap_url)
        except IndexError:
             logger.warning(f"Malformed Sitemap directive found: {line}")
    
    if verbose and sitemap_urls:
        logger.info(f"Sitemap URLs found in robots.txt for {site_url}: {sitemap_urls}")
    
    return sitemap_urls


def analyze_sitemap(sitemap_url: str, site_url: str, verbose: bool = False) -> None:
    """
    (Placeholder Refactor)
    Analyzes a sitemap for potential indexing risks, deep internal paths, or mixed content.
    NOTE: Requires an HTTP client and XML parser library (e.g., 'requests' and 'xml.etree').
    """
    
    if verbose:
        logger.info(f"Sitemap analysis scheduled for: {sitemap_url}")
        logger.info("Function analyze_sitemap suggests next logical step: Fetch the URL, parse XML, and validate listed paths against security rules.")


# Example usage
if __name__ == "__main__":
    site_url = "https://example.com"
    robots_content = """
User-agent: Googlebot
Crawl-delay: 5

User-agent: *
Disallow: /
Disallow: /backup
Allow: /adminer.php # Test allow
Sitemap: https://example.com/sitemap.xml
Sitemap: /path/to/second_sitemap.xml # Relative path test
"""
    logger.setLevel(logging.INFO)
    
    print("--- Running Analysis ---")
    threat_indicators = analyze_robots_txt(robots_content, site_url, verbose=True)
    
    print("\n--- Running Sitemap Extraction ---")
    sitemap_urls = parse_sitemap_from_robots(robots_content, site_url, verbose=True)
    
    print("\n--- Running Sitemap Analysis Placeholder ---")
    for sitemap_url in sitemap_urls:
        analyze_sitemap(sitemap_url, site_url, verbose=True)
