import requests
from bs4 import BeautifulSoup
import urllib.parse
from urllib.parse import urljoin
import logging
import hashlib
import random
from typing import List, Dict, Optional, Callable

# --- Type Definitions ---

SearchResult = Dict[str, str]

# --- Configuration and Setup ---

NUM_RESULTS = 10
REQUEST_TIMEOUT = 15

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Define standard selectors for known engines (This assumes a static, known structure, which is a necessary abstraction for brittle scraping)
SERP_SELECTORS = {
    "duckduckgo": {
        "base_url": "https://duckduckgo.com/",
        "query_param": "q",
        "result_link": "a[rel='nofollow'][data-testid='result-link']",  # Highly specialized DDG selector
        "title_tag": "h2",
        "snippet_tag": ".result__snippet, .search-result__snippet", 
        "url_attr": "href"
    },
    # Future engines could be added here (e.g., "bing", "yahoo")
}

# --- Utilities ---

def get_user_agent() -> str:
    """Provides a randomized user agent string for requests."""
    user_agents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.3 Safari/605.1.15",
        "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:110.0) Gecko/20100101 Firefox/110.0"
    ]
    return random.choice(user_agents)

def generate_sha(url: str) -> str:
    """Generates a SHA256 hash of the URL for unique identification and caching."""
    return hashlib.sha256(url.encode('utf-8')).hexdigest()

# --- Engine-Specific Parsing Logic ---

def _parse_known_engine(soup: BeautifulSoup, engine_config: Dict, search_url: str, num_results: int, seen_hashes: set) -> List[SearchResult]:
    """
    Uses specialized CSS selectors defined in engine_config to extract SERP data.
    This improves reliability over generic H2/H3 heuristics for known targets.
    """
    results: List[SearchResult] = []
    selectors = engine_config

    for result_container in soup.select(selectors["result_link"]):
        if len(results) >= num_results:
            break

        a_tag = result_container # Assuming the selector points directly to the anchor or a container holding necessary info
        
        href = a_tag.get(selectors["url_attr"])
        if not href:
            continue

        # Resolve URL relative to the search page
        url = urljoin(search_url, href)
        url_hash = generate_sha(url)

        if url_hash in seen_hashes:
            continue

        # Attempt to find title (could be inside or adjacent to the link)
        title_tag = a_tag.select_one(selectors["title_tag"])
        title = title_tag.text.strip() if title_tag else "(No Title Found)"

        # Attempt to find snippet (often found via complex sibling/parent logic, here simplified to a selector relative to the link/container)
        snippet_tag = a_tag.find_next_sibling(selectors["snippet_tag"])
        snippet = snippet_tag.text.strip() if snippet_tag else ""

        seen_hashes.add(url_hash)

        results.append({
            "url": url,
            "title": title,
            "snippet": snippet,
            "sha256": url_hash
        })
        
    return results


def _parse_generic_heuristic(soup: BeautifulSoup, search_url: str, num_results: int, seen_hashes: set) -> List[SearchResult]:
    """
    Fallback heuristic based on common SERP structures (H2/H3 links).
    (Kept for compatibility with unknown/unlisted search engines)
    """
    results: List[SearchResult] = []

    for h_tag in soup.find_all(['h2', 'h3']):
        if len(results) >= num_results:
            break
            
        a_tag = h_tag.find('a', href=True)
        if a_tag:
            href = a_tag["href"]
            title = h_tag.text.strip()
            url = urljoin(search_url, href)

            url_hash = generate_sha(url)
            if url_hash in seen_hashes:
                continue
                
            snippet_tag = a_tag.find_next_sibling(['p', 'div']) # Basic snippet assumption
            snippet = snippet_tag.text.strip() if snippet_tag else ""
            
            seen_hashes.add(url_hash)
            
            results.append({
                "url": url,
                "title": title,
                "snippet": snippet,
                "sha256": url_hash
            })
            
    return results


# --- Search Dispatcher ---

def search_engine(engine_name: str, query: str, num_results: int = NUM_RESULTS) -> List[SearchResult]:
    """
    Performs a specialized web search based on the defined engine configuration.
    
    Args:
        engine_name: The internal name of the search engine (e.g., 'duckduckgo').
        query: The search term.
        num_results: Maximum number of results to return.
        
    Returns:
        A list of search results.
    """
    engine_name = engine_name.lower()
    config = SERP_SELECTORS.get(engine_name)

    if not config:
        logger.error(f"Unknown engine '{engine_name}'. Falling back to generic search utility.")
        # For external compatibility, we define a fallback URL for generic scraping, though it's discouraged.
        search_url = "https://startpage.com/sp/search" # A reasonable generic starting point
        parser_func: Callable = _parse_generic_heuristic
        query_param = "query"
    else:
        search_url = config["base_url"]
        query_param = config["query_param"]
        parser_func = lambda s, u, n, h: _parse_known_engine(s, config, u, n, h)

    if not search_url or not query:
        logger.warning("Search URL or query is empty.")
        return []

    headers = {"User-Agent": get_user_agent()}
    seen_hashes = set()
    
    try:
        search_params = {query_param: query}
        
        with requests.Session() as session:
            logger.info(f"Searching {engine_name} ({search_url}) for query: '{query}'")
            response = session.get(
                search_url, 
                params=search_params, 
                headers=headers, 
                timeout=REQUEST_TIMEOUT
            )
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'lxml' if requests.session().trust_env else 'html.parser') # Use lxml if available/safe

            results = parser_func(soup, search_url, num_results, seen_hashes)

            if not results:
                logger.warning(f"Zero results found using specialized parsing for {engine_name}. Attempting generic heuristic fallback.")
                # If specialized parsing fails, try the generic one only if it wasn't the primary parser
                if parser_func != _parse_generic_heuristic:
                    results = _parse_generic_heuristic(soup, search_url, num_results, seen_hashes)

            logger.info(f"Successfully retrieved {len(results)} results from {engine_name}.")
            return results
            
    except requests.exceptions.HTTPError as e:
        logger.error(f"HTTP error during search: {e}")
    except requests.exceptions.RequestException as e:
        logger.error(f"Connection error during search: {e}")
    except Exception as e:
        logger.error(f"Unexpected parsing error in search_engine: {e}", exc_info=True)
        
    return []
