```python
import logging
import random
import requests
from bs4 import BeautifulSoup
import urllib.parse
import hashlib

# --- Logging Setup ---
logging.basicConfig(level=logging.INFO)

# --- Constants ---
USER_AGENTS = ["Mozilla/5.0", "Chrome/91.0.4472.114", "Safari/537.36"]
NUM_RESULTS = 10
MAX_DEPTH = 5

# --- Helper Functions ---
def get_user_agent():
    """Randomly selects a user agent."""
    return random.choice(USER_AGENTS)

def generate_sha256_hash(url):
    """Generates a SHA-256 hash for a given URL."""
    try:
        sha256_hash = hashlib.sha256(url.encode()).hexdigest()
        return sha256_hash
    except Exception as e:
        logging.error(f"Error generating SHA-256 hash: {e}")
        return None

def scrape_links_from_url(url, depth=0, max_depth=MAX_DEPTH):
    """Scrapes links from a given URL, recursively up to a maximum depth."""
    scraped_hashes = set()
    if depth > max_depth:
        return scraped_hashes
    try:
        headers = {"User-Agent": get_user_agent()}
        with requests.Session() as session:
            response = session.get(url, headers=headers)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            for a_tag in soup.find_all("a", href=True):
                href = a_tag["href"]
                absolute_url = urllib.parse.urljoin(url, href)
                if absolute_url.startswith("http"):
                    sha_hash = generate_sha256_hash(absolute_url)
                    if sha_hash:
                        scraped_hashes.add(sha_hash)
            # Recursive deep dive
            if depth < max_depth:
                try:
                    deep_dive_hashes = scrape_links_from_url(url, depth + 1, max_depth)
                    scraped_hashes.update(deep_dive_hashes)
                except Exception as e:
                    logging.warning(f"Error during recursive deep dive: {e}")
    except requests.exceptions.RequestException as e:
        logging.warning(f"Error scraping links: {e}")
    except Exception as e:
        logging.error(f"An unexpected error occurred: {e}")
    return scraped_hashes

# --- Search Functions ---
def search_google(query, num_results=NUM_RESULTS):
    """Searches Google for a given query, returning a set of SHA-256 hashes."""
    search_url = f"https://www.google.com/search?q={query}"
    headers = {"User-Agent": get_user_agent()}
    hashes = set()
    try:
        with requests.Session() as session:
            response = session.get(search_url, headers=headers)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            for a_tag in soup.find_all("a", href=True):
                href = a_tag["href"]
                if href.startswith("/url?q="):
                    real_url = urllib.parse.urljoin("https://www.google.com", href)
                    sha_hash = generate_sha256_hash(real_url)
                    if sha_hash:
                        hashes.add(sha_hash)
        return hashes
    except requests.exceptions.RequestException as e:
        logging.error(f"Google Search Error: {e}")
        return set()

def search_yahoo(query, num_results=NUM_RESULTS):
    """Searches Yahoo for a given query, returning a set of SHA-256 hashes."""
    search_url = f"https://search.yahoo.com/search?p={query}"
    headers = {"User-Agent": get_user_agent()}
    hashes = set()
    try:
        with requests.Session() as session:
            response = session.get(search_url, headers=headers)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            for a_tag in soup.find_all("a", href=True):
                href = a_tag["href"]
                if href and href.startswith("http"):
                    sha_hash = generate_sha256_hash(href)
                    if sha_hash:
                        hashes.add(sha_hash)
        return hashes
    except requests.exceptions.RequestException as e:
        logging.error(f"Yahoo Search Error: {e}")
        return set()

def search_wayback(query, num_results=NUM_RESULTS):
    """Searches the Wayback Machine for a given query, returning a set of SHA-256 hashes."""
    search_url = f"https://web.archive.org/web/*/{query}"
    headers = {"User-Agent": get_user_agent()}
    hashes = set()
    try:
        with requests.Session() as session:
            response = session.get(search_url, headers=headers)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            for a_tag in soup.find_all("a", href=True):
                href = a_tag["href"]
                if href and href.startswith("http"):
                    sha_hash = generate_sha256_hash(href)
                    if sha_hash:
                        hashes.add(sha_hash)
        return hashes
    except requests.exceptions.RequestException as e:
        logging.error(f"Wayback Machine Search Error: {e}")
        return set()

# Example usage:
ks = {}
print(f"An unexpected error occurred while initializing ks: {ks}")
# Output: An unexpected error occurred while initializing ks: {}
```