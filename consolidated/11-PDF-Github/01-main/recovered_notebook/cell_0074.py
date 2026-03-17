import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse
import logging
from typing import Set
import random

# Constants
NUM_RESULTS = 10  # Default number of search results
USER_AGENTS = [
    "Mozilla/5.0",
    "Chrome/91.0.4472.114",
    "Safari/537.36",
    "Firefox/89.0"
]

class SearchEngine:
    def __init__(self, name: str):
        """Initialize a search engine object"""
        self.name = name
        self.base_url = {
            "google": "https://www.google.com/search",
            "yahoo": "https://search.yahoo.com/search",
            "wayback": "https://web.archive.org/web/*/",
        }
        self.headers = {"User-Agent": self.get_user_agent()}

    def get_user_agent(self) -> str:
        """Returns a random user agent from the list"""
        return random.choice(USER_AGENTS)

    def search(self, query: str, num_results: int = NUM_RESULTS) -> Set[str]:
        """Searches the engine for a given query, returns a set of links"""
        search_url = self.base_url[self.name]
        links = set()
        try:
            with requests.Session() as session:
                response = session.get(search_url, headers=self.headers, params={"q": query})
                response.raise_for_status()
                soup = BeautifulSoup(response.text, 'html.parser')
                for a_tag in soup.find_all("a", href=True):
                    href = a_tag["href"]
                    if href.startswith("/url?q="):
                        # For Google, extract the real URL from the href
                        real_url = urlparse(href).query.split("=")[1]
                        if real_url.startswith("http"):
                            links.add(real_url)
                    elif href and href.startswith("http"):
                        # For Yahoo, add the href directly
                        links.add(href)
        except requests.exceptions.RequestException as e:
            logging.error(f"{self.name.capitalize()} Search Error: {e}")
        return links


def main():
    search_engines = {
        "google": SearchEngine("google"),
        "yahoo": SearchEngine("yahoo"),
        # "wayback": SearchEngine("wayback"),  # Incomplete implementation
    }

    for engine_name, engine in search_engines.items():
        try:
            links = engine.search("test query", num_results=5)
            print(f"{engine_name.capitalize()} Search Results: {links}")
        except Exception as e:
            logging.error(f"Error scraping links: {e}")


if __name__ == "__main__":
    logging.basicConfig(level=logging.ERROR)
    main()