import logging
import random
import requests
from bs4 import BeautifulSoup
import urllib.parse

# --- Logging Setup ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

# --- Constants ---
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.3",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:66.0) Gecko/20100101 Firefox/66.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.106 Safari/537.36",
    # Add more user agents as needed
]

# --- Helper Functions ---
def get_user_agent() -> str:
    """Randomly selects a user agent from the list."""
    return random.choice(USER_AGENTS)

def scrape_links_from_url(url: str, max_depth: int = 1) -> set[str]:
    """Scrapes links from a given URL, recursively up to max_depth."""
    scraped_links: set[str] = set()

    if max_depth == 0:
        return scraped_links

    try:
        headers = {
            "User-Agent": get_user_agent(),
            "Accept": "*/*",
            "Accept-Encoding": "gzip, deflate",
            "Accept-Language": "en-US,en;q=0.9"
        }
        with requests.Session() as session:
            response = session.get(url, headers=headers, timeout=5)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            for a_tag in soup.find_all("a", href=True):
                href = a_tag["href"]
                absolute_url = urllib.parse.urljoin(url, href)
                if absolute_url.startswith("http"):
                    scraped_links.add(absolute_url)
            # Recursive deep dive
            if max_depth > 1:
                try:
                    deep_dive_links = list(scraped_links)
                    scraped_links.update(scrape_links_from_url(deep_dive_links[0], max_depth - 1))
                except Exception as e:
                    logging.warning(f"Error during recursive scrape: {e}")
    except requests.RequestException as e:
        logging.warning(f"Error scraping {url}: {e}")
    return scraped_links

```

**