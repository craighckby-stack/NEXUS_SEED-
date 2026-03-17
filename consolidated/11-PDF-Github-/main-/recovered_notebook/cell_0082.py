import json
import logging
import random
import hashlib
import os
from bs4 import BeautifulSoup
import requests

# Constants
SEARCH_ENGINE = "google"
NUM_RESULTS = 5
MAX_PROCESSES = 5
TIMEOUT = 10
MAX_DEEP_DIVE_DEPTH = 2

# User agents
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.3",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36 Edge/18.17763",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.3",
    "Mozilla/5.0 (Android 10; Mobile; rv:68.0) Gecko/68.0 Firefox/68.0"
]

# Initial topics
initial_topics = [
    "Python programming",
    "JavaScript fundamentals",
    "Data structures and algorithms",
    "Machine learning with Python",
    "Deep learning with TensorFlow",
    "React.js tutorial",
    "Java programming tutorial",
    "SQL for beginners",
    "Git and version control",
    "Cloud computing (AWS, Azure, GCP)",
    "Cybersecurity fundamentals",
    "Blockchain technology",
    "Artificial Intelligence",
    "Natural Language Processing",
    "Computer Vision",
    "Operating Systems",
    "Networking",
    "Databases",
    "Software Engineering",
    "Web Development",
    "Mobile App Development",
    "Game Development",
    "Data Science"
]

# Logging configuration
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

def get_user_agent() -> str:
    """Randomly selects a user agent."""
    return random.choice(USER_AGENTS)

def generate_sha256_hash(url: str) -> str:
    """Generates a SHA-256 hash for a given URL."""
    try:
        return hashlib.sha256(url.encode()).hexdigest()
    except Exception as e:
        logging.error(f"Error generating SHA-256 hash: {e}")
        return None

def load_links(filename: str = "universal_links.json") -> dict:
    """Loads links from a JSON file."""
    try:
        with open(filename, "r") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        logging.info(f"No previous links found or decoding error in {filename}")
        return {}
    except Exception as e:
        logging.error(f"An unexpected error occurred while loading links: {e}")
        return {}

def scrape_links_from_url(url: str, depth: int = 0, max_depth: int = MAX_DEEP_DIVE_DEPTH) -> dict:
    """Scrapes links from a URL."""
    if depth > max_depth:
        return {}
    
    try:
        headers = {'User-Agent': get_user_agent()}
        response = requests.get(url, headers=headers, timeout=TIMEOUT)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        logging.error(f"Error scraping {url}: {e}")
        return {}
    
    soup = BeautifulSoup(response.text, 'html.parser')
    links = {}
    
    for link in soup.find_all('a'):
        href = link.get('href')
        if href and href.startswith('http'):
            links[href] = scrape_links_from_url(href, depth + 1, max_depth)
    
    return links

def main():
    links = load_links()
    for topic in initial_topics:
        url = f"https://www.google.com/search?q={topic}"
        links[topic] = scrape_links_from_url(url)
    
    with open('universal_links.json', 'w') as f:
        json.dump(links, f, indent=4)

if __name__ == "__main__":
    main()