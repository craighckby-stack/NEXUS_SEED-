import re
import requests
from urllib3.exceptions import HeaderParsingError
from logging import getLogger, INFO, WARNING

# Set up logging
logger = getLogger(__name__)
logger.setLevel(INFO)

# Define a function to fetch robots.txt
def fetch_robots_txt(url):
    try:
        response = requests.get(f"{url}/robots.txt")
        response.raise_for_status()
        logger.info(f"{url}: OK - robots.txt fetched successfully")
        return response.text
    except requests.RequestException as e:
        logger.warning(f"{url}: Failed to fetch robots.txt - {e}")
        return None

# Define a function to fetch sitemap
def fetch_sitemap(url):
    try:
        response = requests.get(f"{url}/sitemap.xml")
        response.raise_for_status()
        logger.info(f"{url}: OK - sitemap fetched successfully")
        return response.text
    except requests.RequestException as e:
        logger.warning(f"{url}: Failed to fetch sitemap - {e}")
        return None

# Define a list of URLs to fetch
urls = [
    "https://www.bankofbaroda.in",
    "https://bankofindia.co.in",
    "https://www.bankofindia.co.in",
    "https://bankofmaharashtra.in",
    "https://canarabank.com",
    "https://www.centralbankofindia.co.in/en",
    "https://www.indianbank.in",
]

# Fetch robots.txt and sitemap for each URL
for url in urls:
    robots_txt = fetch_robots_txt(url)
    if robots_txt:
        logger.debug(f"Successfully fetched robots.txt from {url}")
    
    sitemap = fetch_sitemap(url)
    if sitemap:
        logger.debug(f"Successfully fetched sitemap from {url}")

# Log scraping completion
logger.info("Scraping complete. The hardcore journey is done!")

# Handle HeaderParsingError
def handle_header_parsing_error(url):
    try:
        response = requests.get(f"{url}/robots.txt", headers={"User-Agent": "Mozilla/5.0"})
        response.raise_for_status()
        logger.info(f"{url}: OK - robots.txt fetched successfully")
    except HeaderParsingError as e:
        logger.warning(f"{url}: Failed to parse headers - {e}")

# Test the handle_header_parsing_error function
handle_header_parsing_error("https://www.iob.in")