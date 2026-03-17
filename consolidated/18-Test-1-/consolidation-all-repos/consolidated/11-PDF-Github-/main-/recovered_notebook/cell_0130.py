import re
import requests
from urllib.parse import urlsplit
from typing import List, Optional, Set

# --- Core URL Utilities ---

def extract_gov_urls(text: str) -> List[str]:
    """
    Extracts all .gov URLs from the provided text.

    Args:
        text (str): The text to extract URLs from.

    Returns:
        list: A list of extracted .gov URLs.
    """
    # Robust pattern supporting standard URL characters and percent-encoding
    pattern = r'https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+\.gov(?:/[^ \n\r\t]*)?'
    urls = re.findall(pattern, text)
    return urls

def get_base_url(url: str) -> str:
    """
    Extracts the base URL (scheme and netloc) from a given URL.

    Args:
        url (str): The URL to extract the base URL from.

    Returns:
        str: The base URL.
    """
    parsed_url = urlsplit(url)
    return f"{parsed_url.scheme}://{parsed_url.netloc}"

# --- Security/Log Analysis ---

def find_threat_indicators(log_data: str) -> List[str]:
    """
    Identifies lines containing "threat indicators" (case-insensitive).
    
    Args:
        log_data (str): The log data to search for threat indicators.

    Returns:
        list: A list of lines containing threat indicators.
    """
    # Using list comprehension for performance and clarity
    return [
        line 
        for line in log_data.splitlines() 
        if "threat indicators" in line.lower()
    ]

# --- Network Operations (Refactored) ---

def fetch_robots_txt(base_url: str) -> Optional[str]:
    """
    Attempts to fetch the content of robots.txt for a given base URL,
    handling specific network errors.

    Args:
        base_url (str): The root URL (e.g., https://example.gov).

    Returns:
        Optional[str]: The content of robots.txt, or None if fetching failed.
    """
    robots_url = f"{base_url.rstrip('/')}/robots.txt"
    headers = {'User-Agent': 'SovereignAGIv94/1.0 (Robots.txt Analysis)'}
    
    try:
        response = requests.get(robots_url, headers=headers, timeout=7)
        
        if response.status_code == 404:
            # print(f"[{base_url}] robots.txt not found (404).") # Internal printing moved to main
            return None
            
        response.raise_for_status() # Raise exception for 4xx/5xx responses
        return response.text
        
    except requests.exceptions.RequestException as e:
        print(f"[{base_url}] Network or HTTP error fetching robots.txt: {e}")
        return None
    except Exception as e:
        print(f"[{base_url}] An unexpected critical error occurred: {e}")
        return None


def main():
    log_data = """
    Access log entry: GET /index.html 200 1200
    https://data.gov/path/to/resource?id=123
    ALERT: Found potential threat indicators in session 456.
    http://sub.agency.gov/api/v1
    Ignore line
    Line containing THREAT INDICATORS (caps).
    """
    
    print("--- 1. Extracting .gov URLs ---")
    extracted_urls = extract_gov_urls(log_data)
    for url in extracted_urls:
        print(f"Found URL: {url}")
    
    print("\n--- 2. Finding Threat Indicators ---")
    threat_indicators = find_threat_indicators(log_data)
    for line in threat_indicators:
        print(f"Indicator Line: {line.strip()}")
        
    print("\n--- 3. Analyzing robots.txt ---")
    
    # Process unique base URLs only
    base_urls: Set[str] = {get_base_url(url) for url in extracted_urls}
    
    if not base_urls:
        print("No base URLs derived from extracted data.")
        return

    for url in sorted(list(base_urls)):
        print(f"\n[Processing Base URL: {url}]")
        robots_content = fetch_robots_txt(url)
        
        if robots_content:
            sitemap_count = robots_content.lower().count("sitemap:")
            print(f"Fetched Successfully (Length: {len(robots_content)} bytes)")
            print(f"   > Sitemaps referenced: {sitemap_count}")
            
        elif robots_content is None:
             # fetch_robots_txt prints the error itself if it wasn't a 404/Connection issue.
             # For 404 (handled internally), we still report missing.
             pass # Error handling done inside fetch_robots_txt for network failures

if __name__ == "__main__":
    main()