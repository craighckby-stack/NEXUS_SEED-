import requests
import json
import urllib.parse
import hashlib
import logging
import multiprocessing
import time
from typing import Set, Dict, List, Tuple

# Configure basic logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Constants and Configuration ---
WAYBACK_CDX_API = "http://web.archive.org/cdx/search/cdx"
NUM_RESULTS = 500  # Increased default limit suitable for API searching
currentPath = 'wayback_machine_scraper/wayback_machine_scraper.py'

# --- Helper Functions ---

def get_user_agent():
    return "SovereignAGI/v94.1 (WaybackScraper; +https://github.com/SovereignAGI/v94.1)"

def generate_sha(data: str) -> str:
    """Generates a SHA256 hash from a string."""
    return hashlib.sha256(data.encode('utf-8')).hexdigest()

def construct_snapshot_url(original_url: str, timestamp: str) -> str:
    """Constructs a readable Wayback Machine snapshot URL."""
    return f"https://web.archive.org/web/{timestamp}/{original_url}"

# --- Core Wayback Interaction ---

def search_wayback(target_url_pattern: str, num_results: int = NUM_RESULTS) -> Set[str]:
    """
    Searches the Wayback Machine CDX API for snapshots of a given URL pattern.
    Returns unique snapshot URLs.

    Args:
        target_url_pattern (str): The URL pattern (e.g., "example.com/*") to search.
        num_results (int): The maximum number of snapshots to retrieve.

    Returns:
        Set[str]: A set of unique Wayback Machine snapshot URLs.
    """
    params = {
        'url': target_url_pattern,
        'output': 'json',
        'limit': num_results,
        'fl': 'original,timestamp', # Request specific fields
        'filter': 'statuscode:200',
        'collapse': 'digest' # Only return unique content (optional, but good practice)
    }
    
    headers = {"User-Agent": get_user_agent()}
    snapshots = set()

    try:
        logging.info(f"Querying CDX API for pattern: {target_url_pattern}")
        with requests.Session() as session:
            response = session.get(WAYBACK_CDX_API, params=params, headers=headers, timeout=20)
            response.raise_for_status()
            
            records = response.json()
            
            if not records or len(records) <= 1:
                logging.info(f"No snapshots found for {target_url_pattern}.")
                return snapshots
            
            # Skip header row (records[0])
            for record in records[1:]:
                original_url, timestamp = record[0], record[1]
                snapshot_url = construct_snapshot_url(original_url, timestamp)
                snapshots.add(snapshot_url)

    except requests.exceptions.RequestException as e:
        logging.error(f"CDX API request failed for {target_url_pattern}: {e}")
        return set()
    except json.JSONDecodeError:
        logging.error(f"Failed to decode JSON response from CDX API for {target_url_pattern}.")
        return set()

    logging.info(f"Found {len(snapshots)} unique snapshots for {target_url_pattern}.")
    return snapshots

# --- Deep Dive / Scraping Functions ---

def scrape_deep_dive(snapshot_url: str) -> Set[str]:
    """
    MOCK: Simulates scraping a specific archived page and extracting internal links.
    Returns a set of hashes of discovered related content.
    """
    # This function should fetch the URL, parse it, and extract new links.
    # Since the original implementation expected hashes back, we adhere to that for architectural consistency.
    
    logging.debug(f"Deep diving into snapshot: {snapshot_url}")
    
    # Example: Check if the snapshot URL contains a common trigger word
    if "python" in snapshot_url.lower():
        # Return hashes of hypothetical deep links found on this page
        return {
            generate_sha(f"http://example-deep-link-1/{hashlib.md5(snapshot_url.encode()).hexdigest()}"),
            generate_sha(f"http://example-deep-link-2/{hashlib.md5(snapshot_url.encode()).hexdigest()}")
        }
    return set()

# --- Orchestration ---

def scrape_learning_resources(topics: List[str]) -> Dict[Tuple[str, str], Set[str]]:
    """
    Scrapes learning resources from the defined search engines using multiprocessing.
    Note: Topics must be convertible to URL search patterns (e.g., "*.python.org/*").

    Args:
        topics (list): A list of URL search patterns/domains.

    Returns:
        dict: A dictionary of search results, keyed by (search_engine, topic) -> Set of Hashes.
    """
    start_time = time.time()
    search_engines = {
        "wayback": search_wayback,
    }

    all_collected_hashes = {}

    # Using cpu_count - 1 to leave resources for system/other threads
    max_processes = min(multiprocessing.cpu_count() - 1, len(topics)) or 1
    
    with multiprocessing.Pool(processes=max_processes) as pool:
        initial_jobs = []
        for engine, search_func in search_engines.items():
            for topic in topics:
                logging.info(f"Submitting initial Wayback search for pattern: {topic}")
                # search_wayback returns URLs (snapshot strings)
                job = pool.apply_async(search_func, args=(topic, ))
                initial_jobs.append((engine, topic, job))
        
        # Wait for initial snapshot collection
        pool.close()
        pool.join()

        # Process results and initiate deep dives (serial for simplicity here, could be parallelized)
        deep_dive_jobs = []
        for engine, topic, job in initial_jobs:
            snapshot_urls = job.get() # Get the Set[str] of snapshot URLs
            
            total_hashes = set()
            if snapshot_urls:
                logging.info(f"Starting deep dive into {len(snapshot_urls)} snapshots for {topic}.")
                
                # Submitting deep dive jobs
                for url in list(snapshot_urls)[:10]: # Limit deep dives to top 10 snapshots per topic
                    deep_dive_job = pool.apply_async(scrape_deep_dive, args=(url,))
                    deep_dive_jobs.append(((engine, topic), deep_dive_job))
                
                # Reinitialize pool (or reuse if designed to stay open, but safer to manage chunks)
                # NOTE: For simplicity, if we reuse the pool, we must wait for all deep dive jobs
                
            # Store initial results structure, though deep dive results must be collected later
            all_collected_hashes[(engine, topic)] = total_hashes # Placeholder for final results

    # Recalculating results collection to handle sequential waiting on deep dive jobs outside the main pool block
    # A clean architecture would use concurrent futures or a dedicated results collector.
    # Since the existing multiprocessing structure expects results mapping per topic, we will iterate again:

    final_results = {}
    # Re-use pool initialization outside for simplified execution flow in this mock
    # (In real life, this should be done better, e.g., Concurrent.futures ThreadPoolExecutor)

    total_hashes_map: Dict[Tuple[str, str], Set[str]] = {}
    for (engine, topic), job in deep_dive_jobs:
        if (engine, topic) not in total_hashes_map:
            total_hashes_map[(engine, topic)] = set()
        try:
            hashes = job.get()
            total_hashes_map[(engine, topic)].update(hashes)
        except Exception as e:
            logging.warning(f"Deep dive job failed for {topic}: {e}")

    end_time = time.time()
    logging.info(f"Scraping completed in {end_time - start_time:.2f} seconds.")
    
    return total_hashes_map

# --- Main Execution --- 

def main():
    # Example topics are now expected to be URL patterns or domains
    # e.g., to find learning resources on Python, search relevant domains
    topics = ["*.python.org/*", "*.scikit-learn.org/*", "github.com/topics/data-science"]
    
    # Increase logging visibility for main
    logging.getLogger().setLevel(logging.INFO)
    
    results = scrape_learning_resources(topics)
    for (engine, topic), hashes in results.items():
        print(f"Results for {engine} - {topic} (Found {len(hashes)} unique content hashes via deep dive)")

def main_v2():
    main() # Call main which includes enhanced logging

def function_to_adjust_code():
    return main_v2()

def transformed_code():
    main_v2()