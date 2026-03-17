import ipywidgets as widgets
from IPython.display import display, HTML
import requests
from bs4 import BeautifulSoup
import urllib.parse
import json
import pyperclip
import time
import random
import multiprocessing
import logging

# Configuration
SEARCH_ENGINE = "all"  # Options: "google", "yahoo"
RESULTS_PER_PAGE = 5
MAX_PROCESSES = 5
TIMEOUT = 10
MAX_deep_dive_DEPTH = 2

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_2_2) AppleWebKit/537.36 (KHTML, like Gecko)",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:88.0) Gecko/20100101 Firefox/88.0",
    "Mozilla/5.0 (Android 10; Mobile; rv:68.0) Gecko/68.0 Firefox/68.0"
]

class ResourceScraper:
    def __init__(self, output_widget):
        self.output_widget = output_widget
        self.topic_input = widgets.Text(
            value="",
            placeholder="Enter topic",
            description="Topic:",
            disabled=False
        )
        self.add_topic_button = widgets.Button(description="Add Topic")
        self.scrape_button = widgets.Button(description="Scrape")
        self.clear_all_button = widgets.Button(description="Clear All")
        self.copy_all_button = widgets.Button(description="Copy All")
        self.display_ui()

        self.add_topic_button.on_click(self.add_topic_clicked)
        self.scrape_button.on_click(self.scrape_clicked)
        self.clear_all_button.on_click(self.clear_all_clicked)
        self.copy_all_button.on_click(self.copy_all_clicked)

    def display_ui(self):
        display(self.topic_input)
        display(self.add_topic_button)
        display(self.scrape_button)
        display(self.clear_all_button)
        display(self.copy_all_button)
        display(self.output_widget)

    def add_topic_clicked(self, _):
        # Add topic logic here
        topic = self.topic_input.value
        self.topic_input.value = ""
        self.output_widget.append_value(f"Added topic: {topic}")

    def scrape_clicked(self, _):
        self.scrape_learning_resources([self.topic_input.value])

    def clear_all_clicked(self, _):
        # Clear all logic here
        self.output_widget.clear_output()

    def copy_all_clicked(self, _):
        # Copy all logic here
        pyperclip.copy(self.output_widget.get_value())

    def scrape_learning_resources(self, topics):
        with multiprocessing.Pool(processes=MAX_PROCESSES) as pool:
            results = pool.map(self.scrape_resource, topics)
        self.output_widget.append_value('\n'.join(results))

    def scrape_resource(self, topic):
        try:
            # Send request to search engine
            response = requests.get(f"https://www.google.com/search?q={urllib.parse.quote(topic)}", headers={'User-Agent': random.choice(USER_AGENTS)}, timeout=TIMEOUT)

            # Parse HTML content
            soup = BeautifulSoup(response.text, 'html.parser')

            # Extract relevant information
            info = []
            for result in soup.find_all('div', class_='yuRUbf'):
                info.append(result.find('a').text)

            return f"Topic: {topic}\nResults: {info}"\
        except Exception as e:
            return f"Error scraping topic: {topic}\nError: {str(e)}"\

# Initialize output widget
output = widgets.Output()

# Create and display UI
scraper = ResourceScraper(output)
scraper.display_ui()