import logging
import requests
from bs4 import BeautifulSoup
from typing import Dict, List, Set, Callable, Any
from user_agent import get_user_agent
import time
import multiprocessing
from functools import lru_cache
from urllib.parse import urlparse, parse_qs

# Set up basic logging for cleaner output
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')


# Project Context: Defining configuration types for clarity
Config = Dict[str, Any]
EngineConfig = Dict[str, Config]

def default_formatter(href: str) -> str:
    """Handles standard link formatting and cleanup, specifically for search engine tracking links."""
    # Specifically handling Google redirect links if the selector returns them
    if href.startswith("/url?q="):
        # Extract the real URL from the query parameter
        parsed = urlparse(href)
        q_params = parse_qs(parsed.query)
        if 'q' in q_params:
            return q_params['q'][0]
    
    # Handle relative paths (e.g., //example.com)
    if href.startswith("//"):
        return "http:" + href
    
    return href

# Global Configuration Dictionary
search_engine_config: EngineConfig = {
    "google": {
        "search_url": "https://www.google.com/search?q={}",
        # Updated selector for better modern compatibility
        "link_selector": "div.g a", 
        "url_formatter": default_formatter,
        "retries": 3
    },
    "bing": {
        "search_url": "https://www.bing.com/search?q={}",
        "link_selector": "li.b_algo h2 a",
        "url_formatter": default_formatter,
        "retries": 2
    }
}

@lru_cache(maxsize=None)
def get_search_engine_config(engine_name: str) -> Config:
    """
    Retrieves search engine configuration.

    Args:
    engine_name (str): Name of the search engine.

    Returns:
    Dict: Configuration dictionary for the search engine.
    """
    if engine_name not in search_engine_config:
        raise ValueError(f"Engine configuration not found for: {engine_name}")
    return search_engine_config[engine_name]


def search_engine(engine_name: str, query: str, num_retries: int) -> Set[str]:
    """
    Search engine function to retrieve links from search results.

    Args:
    engine_name (str): Name of the search engine.
    query (str): Search query.
    num_retries (int): Number of retries for failed requests.

    Returns:
    Set[str]: Set of links retrieved from search results.
    """
    try:
        config = get_search_engine_config(engine_name)
    except ValueError:
        logging.warning(f"Search engine '{engine_name}' not configured.")
        return set()

    search_url = config["search_url"].format(query) 
    headers = {"User-Agent": get_user_agent()}
    links: Set[str] = set()
    
    for attempt in range(num_retries + 1):
        try:
            logging.debug(f"Attempt {attempt + 1}/{num_retries + 1}: Searching {engine_name} for '{query}'")
            with requests.Session() as session:
                # Added timeout for safety
                response = session.get(search_url, headers=headers, timeout=15)
                response.raise_for_status() 
                
                soup = BeautifulSoup(response.text, 'html.parser')
                link_selector = config["link_selector"]
                url_formatter = config["url_formatter"]

                for a_tag in soup.select(link_selector):
                    href = a_tag.get("href")
                    if not href:
                        continue
                    
                    try:
                        real_url = url_formatter(href) 
                        
                        if real_url and (real_url.startswith("http://") or real_url.startswith("https://")):
                            links.add(real_url)
                            
                    except Exception as e:
                        logging.warning(f"Error processing link '{href}': {e}")
            
            return links 

        except requests.exceptions.RequestException as e:
            logging.warning(f"{engine_name} request failed (Attempt {attempt + 1}): {type(e).__name__}. Waiting 2s...")
            if attempt < num_retries:
                time.sleep(2)
            else:
                logging.error(f"Failed to scrape {engine_name} for '{query}' after {num_retries + 1} attempts.")
                return set()
        except Exception as e:
            logging.error(f"An unexpected error occurred during scraping {engine_name}: {e}")
            return set()


def scrape_learning_resources(topics: List[str]) -> Dict[str, List[str]]:
    """
    Scrape learning resources from search engines using multiprocessing.
    """
    start_time = time.time()
    
    engines_to_use = list(search_engine_config.keys())
    
    tasks_to_run = []
    for engine in engines_to_use:
        try:
            config = get_search_engine_config(engine)
            retries = config.get("retries", 3)
            for topic in topics:
                tasks_to_run.append((engine, topic, retries))
        except ValueError:
            logging.warning(f"Skipping engine {engine}: configuration error.")
            continue
    
    if not tasks_to_run:
        logging.error("No valid topics or search engines configured for scraping.")
        return {}

    
    max_processes = min(multiprocessing.cpu_count() * 2, len(tasks_to_run))
    logging.info(f"Starting scraping using {max_processes} processes for {len(tasks_to_run)} tasks.")
    
    jobs = []
    with multiprocessing.Pool(processes=max_processes) as pool:
        
        # Submit jobs
        for engine, topic, retries in tasks_to_run:
            job = pool.apply_async(search_engine, 
                                   args=(engine, topic, retries), 
                                   error_callback=lambda err: logging.error(f"Job execution failed: {err}"))
            jobs.append({"engine": engine, "topic": topic, "job": job})

        pool.close() 

        topic_results: Dict[str, Set[str]] = {}
        
        # Collect results
        for job_spec in jobs:
            engine = job_spec["engine"]
            topic = job_spec["topic"]
            job = job_spec["job"]
            
            try:
                # Use a reasonable timeout for job retrieval
                search_results: Set[str] = job.get(timeout=45) 
                
                # Aggregate into sets for automatic deduplication across engines/tasks
                if topic not in topic_results:
                    topic_results[topic] = set()
                topic_results[topic].update(search_results)
                
            except multiprocessing.TimeoutError:
                logging.warning(f"Task for {topic} (Engine: {engine}) timed out.")
            except Exception as e:
                logging.error(f"Error retrieving results for {topic} from {engine}: {e}")

    # Finalize structure: Convert Sets to sorted Lists
    final_results = {topic: sorted(list(links)) for topic, links in topic_results.items()}
    
    end_time = time.time()
    elapsed_time = end_time - start_time
    logging.info(f"Scraping successfully aggregated results in {elapsed_time:.2f} seconds.")
    
    return final_results

if __name__ == "__main__":
    # Setup example for demonstration purposes
    topics = ["topic1", "topic2"]
    results = scrape_learning_resources(topics)
    
    print("\n--- Final Results Summary ---")
    for topic, links in results.items():
        print(f"\nTopic: {topic} (Found {len(links)} links)")
        for link in links[:3]:
            print(f"  - {link}")