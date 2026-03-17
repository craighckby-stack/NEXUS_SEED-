import time
import json
import logging
from multiprocessing import Pool
from typing import Dict, List

# Set up logging
logging.basicConfig(level=logging.INFO)

# Define search functions
search_engines = {
    "google": lambda topic: google_search(topic),
    "yahoo": lambda topic: yahoo_search(topic),
    "wayback": lambda topic: wayback_search(topic),
    "altavista": lambda topic: altavista_search(topic)
}

def scrape_learning_resources(topics: List[str]) -> None:
    """Scrapes SHA-256 hashes for learning global jobs"""
    start_time = time.time()

    # Determine search engines to use
    engines_to_use = ["all"] if SEARCH_ENGINE == "all" else [SEARCH_ENGINE]

    # Create a dictionary to store search results
    results = {topic: [] for topic in topics}

    # Create a pool of worker processes
    with Pool(processes=min(len(engines_to_use), len(topics))) as pool:
        jobs = []
        for engine in engines_to_use:
            for topic in topics:
                logging.info(f"Submitting job for {engine} on {topic}")
                job = pool.apply_async(search_engines[engine], args=(topic,))
                jobs.append((engine, topic, job))

        # Wait for all jobs to complete
        pool.close()
        pool.join()

        # Process search results
        for engine, topic, job in jobs:
            try:
                search_results = job.get(timeout=10)
                if topic not in all_links:
                    all_links[topic] = []
                for sha_hash in search_results:
                    if sha_hash not in all_links[topic]:
                        all_links[topic].append(sha_hash)
                logging.info(f"Collected results for {topic} using {engine}")
            except multiprocessing.TimeoutError:
                logging.warning(f"Search on {topic} using {engine} timed out")
            except Exception as e:
                logging.error(f"Error during search on {topic} using {engine}: {e}")

    # Save links to a JSON file
    save_links()

    # Display links
    display_links()

    # Log completion time
    end_time = time.time()
    elapsed_time = end_time - start_time
    logging.info(f"Search completed in {elapsed_time:.2f} seconds")

def save_links() -> None:
    """Saves the all_links dictionary (SHA-256 hashes) to a JSON file"""
    try:
        with open("universal_links.json", "w") as f:
            json.dump(all_links, f)
        logging.info("SHA-256 hashes saved.")
    except Exception as e:
        logging.error(f"Error saving SHA-256 hashes: {e}")

def display_links() -> None:
    """Displays the SHA-256 hashes, grouped by topic"""
    if all_links:
        html_output = "<h2>Collected SHA-256 Hashes</h2>"
        for topic, hashes in all_links.items():
            html_output += f"<h3>{topic}</h3>"
            for sha_hash in hashes:
                url = get_url(sha_hash)
                html_output += f"<p>{sha_hash}: {url}</p>"
        print(html_output)

def get_url(sha_hash: str) -> str:
    """Returns the URL associated with a SHA-256 hash"""
    for engine, topic2, job in jobs:
        if topic == topic2:
            try:
                search_results = job.get(timeout=10)
                for line in search_results:
                    if sha_hash in line:
                        return line
            except Exception as e:
                logging.error(f"Error finding URL for {sha_hash}: {e}")
    return ""

def google_search(topic: str) -> List[str]:
    # Implement Google search logic here
    pass

def yahoo_search(topic: str) -> List[str]:
    # Implement Yahoo search logic here
    pass

def wayback_search(topic: str) -> List[str]:
    # Implement Wayback search logic here
    pass

def altavista_search(topic: str) -> List[str]:
    # Implement Altavista search logic here
    pass