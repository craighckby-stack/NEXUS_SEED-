import logging
from bs4 import BeautifulSoup
import requests
from urllib.parse import urljoin, urlparse, parse_qs
from typing import Dict, List, Set, Callable
from abc import ABC, abstractmethod
from enum import Enum
import random
import time

# --- Constants and Utilities ---

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
    "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:53.0) Gecko/20100101 Firefox/53.0"
]

logging.basicConfig(level=logging.INFO)

def get_user_agent() -> str:
    """Get a random user agent."""
    return random.choice(USER_AGENTS)

def extract_google_url(href: str) -> str:
    """Extracts the true target URL from a Google redirect link."""
    try:
        query_params = parse_qs(urlparse(href).query)
        # Prioritize 'q' or 'url' parameters, which usually hold the target link.
        # Default to href if extraction fails.
        return query_params.get('url', query_params.get('q', [href]))[0]
    except Exception:
        return href

# --- Configuration and Interface Definitions ---

class SearchEngineType(Enum):
    """Enum for search engine types."""
    GOOGLE = "google"
    YAHOO = "yahoo"
    WAYBACK = "wayback"
    ALTAVISTA = "altavista"

class SearchEngineConfig:
    """Class for search engine configuration.
    Holds type, search URL, link selector, and link extraction function.
    """
    def __init__(self, search_type: SearchEngineType, config: Dict):
        self._search_type = search_type
        self._config = config

    def __getattr__(self, name):
        """Get attribute from config, supporting dynamic access."""
        if name in self._config:
            return self._config[name]
        # Provide safe defaults if accessing common fields
        if name == 'delay_seconds': return 0
        if name == 'retries': return 1
        
        raise AttributeError(f"Config attribute '{name}' not found for search type '{self._search_type.value}'")

class SearchEngineInterface(ABC):
    """Abstract base class for search engine interface."""
    @abstractmethod
    def scrape_links(self, url: str, current_depth: int = 0, max_depth: int = 1) -> Set[str]:
        """Scrape links from a starting URL, up to max_depth."""
        pass

# --- Core Implementation ---

class SearchEngine(SearchEngineInterface):
    """SearchEngine now performs depth-limited crawling using configured selectors."""
    def __init__(self, config: SearchEngineConfig):
        self._config = config
        self._link_selector: str = config.link_selector
        self._link_extraction_func: Callable[[str], str] = config.link_extraction

    def scrape_links(self, start_url: str, current_depth: int = 0, max_depth: int = 1) -> Set[str]:
        """Scrape links using an iterative Breadth-First Search (BFS) approach.
        Uses configuration for link selection and parsing.
        """
        if max_depth < 0: return set()

        all_scraped_links: Set[str] = set()
        to_visit: List[tuple[str, int]] = [(start_url, current_depth)]
        seen_urls: Set[str] = {start_url}

        logging.info(f"Starting crawl on {start_url} (Max Depth: {max_depth}) using {self._config.search_type.value} config.")

        while to_visit:
            current_url, depth = to_visit.pop(0) # BFS

            if depth > max_depth:
                continue

            delay = self._config.delay_seconds
            if delay > 0: time.sleep(delay)

            try:
                headers = {"User-Agent": get_user_agent()}
                with requests.Session() as session:
                    response = session.get(current_url, headers=headers, timeout=15)
                    response.raise_for_status()

                soup = BeautifulSoup(response.text, 'html.parser')
                newly_found_links = set()

                for a_tag in soup.select(self._link_selector):
                    href = a_tag.get("href")
                    if href:
                        # 1. Apply search engine specific extraction logic
                        processed_href = self._link_extraction_func(href)
                        
                        # 2. Resolve absolute URL
                        absolute_url = urljoin(current_url, processed_href)
                        
                        # 3. Filter and store
                        if absolute_url.startswith("http"):
                            all_scraped_links.add(absolute_url)
                            newly_found_links.add(absolute_url)

                if depth < max_depth:
                    next_depth = depth + 1
                    for link in newly_found_links:
                        # Only queue up links not yet scraped/visited
                        if link not in seen_urls and urlparse(link).netloc == urlparse(start_url).netloc: 
                            # Optional: restrict deep crawling to the initial domain for focus
                            seen_urls.add(link)
                            to_visit.append((link, next_depth))
                            
            except requests.exceptions.HTTPError as e:
                logging.warning(f"[{self._config._search_type.value}] HTTP Error {e.response.status_code} at {current_url}")
            except requests.exceptions.RequestException as e:
                logging.warning(f"[{self._config._search_type.value}] Connection Error: {e}")
            except Exception as e:
                logging.error(f"[{self._config._search_type.value}] Unexpected error at {current_url}: {e}")

        return all_scraped_links

# --- Configuration Data ---

search_engine_configs = {
    SearchEngineType.GOOGLE: {
        "search_url": "https://www.google.com",
        "link_selector": "a[href*='/url?']", # Select links that look like redirects
        "link_extraction": extract_google_url,
        "delay_seconds": 2
    },
    SearchEngineType.YAHOO: {
        "search_url": "https://search.yahoo.com",
        "link_selector": "a[href]", # General link selector for simplicity
        "link_extraction": lambda href: href, # Fixed lambda: returns the href itself
        "retries": 2
    },
    SearchEngineType.WAYBACK: {
        "search_url": "https://web.archive.org",
        "link_selector": "a[href]",
        "link_extraction": lambda href: href, # Fixed lambda
        "delay_seconds": 1
    },
    SearchEngineType.ALTAVISTA: { # Likely deprecated/redirected in reality, kept for structure
        "search_url": "https://web.archive.org", 
        "link_selector": "a[href]",
        "link_extraction": lambda href: href, # Fixed lambda
        "delay_seconds": 1
    }
}

initial_topics = [
    "Python programming",
    "JavaScript fundamentals"
]

# --- Execution Entry Point ---

def scrape_links_from_url(url: str, depth: int = 0, max_depth: int = 1) -> Set[str]:
    """Initialize SearchEngine for a specific type and start scraping."""
    engine_type = SearchEngineType.YAHOO # Switched to YAHOO/generic config since Google requires specific query handling
    search_engine_config = search_engine_configs[engine_type]
    config_obj = SearchEngineConfig(engine_type, search_engine_config)
    search_engine = SearchEngine(config_obj)
    
    # Note: Setting current_depth to 0 here assumes we start crawling immediately.
    return search_engine.scrape_links(url, depth, max_depth)

if __name__ == "__main__":
    # Example usage changed to a safe target for deep scraping (max_depth=1)
    url = "http://quotes.toscrape.com/"
    print(f"\n--- Starting Scrape of {url} (Depth {1}) ---")
    scraped_links = scrape_links_from_url(url, max_depth=1)
    
    print(f"\nFound {len(scraped_links)} unique links:")
    for link in sorted(list(scraped_links)):
        print(f" - {link}")
