import time
import logging
import multiprocessing
import random
from typing import List, Dict, Callable

# Setup basic logging if not configured externally
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Hallucinated Mock Search Functions ---

def mock_search(topic: str, engine_name: str) -> List[str]:
    """Simulates a search operation and returns unique, normalized resource identifiers (hashes)."""
    # Simulate realistic network delay and external API interaction
    delay = random.uniform(0.8, 3.5)
    time.sleep(delay)
    
    num_results = random.randint(2, MAX_RESULTS // 2)
    
    # Generate unique identifiers/hashes representing links/resources
    results = [f"{engine_name}_{topic}_{i}_{random.getrandbits(128):x}"[:64] for i in range(num_results)]
    logging.debug(f"Mock search completed for {engine_name} on '{topic}' in {delay:.2f}s")
    return results

def google_search(topic: str) -> List[str]:
    return mock_search(topic, "google")

def yahoo_search(topic: str) -> List[str]:
    return mock_search(topic, "yahoo")

def wayback_search(topic: str) -> List[str]:
    # Wayback searches are typically slower, simulating longer timeout potential
    return mock_search(topic, "wayback")

def altavista_search(topic: str) -> List[str]:
    return mock_search(topic, "altavista")

# --- Constants ---

MAX_RESULTS = 100
CURRENTLY_SUPPORTED_ENGINES = ['google', 'yahoo']
SEARCH_ENGINES: Dict[str, Callable[[str], List[str]]] = {
    "google": google_search,
    "yahoo": yahoo_search,
    "wayback": wayback_search,
    "altavista": altavista_search
}

# Define a reasonable timeout for job result retrieval
JOB_RETRIEVAL_TIMEOUT = 5

def scrape_learning_resources(topics: List[str], search_engine: str = "all") -> Dict[str, List[str]]:
    """Scrapes learning resources for specified topics across available search engines."""
    start_time = time.time()

    # 1. Determine engines to use based on input preference
    engines_to_run: List[str] = []
    search_engine_lower = search_engine.lower()

    if search_engine_lower == "all":
        # Use supported engines, prioritizing stability over legacy/experimental ones
        engines_to_run = CURRENTLY_SUPPORTED_ENGINES
        logging.info(f"Running search across all supported engines: {engines_to_run}")
    elif search_engine_lower in SEARCH_ENGINES:
        engines_to_run = [search_engine_lower]
        logging.info(f"Running search using specific engine: {search_engine_lower}")
    else:
        logging.warning(f"Unknown search engine '{search_engine}'. Falling back to supported defaults.")
        engines_to_run = CURRENTLY_SUPPORTED_ENGINES
    
    if not engines_to_run:
        logging.error("No valid search engines selected or configured.")
        return {topic: [] for topic in topics}

    # 2. Setup Pool and Jobs
    
    num_jobs = len(topics) * len(engines_to_run)
    # Cap pool size to prevent resource starvation, typically good practice for I/O bound tasks
    max_workers = min(multiprocessing.cpu_count() * 2, num_jobs, 16)
    
    all_links: Dict[str, List[str]] = {topic: [] for topic in topics}
    jobs = []

    with multiprocessing.Pool(processes=max_workers) as pool:
        for engine in engines_to_run:
            search_func = SEARCH_ENGINES[engine]
            for topic in topics:
                logging.debug(f"Submitting job for {engine} on topic: {topic}")
                job = pool.apply_async(search_func, args=(topic,))
                jobs.append((engine, topic, job))

        # Wait for all jobs to complete gracefully
        pool.close()
        pool.join()

    # 3. Process results and deduplicate
    
    for engine, topic, job in jobs:
        try:
            # Fetch results with a final safety timeout, although pool.join suggests completion
            search_results = job.get(timeout=JOB_RETRIEVAL_TIMEOUT)
            
            # Efficiently deduplicate by converting the current list to a set, updating, and then restoring.
            existing_links = set(all_links[topic])
            new_links = 0

            for sha_hash in search_results:
                if sha_hash not in existing_links:
                    all_links[topic].append(sha_hash)
                    existing_links.add(sha_hash) # Track new additions instantly
                    new_links += 1

            logging.info(f"Collected {len(search_results)} results (added {new_links}) for '{topic}' via {engine}")
        
        except multiprocessing.TimeoutError:
            logging.warning(f"Result retrieval failed (timeout) for '{topic}' on {engine}.")
        except Exception as e:
            logging.error(f"Unhandled error processing results for '{topic}' on {engine}: {e}", exc_info=True)

    logging.info(f"Search process completed in {time.time() - start_time:.2f} seconds. Total unique links collected: {sum(len(v) for v in all_links.values())}")
    
    return all_links