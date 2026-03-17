import ipywidgets as widgets
from bs4 import BeautifulSoup
import requests
from bs4 import element
import urllib.parse
import pyperclip
import logging
from IPython.display import display, HTML
import json
import multiprocessing
import random
import time

class ResourceScraper:
    def __init__(self):
        self.all_links = {}
        self.initial_topics = []
        self.topic_input = widgets.Text(value='', placeholder='Enter topic', description='Topic:')
        self.add_topic_button = widgets.Button(description='Add Topic')
        self.scrape_button = widgets.Button(description='Scrape Learning Resources')
        self.clear_all_button = widgets.Button(description='Clear All Topics and Hashes')
        self.copy_all_button = widgets.Button(description='Copy All Hashes')
        self.output = widgets.Output()
        self.display_widgets()

    def add_topic_clicked(self, b):
        topic = self.topic_input.value
        if topic:
            self.initial_topics.append(topic)
            self.topic_input.value = ''

    def scrape_all_clicked(self, b):
        if self.initial_topics or self.all_links:
            self.scrape_learning_resources(self.initial_topics)
        else:
            print("No topics to scrape.")

    def clear_all_clicked(self, b):
        self.all_links = {}
        self.topic_input.value = ''
        self.save_links()
        self.display_links()
        print("All topics and hashes cleared")

    def copy_all_clicked(self, b):
        self.copy_all_links_to_clipboard()

    def scrape_learning_resources(self, topics):
        self.output.clear_output()
        with self.output:
            for topic in topics:
                print(f"Searching for resources on: {topic}")
                url = f"https://www.google.com/search?q={topic}"
                response = requests.get(url)
                soup = BeautifulSoup(response.text, 'html.parser')
                links = soup.find_all('a')
                for link in links:
                    href = link.get('href')
                    if href and href.startswith('http'):
                        self.all_links[topic] = self.all_links.get(topic, []) + [href]

    def save_links(self):
        with open('links.json', 'w') as f:
            json.dump(self.all_links, f)

    def display_links(self):
        with open('links.json', 'r') as f:
            self.all_links = json.load(f)
        self.output.clear_output()
        with self.output:
            for topic, links in self.all_links.items():
                print(f"Resources for {topic}:")
                for link in links:
                    print(link)

    def copy_all_links_to_clipboard(self):
        links = [link for links in self.all_links.values() for link in links]
        pyperclip.copy('\n'.join(links))

    def display_widgets(self):
        self.add_topic_button.on_click(self.add_topic_clicked)
        self.scrape_button.on_click(self.scrape_all_clicked)
        self.clear_all_button.on_click(self.clear_all_clicked)
        self.copy_all_button.on_click(self.copy_all_clicked)
        display(self.topic_input)
        display(self.add_topic_button)
        display(self.scrape_button)
        display(self.clear_all_button)
        display(self.copy_all_button)
        display(self.output)

    def start_scraper(self):
        self.scrape_button.on_click(self.scrape_all_clicked)
        display(self.display_widgets())

if __name__ == "__main__":
    scraper = ResourceScraper()
    scraper.start_scraper()