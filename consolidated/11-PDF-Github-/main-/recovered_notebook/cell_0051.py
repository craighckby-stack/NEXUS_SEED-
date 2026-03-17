# Import necessary libraries
import ipywidgets as widgets
from bs4 import BeautifulSoup
import requests
import json
import pyperclip
import time
import random
import multiprocessing
from multiprocessing import Pool
import logging
from IPython.display import display, HTML
from urllib.parse import urljoin, parse_qs, urlparse
from bs4.element import Comment
import os
from typing import List, Dict, Optional, Callable

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Engine-Specific Parsing Functions ---

def _extract_google_links(html_content: str, base_url: str) -> List[str]:
    """Specific parser for Google search result links.
    Targets the /url?q= format used for result redirection.
    """
    soup = BeautifulSoup(html_content, 'html.parser')
    links = []
    for link_tag in soup.find_all('a', href=True):
        href = link_tag['href']
        
        # Standard Google result links
        if href.startswith('/url?q='):
            parsed_url_parts = parse_qs(urlparse(href).query)
            actual_url = parsed_url_parts.get('q', [None])[0]
            
            if actual_url and not any(ext in actual_url for ext in ['.pdf', '.zip', '.exe']) and "google.com" not in actual_url:
                links.append(actual_url)
    
    # Use a set to ensure uniqueness
    return list(set(links))

# NOTE: For Bing and DDG, we rely on generic extraction unless specific classes are known.
# Adding a generic extraction fallback for robustness.
def _extract_generic_serp_links(html_content: str, base_url: str) -> List[str]:
    """Extracts standard absolute links from generic SERP content.
    This is less reliable than targeted parsing.
    """
    soup = BeautifulSoup(html_content, 'html.parser')
    tags = soup.find_all('a', href=True)
    
    links = []
    for tag in tags:
        href = tag['href']
        abs_link = urljoin(base_url, href)
        
        # Heuristic filtering for non-internal/non-tracking links
        if abs_link.startswith('http') and base_url not in abs_link and 'aclk' not in abs_link:
             if not any(ext in abs_link for ext in ['.pdf', '.zip', '.exe']):
                links.append(abs_link)
                
    return list(set(links))

# --- Configuration Management ---
class Config:
    """Central configuration hub for the research assistant."""

    class Search:
        ENGINE = "google"  # Default engine
        NUM_RESULTS_TO_FETCH = 5 # Number of topics to process
        MAX_LINKS_PER_TOPIC = 10 # Max links to extract from the SERP
        
        # Maps engine identifiers to their search URL templates and specific parsers
        ENGINE_CONFIG: Dict[str, Dict[str, str or Callable]] = {
            "google": {
                "url": "https://www.google.com/search?q={topic}",
                "parser": _extract_google_links
            },
            "bing": {
                "url": "https://www.bing.com/search?q={topic}",
                "parser": _extract_generic_serp_links # Fallback
            },
            "duckduckgo": {
                "url": "https://duckduckgo.com/?q={topic}",
                "parser": _extract_generic_serp_links # Fallback
            }
        }

    class Processes:
        MAX = 4  # Adjusted max processes for better resource management in notebooks

    class Timeout:
        VALUE = 15 

    class DeepDive:
        MAX_DEPTH = 2

# --- Data Management Classes ---
class UserAgent:
    # [UserAgent class definition remains the same]
    """Manages a pool of common, standard user agents."""
    AGENTS: List[str] = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Safari/605.1.15",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.101 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:90.0) Gecko/20100101 Firefox/90.0",
        "Mozilla/5.0 (Android 11; Mobile; rv:91.0) Gecko/91.0 Firefox/91.0"
    ]

    @staticmethod
    def get_random_agent() -> str:
        return random.choice(UserAgent.AGENTS)

class Topic:
    # [Topic class definition remains the same]
    """Defines the initial list of research topics."""
    LIST: List[str] = [
        "Python programming best practices 2024",
        "Optimizing machine learning deployment",
        "Rust vs Go performance comparison",
        "Serverless architecture security concerns",
        "Vector databases explained",
        "React.js server components",
        "Cloud computing costs optimization (FinOps)",
        "Cybersecurity threats 2024",
    ]


# --- Core Web Scraping Utilities ---

def tag_visible(element):
    # [tag_visible function remains the same]
    """Helper function to determine if a Beautiful Soup element contains visible text."""
    if element.parent.name in ['style', 'script', 'head', 'title', 'meta', '[document]']:
        return False
    if isinstance(element, Comment):
        return False
    # Check if the element is empty or only whitespace
    if str(element).strip() == '':
        return False
    return True

def extract_text(html_content: str) -> str:
    # [extract_text function remains the same]
    """Extracts human-readable text from HTML content, excluding boilerplate."""
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Remove unwanted elements that typically clutter extracted text
    for element in soup(["script", "style", "nav", "footer", "header", "form", "noscript"]):
        element.decompose()

    # Get visible text fragments
    texts = soup.findAll(text=True)
    visible_texts = filter(tag_visible, texts)
    
    # Combine and normalize whitespace
    return ' '.join(t.strip() for t in visible_texts).replace('\n', ' ').replace('\r', ' ').strip()


# --- Search and Retrieval Logic ---

def fetch_page_content(url: str) -> Optional[str]:
    """Handles HTTP request with random UA and defined timeout."""
    try:
        headers = {'User-Agent': UserAgent.get_random_agent()}
        response = requests.get(url, timeout=Config.Timeout.VALUE, headers=headers, allow_redirects=True)
        response.raise_for_status()
        return response.text
    except requests.RequestException as e:
        logging.error(f"Error fetching URL {url}: {e}")
        return None


def retrieve_serp_links(topic: str, engine: str) -> Optional[Dict[str, List or str]]:
    """
    Performs search and attempts to retrieve actual result links from the SERP (Search Engine Results Page).
    Utilizes engine-specific parsers for better link extraction accuracy.
    """
    engine = engine.lower()
    
    engine_config = Config.Search.ENGINE_CONFIG.get(engine)
    if not engine_config:
        logging.warning(f"Unsupported search engine: {engine}. Skipping.")
        return None
        
    template = engine_config['url']
    parser_func = engine_config['parser']
    
    # Replace spaces with + for standard query formatting
    query_url = template.format(topic=topic.replace(" ", "+"))
    
    logging.info(f"Searching for '{topic}' using {engine} at {query_url}")
    
    html_content = fetch_page_content(query_url)
    
    if html_content:
        # 1. Extract raw text from the SERP (useful snippet)
        text = extract_text(html_content)
        
        # 2. Use specific parser to get targeted links
        links = parser_func(html_content, query_url)
        
        # 3. Limit the number of links returned
        return {
            'topic': topic,
            'links': links[:Config.Search.MAX_LINKS_PER_TOPIC],
            'serp_text': text
        }
    
    return None

# --- Parallel Processing Unit ---

def run_topic_search(topic: str) -> Optional[Dict]:
    """Wrapper for search function suitable for multiprocessing pool."""
    return retrieve_serp_links(topic, Config.Search.ENGINE)

# --- Display Logic ---

def display_results(result: Dict):
    """Renders structured results for IPython display."""
    if not result:
        return

    topic = result['topic']
    relevant_links = result['links']
    text_snippet = result['serp_text'][:500] + '...' if len(result['serp_text']) > 500 else result['serp_text']
    
    display(HTML(f"<hr><h2>Topic: {topic}</h2>"))
    
    display(HTML(f"<h3>Extracted Links ({len(relevant_links)}):</h3>"))
    if relevant_links:
        link_html = "<ul>" + "".join([f"<li><a href='{link}'>{link}</a></li>" for link in relevant_links]) + "</ul>"
        display(HTML(link_html))
    else:
        display(HTML("<p>No relevant SERP links extracted.</p>"))
        
    display(HTML(f"<h3>SERP Text Snippet:</h3>"))
    display(HTML(f"<pre style='white-space: pre-wrap; word-wrap: break-word; background-color: #f7f7f7; padding: 10px; border-radius: 5px;'>{text_snippet}</pre>"))

# Main function
def main():
    """Executes parallel research across topics and displays results sequentially."""
    topics = Topic.LIST
    topics_to_run = topics[:Config.Search.NUM_RESULTS_TO_FETCH]
    
    logging.info(f"Starting parallel research on {len(topics_to_run)} topics using {Config.Processes.MAX} processes.")
    
    multiprocessing.freeze_support()
    
    with Pool(processes=Config.Processes.MAX) as pool:
        # Map the search function across all topics
        # Results is a list of Dictionaries (or None)
        search_results = pool.map(run_topic_search, topics_to_run)

    # Sequential display of results (necessary because IPython display objects rely on the main process thread)
    for result in search_results:
        display_results(result)

# Run main function
if __name__ == "__main__":
    main()