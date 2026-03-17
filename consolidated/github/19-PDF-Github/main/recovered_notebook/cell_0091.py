# Import necessary libraries
import ipywidgets as widgets
from IPython.display import display
import requests
from bs4 import BeautifulSoup
import urllib.parse
import json
import pyperclip
import time
import random
import multiprocessing
import logging
import warnings
from urllib.parse import urlparse

# Define constants
SEARCH_ENGINE = "all"  # "all" or a specific engine

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Define a function to scrape learning resources
def scrape_learning_resources(topics):
    """
    Scrape learning resources based on given topics.

    Args:
        topics (list): List of topics to search for.

    Returns:
        dict: Dictionary of search results.
    """
    results = {}
    for topic in topics:
        try:
            # Send a GET request to the search engine
            url = f"https://www.google.com/search?q={urllib.parse.quote(topic)}"
            response = requests.get(url)
            soup = BeautifulSoup(response.text, 'html.parser')

            # Find all links on the page
            links = soup.find_all('a')

            # Filter links to only include those with 'robots.txt' in the URL
            robots_txt_links = [link.get('href') for link in links if 'robots.txt' in link.get('href', '')]

            # Add the links to the results dictionary
            results[topic] = robots_txt_links
        except Exception as e:
            logger.error(f"Error scraping {topic}: {e}")

    return results

# Define a function to handle topic input changes
def add_topic_clicked(change):
    """
    Handle topic input changes.

    Args:
        change (dict): Dictionary containing the new topic value.
    """
    topic = topic_input.value.strip()
    if topic:
        logger.info(f"Adding and searching for {topic}")
        # Scrape learning resources for the new topic
        results = scrape_learning_resources([topic])
        display_links(results)
    else:
        logger.info("Please enter a topic.")

# Define a function to handle the scrape all button click
def scrape_all_clicked(change):
    """
    Handle scrape all button click.

    Args:
        change (dict): Dictionary containing the button click event.
    """
    if initial_topics:
        logger.info("Scraping all topics")
        results = scrape_learning_resources(initial_topics)
        display_links(results)
    else:
        logger.info("No topics to scrape.")

# Define a function to handle the clear all button click
def clear_all_clicked(change):
    """
    Handle clear all button click.

    Args:
        change (dict): Dictionary containing the button click event.
    """
    topic_input.value = ''
    display_links({})
    logger.info("All topics and results cleared")

# Define a function to handle the copy all button click
def copy_all_clicked(change):
    """
    Handle copy all button click.

    Args:
        change (dict): Dictionary containing the button click event.
    """
    if hasattr(copy_all_button, 'result'):
        copy_all_links_to_clipboard(copy_all_button.result)
    else:
        logger.info("No results to copy. Please try again.")

# Define a function to display links
def display_links(links):
    """
    Display the given links.

    Args:
        links (dict): Dictionary of links to display.
    """
    output.clear_output()
    with output:
        for topic, topic_links in links.items():
            print(f"Links for {topic}:")
            for link in topic_links:
                print(link)

# Define a function to copy all links to the clipboard
def copy_all_links_to_clipboard(links):
    """
    Copy all links to the clipboard.

    Args:
        links (dict): Dictionary of links to copy.
    """
    link_text = "\n".join([link for topic_links in links.values() for link in topic_links])
    pyperclip.copy(link_text)

# Create the topic input widget
topic_input = widgets.Text(
    value='',
    placeholder='Enter a topic',
    description='Topic:',
    disabled=False
)

# Create the add topic button widget
add_topic_button = widgets.Button(description='Add Topic')
add_topic_button.on_click(add_topic_clicked)

# Create the scrape all button widget
scrape_button = widgets.Button(description='Scrape All')
scrape_button.on_click(scrape_all_clicked)

# Create the clear all button widget
clear_all_button = widgets.Button(description='Clear All')
clear_all_button.on_click(clear_all_clicked)

# Create the copy all button widget
copy_all_button = widgets.Button(description='Copy All')
copy_all_button.on_click(copy_all_clicked)

# Create the output widget
output = widgets.Output()

# Display the widgets
display(widgets.VBox([topic_input, add_topic_button, scrape_button, clear_all_button, copy_all_button, output]))

# Initial topics
initial_topics = ['python', 'java', 'javascript']

# Scrape learning resources for the initial topics
results = scrape_learning_resources(initial_topics)
display_links(results)