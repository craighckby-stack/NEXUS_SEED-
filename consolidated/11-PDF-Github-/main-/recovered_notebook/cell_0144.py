import requests
import xml.etree.ElementTree as ET
from urllib.robotparser import RobotFileParser
from typing import List, Tuple, Set
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed

# --- Configuration ---
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
SITEMAP_NS = "{http://www.sitemaps.org/schemas/sitemap/0.9}"
MAX_SITEMAP_WORKERS = 8
REQUEST_TIMEOUT = 15 

def extract_urls_from_sitemap(
    sitemap_url: str,
    session: requests.Session,
    current_depth: int = 1
) -> List[str]:
    """Recursively fetches and extracts URLs from a sitemap or sitemap index.
    Includes basic recursion depth limit and better error handling.
    """
    urls = []
    
    if current_depth > 5:
        logging.warning(f"Maximum recursion depth reached ({current_depth}) for {sitemap_url}. Skipping.")
        return []

    try:
        logging.info(f"[{current_depth}] -> Fetching sitemap: {sitemap_url}")
        
        headers = {'User-Agent': 'SovereignAGI/v94.1 Sitemap Analyzer (+https://github.com/sovereign-agi)'}
        response = session.get(sitemap_url, timeout=REQUEST_TIMEOUT, headers=headers)
        response.raise_for_status()
        
        root = ET.fromstring(response.content)

        if 'sitemapindex' in root.tag:
            # Handle sitemap index recursion
            for sitemap in root.findall(f".//{SITEMAP_NS}sitemap"):
                loc_element = sitemap.find(f"{SITEMAP_NS}loc") 
                if loc_element is not None and loc_element.text:
                    # Recursive call (sequential within this sitemap branch)
                    urls.extend(extract_urls_from_sitemap(
                        loc_element.text, 
                        session, 
                        current_depth + 1
                    ))
        else:
            # Handle standard sitemap
            for url in root.findall(f".//{SITEMAP_NS}url"):
                loc_element = url.find(f"{SITEMAP_NS}loc")
                if loc_element is not None and loc_element.text:
                    urls.append(loc_element.text)

        logging.info(f"[{current_depth}] Successfully extracted {len(urls)} URLs (or potential children) from {sitemap_url}")
        return urls

    except requests.RequestException as req_e:
        logging.error(f"[{current_depth}] HTTP/Connection error extracting URLs from sitemap {sitemap_url}: {req_e}")
        return []
    except ET.ParseError as parse_e:
        logging.error(f"[{current_depth}] XML parsing error for sitemap {sitemap_url}: {parse_e}")
        return []
    except Exception as e:
        logging.error(f"[{current_depth}] Unhandled error processing sitemap {sitemap_url}: {type(e).__name__}: {e}")
        return []


def analyze_robots_and_sitemaps(base_url: str) -> Tuple[Set[str], List[str]]:
    """Analyzes robots.txt permissions and concurrently extracts all discovered URLs from sitemaps."""
    robots_url = f"{base_url.rstrip('/')}/robots.txt"
    rp = RobotFileParser()
    rp.set_url(robots_url)
    
    all_extracted_urls: Set[str] = set()
    disallowed_paths: List[str] = []

    try:
        logging.info(f"--- Starting robots.txt analysis for {base_url} ---")
        
        # Fetch robots.txt explicitly for robust parsing
        try:
            robots_response = requests.get(robots_url, timeout=REQUEST_TIMEOUT)
            robots_response.raise_for_status()
            rp.parse(robots_response.text.splitlines())
        except requests.RequestException as e:
            logging.warning(f"Could not fetch robots.txt at {robots_url}. Using default rules. Error: {e}")

        
        # 1. Check common disallowed paths
        test_paths = ["/admin/", "/search", "/wp-admin/", "/api/"]
        for path in test_paths:
            full_path = f"{base_url.rstrip('/')}{path}"
            # Check permission for our specific User Agent and generic '*'
            if not rp.can_fetch("SovereignAGI", full_path) and not rp.can_fetch("*", full_path):
                disallowed_paths.append(path)
                logging.warning(f"Path {path} is disallowed (either for SovereignAGI or *).")
            else:
                logging.debug(f"Path {path} is allowed.")

        # 2. Process Sitemaps (Concurrent Execution)
        sitemap_urls = rp.site_maps()
        if sitemap_urls:
            logging.info(f"Found {len(sitemap_urls)} root Sitemap URLs. Processing concurrently...")
            
            with requests.Session() as session:
                with ThreadPoolExecutor(max_workers=MAX_SITEMAP_WORKERS) as executor:
                    future_to_url = {
                        executor.submit(extract_urls_from_sitemap, sitemap_url, session): sitemap_url
                        for sitemap_url in sitemap_urls
                    }
                    
                    for future in as_completed(future_to_url):
                        sitemap_url = future_to_url[future]
                        try:
                            extracted = future.result()
                            if extracted:
                                all_extracted_urls.update(extracted)
                        except Exception as exc:
                            logging.error(f'{sitemap_url} generated an unhandled exception: {exc}')

        else:
            logging.info("No Sitemap URLs found in robots.txt.")

    except Exception as e:
        logging.critical(f"Fatal error during robots/sitemap analysis for {base_url}: {type(e).__name__}: {e}")
    
    logging.info(f"Total unique URLs discovered: {len(all_extracted_urls)}")
    
    # Return unique extracted URLs (Set) and analysis findings (List)
    return all_extracted_urls, disallowed_paths

# Example Usage (assuming base_url is defined)
# base_url = "https://www.wikipedia.org"
# urls, paths = analyze_robots_and_sitemaps(base_url)
# print(f"\nExtracted URLs count: {len(urls)}")
# print(f"Disallowed Paths found: {paths}")