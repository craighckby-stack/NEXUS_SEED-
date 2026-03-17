import logging
import requests
from urllib.parse import urljoin
from bs4 import BeautifulSoup

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s:%(message)s')

class WaybackMachine:
    def __init__(self, url):
        """
        Initialize the WaybackMachine class.

        Args:
            url (str): The URL to scrape.
        """
        self.url = url
        self.headers = {'User-Agent': 'Mozilla/5.0'}

    def _get_page(self, url):
        """
        Get the HTML page from the given URL.

        Args:
            url (str): The URL to get the page from.

        Returns:
            str: The HTML page content.
        """
        try:
            response = requests.get(url, headers=self.headers, timeout=5)
            response.raise_for_status()
            return response.text
        except requests.RequestException as e:
            logging.error(f"Wayback Machine Search Error for '{self.url}': {e}")
            return None

    def scrape_links(self):
        """
        Scrape links from the given URL.

        Returns:
            list: A list of scraped links.
        """
        page = self._get_page(self.url)
        if page:
            soup = BeautifulSoup(page, 'html.parser')
            # Extract links from the page (adjust this according to your needs)
            links = [a['href'] for a in soup.find_all('a', href=True)]
            return links
        return []

def main():
    """
    Test the WaybackMachine class.
    """
    # Define the URLs to scrape
    urls = [
        'https://web.archive.org/web/*https://en.wikipedia.org/wiki/Game_Development',
        'https://web.archive.org/web/*https://en.wikipedia.org/wiki/Data_Science',
        # Add more URLs as needed
    ]

    # Scrape links from each URL
    for url in urls:
        wayback_machine = WaybackMachine(url)
        links = wayback_machine.scrape_links()
        if links:
            logging.info(f"Successfully scraped {len(links)} links from {url}")
        else:
            logging.warning(f"Error scraping links from {url}")


if __name__ == "__main__":
    main()