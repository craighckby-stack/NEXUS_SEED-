import hashlib
import logging
import random
from bs4 import BeautifulSoup
from requests import Session
from urllib.parse import urljoin, urlparse
from typing import Set, Deque, Tuple
from collections import deque

# --- Utilities ---

# Define user agents
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:53.0) Gecko/20100101 Firefox/53.0",
    "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:45.0) Gecko/20100101 Firefox/45.0"
]

# Configure logging upfront for class use
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def get_random_user_agent() -> str:
    """Selects a random user agent from the list."""
    return random.choice(USER_AGENTS)

def generate_sha256_hash(url: str) -> str:
    """Generates a SHA-256 hash for a given URL."""
    try:
        # Ensure encoding for consistency
        sha256_hash = hashlib.sha256(url.encode('utf-8'))
        return sha256_hash.hexdigest()
    except Exception as e:
        logging.error(f"Error generating SHA-256 hash for URL segment: {e}")
        return ""

# Type alias for the queue element: (url, current_depth)
CrawlQueueItem = Tuple[str, int]

# --- Crawler Class ---

class LinkCrawler:
    """
    Synchronous Breadth-First Search (BFS) web crawler optimized for link extraction.
    Enforces same-domain constraints and tracks visited state via SHA-256 hashes.
    """
    
    def __init__(self, start_url: str, max_depth: int = 1, timeout: int = 10):
        # Configuration
        self.start_url: str = start_url
        self.max_depth: int = max_depth
        self.timeout: int = timeout
        
        # State management (using Requests Session)
        self.session: Session = Session()
        self.visited_hashes: Set[str] = set()
        self.final_hashes: Set[str] = set()
        self.queue: Deque[CrawlQueueItem] = deque()
        
        # Determine the allowed domain for scoping the crawl
        self._initialize_scope(start_url)

    def _initialize_scope(self, url: str) -> None:
        """Extracts and sets the allowed domain from the start URL."""
        try:
            parsed_url = urlparse(url)
            self.allowed_domain: str = parsed_url.netloc
            if not self.allowed_domain:
                 raise ValueError("Could not parse domain from start URL.")
        except Exception as e:
            logging.error(f"Invalid start URL provided; scope disabled: {e}")
            self.allowed_domain = ""

    def _is_url_in_scope(self, url: str) -> bool:
        """Checks if the given URL belongs to the allowed domain."""
        if not self.allowed_domain:
            return False 
        
        try:
            netloc = urlparse(url).netloc
            # Basic check to ensure the link belongs to the origin host
            return netloc == self.allowed_domain
        except Exception:
            return False

    def _process_url(self, current_url: str, current_depth: int) -> None:
        """Handles fetching, parsing, and link queuing for a single URL."""
        
        logging.info(f"[D={current_depth}] Processing: {current_url}")

        if current_depth >= self.max_depth:
            return # Do not process links if we hit max depth on current node

        try:
            headers = {"User-Agent": get_random_user_agent()}
            response = self.session.get(current_url, headers=headers, timeout=self.timeout)
            response.raise_for_status() # Raises HTTPError for bad status codes

            soup = BeautifulSoup(response.text, 'html.parser')

            next_depth = current_depth + 1

            for a_tag in soup.find_all("a", href=True):
                href = a_tag["href"]
                absolute_url = urljoin(current_url, href)

                if not absolute_url.startswith("http"):
                    continue 
                
                # Scope Check (Major improvement over previous version)
                if not self._is_url_in_scope(absolute_url):
                    logging.debug(f"Skipping out-of-scope URL: {absolute_url}")
                    continue

                sha_hash = generate_sha256_hash(absolute_url)

                if sha_hash and sha_hash not in self.visited_hashes:
                    self.visited_hashes.add(sha_hash)
                    self.final_hashes.add(sha_hash)
                    
                    # Only queue if within the bounds for the next level
                    if next_depth <= self.max_depth:
                        self.queue.append((absolute_url, next_depth))
                        logging.debug(f"Queued: {absolute_url}")

        except Exception as e:
            # Catch connection, timeout, or parsing errors
            logging.warning(f"[D={current_depth}] Failed to fetch/process {current_url}: {type(e).__name__} - {e}")

    def run(self) -> Set[str]:
        """Executes the synchronous BFS crawl."""
        
        start_hash = generate_sha256_hash(self.start_url)
        if not start_hash or not self.allowed_domain:
            logging.error("Crawl initialization failed (invalid URL/domain). Aborting.")
            return set()

        # Initialize queue and state
        self.queue.append((self.start_url, 0))
        self.visited_hashes.add(start_hash)
        self.final_hashes.add(start_hash)

        while self.queue:
            current_url, current_depth = self.queue.popleft()
            
            self._process_url(current_url, current_depth)

        logging.info(f"Crawl finished. Found {len(self.final_hashes)} unique hashes up to depth {self.max_depth}.")
        return self.final_hashes

# Example usage updated for class structure
if __name__ == "__main__":
    # The root logging level is set globally above
    
    url = "http://example.com" 
    
    crawler = LinkCrawler(start_url=url, max_depth=1)
    scraped_hashes = crawler.run()
    
    print("-" * 30)
    print(f"Summary: Found {len(scraped_hashes)} unique link hashes.")