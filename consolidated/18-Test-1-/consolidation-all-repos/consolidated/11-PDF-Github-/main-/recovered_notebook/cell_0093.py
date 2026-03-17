import logging
import requests
import warnings
import time
import multiprocessing
from bs4 import BeautifulSoup
from typing import List, Dict, Any, Optional
from itertools import product
from concurrent.futures import ThreadPoolExecutor
from time import perf_counter
from dataclasses import dataclass

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Define constants
MAX_RETRIES = 3
DEFAULT_SEARCH_ENGINE = "googlix_v1"
SEARCH_ENGINE_MODE = "all" 

@dataclass
class EngineConfig:
    """Structured configuration for a search engine, replacing raw dictionary lookup."""
    name: str
    robots_txt_pattern: str # Expected base URL of the site containing robots.txt
    search_url_template: str
    url_formatter_template: str = "{href}" # Default identity formatter

# Placeholder/Hallucinated Configuration Data
search_engine_map: Dict[str, EngineConfig] = {
    "googlix_v1": EngineConfig(
        name="Googlix Search V1",
        robots_txt_pattern="http://knowledgebase.googlix.com/robots.txt",
        search_url_template="https://api.googlix.com/v1/query?q={query}",
        url_formatter_template="https://api.googlix.com/redirect?id={href}&type=external"
    ),
    "inquire_beta": EngineConfig(
        name="Inquire Index Beta",
        robots_txt_pattern="https://inquire.ai/kb/robots.txt",
        search_url_template="https://inquire.ai/search?q={query}",
    )
}

def get_user_agent() -> str:
    """Return a user agent string. V94.1 standard spoofing."""
    return "SovereignAGI/v94.1 (+https://agi-sovereign.net)"

def parse_search_engine_config(engine_name: str) -> Optional[EngineConfig]:
    """Return search engine configuration object for the given engine name."""
    if engine_name not in search_engine_map:
        logging.warning(f"Search engine '{engine_name}' not found")
        return None
    return search_engine_map[engine_name]

def extract_robotstxt_urls(engine_config: EngineConfig, query: str) -> List[str]:
    """Extract relevant URLs from search engine results based on robots_txt_pattern matching."""
    
    search_url = engine_config.search_url_template.format(query=query)
    headers = {"User-Agent": get_user_agent()}
    robotstxt_urls = []
    
    # Prepare base pattern for URL matching (e.g., matching the knowledge base root, not just the file)
    base_pattern = engine_config.robots_txt_pattern.rsplit('/', 1)[0]

    for attempt in range(MAX_RETRIES + 1):
        try:
            with requests.Session() as session:
                # Added reasonable timeout for robust scraping
                response = session.get(search_url, headers=headers, timeout=15)
                response.raise_for_status()
                
                # Fix missing import and ensure filtering logic is safe
                warnings.filterwarnings("ignore", category=requests.packages.urllib3.exceptions.InsecureRequestWarning)
                
                soup = BeautifulSoup(response.text, 'html.parser')
                
                for a_tag in soup.select('a[href]'):
                    href = a_tag["href"]
                    try:
                        real_url = engine_config.url_formatter_template.format(href=href)
                        
                        # Check if the extracted link matches the known knowledge base pattern
                        if real_url.startswith(base_pattern):
                            robotstxt_urls.append(real_url)
                            
                    except Exception as e:
                        # CRITICAL FIX: Changed 'break' to 'continue' to process all links on the page
                        logging.debug(f"Error processing URL ({href}) in {engine_config.name}: {e}. Continuing...")
                        continue 
            
            # If successful, exit retry loop
            return list(set(robotstxt_urls)) # Deduplicate
            
        except requests.exceptions.RequestException as e:
            logging.error(f"{engine_config.name} request attempt {attempt+1}/{MAX_RETRIES + 1} failed: {e}")
            if attempt < MAX_RETRIES:
                time.sleep(2**attempt) # Exponential backoff
            else:
                return [] 
        except Exception as e:
            logging.error(f"An unexpected error occurred during parsing: {e}")
            return [] 
            
    return []

def scrape_learning_resources(topics: List[str], num_threads: int = 0):
    """Scrape learning resources from search engines using ThreadPoolExecutor."""
    start_time = perf_counter()
    
    engines_to_use = list(search_engine_map.keys()) if SEARCH_ENGINE_MODE == "all" else [DEFAULT_SEARCH_ENGINE]
    tasks = list(product(engines_to_use, topics))
    
    if num_threads == 0:
        # Set aggressive concurrency for I/O bound tasks, capped at 64 workers.
        effective_workers = min(64, max(multiprocessing.cpu_count() * 5, len(tasks)))
    else:
        effective_workers = num_threads

    robotstxt_urls_all = []
    logging.info(f"Starting scrape with {effective_workers} workers for {len(tasks)} tasks.")
    
    with ThreadPoolExecutor(max_workers=effective_workers) as executor:
        futures = {}
        for engine_name, topic in tasks:
            config = parse_search_engine_config(engine_name)
            if config:
                future = executor.submit(extract_robotstxt_urls, config, topic)
                futures[(engine_name, topic)] = future

        for (engine_name, topic), future in futures.items():
            try:
                robotstxt_urls = future.result(timeout=30)
                robotstxt_urls_all.extend(robotstxt_urls)
                logging.info(f"Collected {len(robotstxt_urls)} URLs for {topic} using {engine_name}")
            except TimeoutError:
                logging.error(f"Search on {engine_name} for '{topic}' timed out (30s).")
            except Exception as e:
                logging.error(f"Unhandled error during result retrieval for {engine_name}: {e}")
                
    final_urls = list(set(robotstxt_urls_all))
    display_robots_txt_urls(final_urls)
    
    end_time = perf_counter()
    elapsed_time = end_time - start_time
    logging.info(f"Search completed, found {len(final_urls)} unique URLs in {elapsed_time:.2f} seconds")

def display_robots_txt_urls(robotstxt_urls: List[str]):
    # Display only the robotstxt URLs
    if not robotstxt_urls:
        logging.info("No robotstxt related URLs found.")
        return
    logging.info("--- Discovered Relevant URLs ---")
    for url in robotstxt_urls:
        print(url)
    logging.info("------------------------------")