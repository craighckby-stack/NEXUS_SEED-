import pandas as pd
from IPython.display import display, HTML, clear_output
import pyperclip
from ipywidgets import Button, Text, Output, Layout
from typing import Dict
from abc import ABC, abstractmethod

class SearchAPI(ABC):
    @abstractmethod
    def search(self, topic: str) -> Dict:
        pass

class GoogleSearchAPI(SearchAPI):
    def search(self, topic: str) -> Dict:
        # Implement Google search API
        # For demonstration purposes, return a mock result
        return {
            topic: [
                "https://www.example.com",
                "https://www.example.org",
                "https://www.example.net"
            ]
        }

class NotebookController:
    def __init__(self, search_api: SearchAPI):
        self.topic_input = Text(
            value='',
            placeholder='Enter a topic to search...',
            description='Add Topic:',
            disabled=False,
            layout=Layout(width='100%')
        )
        
        self.add_topic_button = Button(
            description='Add Topic & Search',
            disabled=False,
            button_style='',
            tooltip='Add a topic to the list and search',
            icon=''
        )
        
        self.scrape_button = Button(
            description="Scrape Learning Resources",
            disabled=False,
            button_style='success',
            tooltip="Search for resources based on",
            icon='search'
        )
        
        self.clear_all_button = Button(
            description="Clear All Topics and Hashes",
            disabled=False,
            button_style='warning',
            tooltip="Remove all topics and hashes",
            icon='remove'
        )
        
        self.copy_all_button = Button(
            description="Copy All URLs",
            disabled=False,
            button_style='info',
            tooltip="Copy all URLs to clipboard",
            icon='copy'
        )
        
        self.output = Output()
        
        self.add_topic_button.on_click(self.add_topic_clicked)
        self.copy_all_button.on_click(self.copy_all_links_to_clipboard)
        self.scrape_button.on_click(self.display_links)
        
        self.search_api = search_api
        self.results = {}

    def display_links(self, b):
        """Displays the URLs, grouped by topic."""
        with self.output:
            clear_output(wait=True)
            if self.results:
                html_output = "<h2>Search Results</h2>"
                for topic, links in self.results.items():
                    html_output += f"<h3>{topic}</h3>"
                    html_output += "<ul>"
                    for link in links:
                        html_output += f"<li><a href='{link}'>{link}</a></li>"
                    html_output += "</ul>"
                display(HTML(html_output))
            else:
                print("No results found. Run the search again.")

    def copy_all_links_to_clipboard(self, b):
        """Copies all URLs to the clipboard."""
        all_links_list = [link for topic, links in self.results.items() for link in links]
        if all_links_list:
            text_to_copy = "\n".join(all_links_list)
            pyperclip.copy(text_to_copy)
            print("All URLs copied to clipboard")
        else:
            print("No URLs to copy.")

    def add_topic_clicked(self, b):
        """Handles the "Add Topic & Search" button click."""
        topic = self.topic_input.value
        self.results[topic] = self.search_api.search(topic)[topic]
        self.display_links(None)

    def run_notebook(self):
        display(self.topic_input)
        display(self.add_topic_button)
        display(self.scrape_button)
        display(self.clear_all_button)
        display(self.copy_all_button)
        display(self.output)

search_api = GoogleSearchAPI()
controller = NotebookController(search_api)
controller.run_notebook()